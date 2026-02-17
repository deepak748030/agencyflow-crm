const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/setup - Create default admin
router.post('/setup', async (req, res) => {
    try {
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists. Please login.',
            });
        }

        const admin = new User({
            name: 'Admin',
            email: 'admin@agencyflow.com',
            password: 'Admin@123',
            role: 'admin',
            designation: 'Super Admin',
        });
        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Default admin created successfully',
            response: { email: admin.email, name: admin.name },
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create admin' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        await ActivityLog.create({
            userId: user._id,
            action: 'user.login',
            resource: 'auth',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.json({
            success: true,
            response: { token, user: user.toJSON() },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
    res.json({ success: true, response: req.user.toJSON() });
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, avatar, phone, company, designation } = req.body;
        const user = req.user;

        if (name) user.name = name;
        if (email) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;
        if (phone !== undefined) user.phone = phone;
        if (company !== undefined) user.company = company;
        if (designation !== undefined) user.designation = designation;

        await user.save();
        res.json({ success: true, response: user.toJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// PUT /api/auth/password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both passwords required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        req.user.password = newPassword;
        await req.user.save();
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

module.exports = router;
