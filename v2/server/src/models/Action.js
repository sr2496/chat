const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'completed'],
        default: 'open'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Action', actionSchema);
