const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const router = express.Router();

router.get('/analytics', auth, dashboardController.getAnalytics);

module.exports = router;
