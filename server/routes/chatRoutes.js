const express = require('express');
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/conversations', auth, chatController.getConversations);
router.post('/conversations/project/:projectId', auth, chatController.getOrCreateProjectConversation);
router.get('/conversations/:id/messages', auth, chatController.getMessages);
router.post('/conversations/:id/messages', auth, chatController.sendMessage);
router.get('/unread-count', auth, chatController.getUnreadCount);
router.post('/conversations/:id/read', auth, chatController.markAsRead);
router.put('/messages/:id', auth, chatController.editMessage);
router.delete('/messages/:id', auth, chatController.deleteMessage);

module.exports = router;
