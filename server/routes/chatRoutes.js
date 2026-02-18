const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const router = express.Router();

// Multer config for file uploads (memory storage for Cloudinary)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf',
            'application/zip', 'application/x-zip-compressed',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'text/csv',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    },
});

router.get('/conversations', auth, chatController.getConversations);
router.post('/conversations/project/:projectId', auth, chatController.getOrCreateProjectConversation);
router.get('/conversations/:id/messages', auth, chatController.getMessages);
router.post('/conversations/:id/messages', auth, chatController.sendMessage);
router.post('/upload', auth, upload.single('file'), chatController.uploadAttachment);
router.get('/unread-count', auth, chatController.getUnreadCount);
router.post('/conversations/:id/read', auth, chatController.markAsRead);
router.put('/messages/:id', auth, chatController.editMessage);
router.delete('/messages/:id', auth, chatController.deleteMessage);

module.exports = router;
