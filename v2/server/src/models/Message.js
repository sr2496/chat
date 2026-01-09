const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    type: { type: String, enum: ['text', 'image', 'audio', 'video', 'file'], default: 'text' },
    attachment_url: { type: String },
    file_name: { type: String },
    file_size: { type: Number },
    read_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [reactionSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
