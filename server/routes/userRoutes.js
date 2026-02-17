const express = require('express');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth, roleGuard } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - List users (with filters)
router.get('/', auth, roleGuard(['admin', 'manager']), async (req, res) => {
    try {
        const { role, search, page = 1, limit = 50, isActive } = req.query;
        const filter = {};

        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-password');

        res.json({
            success: true,
            response: {
                users,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// POST /api/users - Create user (Admin only)
router.post('/', auth, roleGuard(['admin']), async (req, res) => {
    try {
        const { name, email, password, role, phone, company, designation } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const user = new User({ name, email, password, role, phone, company, designation });
        await user.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'user.created',
            resource: 'user',
            resourceId: user._id,
            details: { name, email, role },
            ip: req.ip,
        });

        res.status(201).json({ success: true, response: user.toJSON() });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, response: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', auth, roleGuard(['admin']), async (req, res) => {
    try {
        const { name, email, role, phone, company, designation, isActive } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (phone !== undefined) user.phone = phone;
        if (company !== undefined) user.company = company;
        if (designation !== undefined) user.designation = designation;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'user.updated',
            resource: 'user',
            resourceId: user._id,
            ip: req.ip,
        });

        res.json({ success: true, response: user.toJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Deactivate user (Admin only)
router.delete('/:id', auth, roleGuard(['admin']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isActive = false;
        await user.save();

        await ActivityLog.create({
            userId: req.user._id,
            action: 'user.deactivated',
            resource: 'user',
            resourceId: user._id,
            ip: req.ip,
        });

        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to deactivate user' });
    }
});

module.exports = router;
