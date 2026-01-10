const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const fs = require('fs');

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
            .populate({
                path: 'reply_to',
                populate: { path: 'sender_id', select: 'name' }
            })
            .populate('reactions.user_id', 'name')
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
    const { conversation_id, content, type, reply_to } = req.body;

    if (!conversation_id || conversation_id === 'undefined' || conversation_id === 'null') {
        console.error('sendMessage missing conversation_id', req.body);
        return res.status(400).json({ message: 'Conversation ID is required' });
    }

    let messageData = {
        conversation_id,
        sender_id: req.user._id,
        content: content || '',
        type: type || 'text',
        type: type || 'text',
        read_by: [req.user._id]
    };

    if (reply_to && reply_to !== 'null' && reply_to !== 'undefined') {
        messageData.reply_to = reply_to;
    }

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
        const conversation = await Conversation.findByIdAndUpdate(conversation_id, {
            last_message: message._id
        });

        const fullMessage = await Message.findById(message._id)
            .populate('sender_id', 'name avatar')
            .populate({
                path: 'reply_to',
                populate: { path: 'sender_id', select: 'name' }
            })
            .populate('reactions.user_id', 'name');

        // Socket.io integration
        req.io.to(conversation_id).emit('message_received', fullMessage);

        // Emit to each participant to ensure ChatList updates
        if (conversation && conversation.participants) {
            conversation.participants.forEach(userId => {
                const uid = userId.toString();
                if (uid === req.user._id.toString()) return;
                req.io.to(uid).emit('message_received', fullMessage);
            });
        }

        res.status(201).json(fullMessage);
    } catch (error) {
        fs.writeFileSync('error_log.txt', error.stack || error.message);
        console.error(error);
        res.status(500).json({ message: error.message, stack: error.stack });
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

        // Create System Message
        const systemMessage = await Message.create({
            conversation_id: conversation._id,
            sender_id: req.user._id,
            content: `${req.user.name} created the group "${name}"`,
            type: 'system',
            read_by: [req.user._id]
        });

        conversation.last_message = systemMessage._id;
        await conversation.save();

        const fullConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name email avatar online')
            .populate('admins', 'name email')
            .populate('last_message');

        const fullSystemMessage = await Message.findById(systemMessage._id)
            .populate('sender_id', 'name avatar');

        // Notify all participants
        fullConversation.participants.forEach(p => {
            req.io.to(p._id.toString()).emit('message_received', fullSystemMessage);
        });

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
        await message.populate('reactions.user_id', 'name');

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

const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, participants: newParticipantsStr } = req.body;

        let newParticipants = [];
        if (newParticipantsStr) {
            try {
                newParticipants = JSON.parse(newParticipantsStr);
            } catch (e) {
                if (typeof newParticipantsStr === 'string')
                    newParticipants = newParticipantsStr.split(',');
                else newParticipants = [newParticipantsStr];
            }
        }

        const conversation = await Conversation.findById(id);
        if (!conversation) return res.status(404).json({ message: 'Group not found' });
        if (conversation.type !== 'group') return res.status(400).json({ message: 'Not a group' });

        const isAdmin = conversation.admins.some(adminId => adminId.toString() === req.user._id.toString());
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can update group info' });

        if (name) conversation.name = name;
        if (req.file) conversation.display_avatar = `/uploads/${req.file.filename}`;

        if (newParticipants && newParticipants.length > 0) {
            const usersToAdd = newParticipants.filter(uid => !conversation.participants.includes(uid));
            if (usersToAdd.length > 0) {
                conversation.participants.push(...usersToAdd);

                const addedUserNames = await User.find({ _id: { $in: usersToAdd } }).select('name');
                const namesStr = addedUserNames.map(u => u.name).join(', ');

                const systemMessage = await Message.create({
                    conversation_id: conversation._id,
                    sender_id: req.user._id,
                    content: `${req.user.name} added ${namesStr}`,
                    type: 'system',
                    read_by: [req.user._id]
                });
                conversation.last_message = systemMessage._id;

                // Populate system message sender
                const fullSystemMessage = await Message.findById(systemMessage._id).populate('sender_id', 'name avatar');

                req.io.to(id).emit('message_received', fullSystemMessage);
            }
        }

        await conversation.save();

        const fullConversation = await Conversation.findById(id)
            .populate('participants', 'name email avatar online')
            .populate('admins', 'name email')
            .populate('last_message');

        // Notify all participants
        fullConversation.participants.forEach(p => {
            req.io.to(p._id.toString()).emit('conversation_updated', fullConversation);
            // Also ensure new participants get the "message_received" event if they weren't in the room yet
            // The loop above emits to user-specific room, so they WILL get it.
        });

        res.json(fullConversation);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Update failed' });
    }
};

module.exports = { getConversations, createOrGetConversation, getMessages, sendMessage, markAsRead, createGroupConversation, toggleMessageReaction, updateGroup };
