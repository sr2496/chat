const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for the current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.user._id] }
        })
            .populate({
                path: 'participants',
                select: 'name email avatar online last_seen',
            })
            .populate('last_message')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Conversation.countDocuments({
            participants: { $in: [req.user._id] }
        });

        // Transform data to include unread counts
        const populatedConversations = await Promise.all(conversations.map(async (conv) => {
            const unreadCount = await Message.countDocuments({
                conversation_id: conv._id,
                sender_id: { $ne: req.user._id },
                read_by: { $ne: req.user._id }
            });

            return {
                ...conv.toObject(),
                unreadCount
            };
        }));

        res.status(200).json({
            conversations: populatedConversations,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or get a one-on-one conversation
// @route   POST /api/chat/conversations
// @access  Private
const createOrGetConversation = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Check if conversation exists
        let conversation = await Conversation.findOne({
            type: 'private',
            participants: { $all: [req.user._id, userId] }
        })
            .populate('participants', 'name email avatar online')
            .populate('last_message');

        if (conversation) {
            return res.status(200).json(conversation);
        }

        // Create new conversation
        const newConversation = await Conversation.create({
            type: 'private',
            participants: [req.user._id, userId]
        });

        conversation = await Conversation.findById(newConversation._id)
            .populate('participants', 'name email avatar online');

        res.status(201).json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    try {
        const { id } = req.params;
        // Verify user is a participant
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(440).json({ message: 'Conversation not found' });
        }
        if (!conversation.participants.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        const messages = await Message.find({ conversation_id: id })
            .populate('sender_id', 'name avatar')
            .sort({ createdAt: -1 }) // Newest first for pagination
            .skip(skip)
            .limit(limit);

        const total = await Message.countDocuments({ conversation_id: id });

        // Reverse messages to show oldest first in chat window
        res.status(200).json({
            messages: messages.reverse(),
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
    const { conversation_id, content, type } = req.body;
    let messageData = {
        conversation_id,
        sender_id: req.user._id,
        content: content || '',
        type: type || 'text',
        read_by: [req.user._id]
    };

    if (req.file) {
        messageData.attachment_url = `/uploads/${req.file.filename}`;
        messageData.file_name = req.file.originalname;
        messageData.file_size = req.file.size;
        messageData.type = type || 'file'; // Default to file if not specified

        // Auto-detect type if not provided generally
        if (!type) {
            if (req.file.mimetype.startsWith('image/')) messageData.type = 'image';
            else if (req.file.mimetype.startsWith('video/')) messageData.type = 'video';
            else if (req.file.mimetype.startsWith('audio/')) messageData.type = 'audio';
        }
    }

    try {
        const message = await Message.create(messageData);

        // Update conversation's last message
        await Conversation.findByIdAndUpdate(conversation_id, {
            last_message: message._id
        });

        const fullMessage = await Message.findById(message._id)
            .populate('sender_id', 'name avatar');

        // Socket.io integration
        req.io.to(conversation_id).emit('message_received', fullMessage);

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Mark messages as read
// @route   POST /api/chat/conversations/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    const { id } = req.params;

    try {
        await Message.updateMany(
            {
                conversation_id: id,
                read_by: { $ne: req.user._id }
            },
            {
                $addToSet: { read_by: req.user._id }
            }
        );

        // Notify room
        req.io.to(id).emit('messages_read', {
            conversationId: id,
            userId: req.user._id
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

const createGroupConversation = async (req, res) => {
    try {
        let { name, participants } = req.body;

        if (typeof participants === 'string') {
            try {
                participants = JSON.parse(participants);
            } catch (e) {
                if (participants.includes(',')) participants = participants.split(',');
                else participants = [participants];
            }
        }

        if (!participants || participants.length === 0) {
            return res.status(400).json({ message: "Please add participants" });
        }

        if (!participants.includes(req.user._id.toString())) {
            participants.push(req.user._id.toString());
        }

        let conversationData = {
            type: 'group',
            name,
            participants,
            admins: [req.user._id]
        };

        if (req.file) {
            conversationData.display_avatar = `/uploads/${req.file.filename}`;
        }

        const conversation = await Conversation.create(conversationData);

        const fullConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name email avatar online')
            .populate('admins', 'name email');

        res.status(201).json(fullConversation);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create group' });
    }
};

const toggleMessageReaction = async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;

    try {
        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Check for existing reaction by this user
        const existingIdx = message.reactions.findIndex(r => r.user_id.toString() === req.user._id.toString());

        if (existingIdx > -1) {
            const existing = message.reactions[existingIdx];
            if (existing.emoji === emoji) {
                // Same emoji -> remove
                message.reactions.splice(existingIdx, 1);
            } else {
                // Different emoji -> replace
                message.reactions[existingIdx].emoji = emoji;
            }
        } else {
            // New reaction
            message.reactions.push({ user_id: req.user._id, emoji });
        }

        await message.save();

        req.io.to(message.conversation_id.toString()).emit('message_reaction_update', {
            messageId: message._id,
            reactions: message.reactions
        });

        res.status(200).json(message);

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { getConversations, createOrGetConversation, getMessages, sendMessage, markAsRead, createGroupConversation, toggleMessageReaction };
