const Action = require('../models/Action');
const Notification = require('../models/Notification');

exports.createAction = async (req, res) => {
    try {
        const { title, description, conversation, message, assignedTo, dueDate, priority } = req.body;

        const action = await Action.create({
            title,
            description,
            conversation,
            message,
            createdBy: req.user._id,
            assignedTo,
            dueDate,
            priority
        });

        const populatedAction = await Action.findById(action._id)
            .populate('assignedTo', 'name avatar email')
            .populate('createdBy', 'name avatar email');

        // Notify via socket (General update to chat room)
        req.io.to(conversation).emit('new_action', populatedAction);

        // Notify Assignee
        if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
            try {
                const notification = await Notification.create({
                    recipient: assignedTo,
                    sender: req.user._id,
                    type: 'action_assigned',
                    message: `Assigned a new action to you: "${title}"`,
                    relatedId: action._id,
                    conversationId: conversation
                });

                req.io.to(assignedTo.toString()).emit('action_notification', {
                    id: notification._id,
                    conversationId: conversation,
                    senderName: req.user.name,
                    avatar: req.user.avatar,
                    isOnline: true,
                    message: notification.message,
                    conversationName: 'Action Item'
                });
            } catch (err) {
                console.error("Failed to create notification", err);
            }
        }

        res.status(201).json(populatedAction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getActions = async (req, res) => {
    try {
        const { status, filter } = req.query; // filter: 'created_by_me', 'assigned_to_me' or conversationId

        let query = {};

        if (status) {
            query.status = status;
        }

        if (filter === 'created_by_me') {
            query.createdBy = req.user._id;
        } else if (filter === 'assigned_to_me') {
            query.assignedTo = req.user._id;
        } else if (filter) {
            // Assume filter is conversation ID if not a keyword
            query.conversation = filter;
        } else {
            // Default to actions involving the user
            query.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
        }

        const actions = await Action.find(query)
            .populate('assignedTo', 'name avatar email')
            .populate('createdBy', 'name avatar email')
            .sort({ createdAt: -1 });

        res.json(actions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateAction = async (req, res) => {
    try {
        const { status, title, description, assignedTo, dueDate, priority } = req.body;

        let action = await Action.findById(req.params.id);

        if (!action) {
            return res.status(404).json({ message: 'Action not found' });
        }

        const oldStatus = action.status;

        if (status) action.status = status;
        if (title) action.title = title;
        if (description) action.description = description;
        if (assignedTo) action.assignedTo = assignedTo;
        if (dueDate) action.dueDate = dueDate;
        if (priority) action.priority = priority;

        await action.save();

        const updatedAction = await Action.findById(action._id)
            .populate('assignedTo', 'name avatar email')
            .populate('createdBy', 'name avatar email');

        // Notify Chat Room
        req.io.to(action.conversation.toString()).emit('action_updated', updatedAction);

        // Notify Creator on Status Update (if updater is not creator)
        if (status && status !== oldStatus && updatedAction.createdBy._id.toString() !== req.user._id.toString()) {
            try {
                const notification = await Notification.create({
                    recipient: updatedAction.createdBy._id,
                    sender: req.user._id,
                    type: 'action_status_change',
                    message: `Action "${updatedAction.title}" status updated to ${updatedAction.status}`,
                    relatedId: updatedAction._id,
                    conversationId: updatedAction.conversation
                });

                req.io.to(updatedAction.createdBy._id.toString()).emit('action_notification', {
                    id: notification._id,
                    conversationId: updatedAction.conversation,
                    senderName: req.user.name,
                    avatar: req.user.avatar,
                    isOnline: true,
                    message: notification.message,
                    conversationName: 'Action Update'
                });
            } catch (err) {
                console.error("Failed to create notification", err);
            }
        }

        res.json(updatedAction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteAction = async (req, res) => {
    try {
        const action = await Action.findById(req.params.id);
        if (!action) return res.status(404).json({ message: 'Action not found' });

        if (action.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Action.findByIdAndDelete(req.params.id);

        req.io.to(action.conversation.toString()).emit('action_deleted', req.params.id);

        res.json({ message: 'Action deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
