const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleGuard } = require('../middleware/auth');
const router = express.Router();

// GET /api/activity - List activity logs with filters
router.get('/', auth, roleGuard(['admin', 'manager']), async (req, res) => {
    try {
        const { action, resource, userId, page = 1, limit = 50, search } = req.query;
        const filter = {};

        if (action) filter.action = { $regex: action, $options: 'i' };
        if (resource) filter.resource = resource;
        if (userId) filter.userId = userId;
        if (search) {
            filter.$or = [
                { action: { $regex: search, $options: 'i' } },
                { resource: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await ActivityLog.countDocuments(filter);
        const logs = await ActivityLog.find(filter)
            .populate('userId', 'name email role avatar')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            response: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
    }
});

module.exports = router;
