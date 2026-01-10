const express = require('express');
const router = express.Router();
const { getConversations, createOrGetConversation, getMessages, sendMessage, markAsRead, createGroupConversation, toggleMessageReaction, updateGroup } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createOrGetConversation);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/read', protect, markAsRead);
router.post('/messages', protect, upload.single('file'), sendMessage);
router.post('/groups', protect, upload.single('avatar'), createGroupConversation);
router.put('/groups/:id', protect, upload.single('avatar'), updateGroup);
router.post('/messages/:id/reactions', protect, toggleMessageReaction);

module.exports = router;
