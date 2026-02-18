const express = require('express');
const { auth, roleGuard } = require('../middleware/auth');
const activityController = require('../controllers/activityController');
const router = express.Router();

router.get('/', auth, roleGuard(['admin', 'manager']), activityController.listActivityLogs);

module.exports = router;
