const express = require('express');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/setup', authController.setup);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, authController.updateProfile);
router.put('/password', auth, authController.updatePassword);

module.exports = router;
