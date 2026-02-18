const express = require('express');
const { adminAuth } = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const router = express.Router();

router.post('/setup', adminController.setup);
router.post('/login', adminController.login);
router.get('/me', adminAuth, adminController.getMe);
router.put('/profile', adminAuth, adminController.updateProfile);
router.put('/password', adminAuth, adminController.updatePassword);
router.get('/activity', adminAuth, adminController.getActivity);
router.get('/analytics', adminAuth, adminController.getAnalytics);

module.exports = router;
