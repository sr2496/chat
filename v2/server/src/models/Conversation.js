const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    name: { type: String }, // Only for groups
    display_avatar: { type: String },
    description: { type: String },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Only for groups
    last_message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
