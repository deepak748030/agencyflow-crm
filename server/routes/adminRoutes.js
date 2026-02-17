const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const NaamJapUser = require('../models/NaamJapUser');
const DailyQuote = require('../models/DailyQuote');
const router = express.Router();

// Helper: get today's date string YYYY-MM-DD
const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST /api/admin/setup - Create default admin
router.post('/setup', async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({ email: 'admin@shreejii.com' });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Default admin already exists. Login with admin@shreejii.com',
            });
        }

        const admin = new Admin({
            name: 'Shree Jii Admin',
            email: 'admin@shreejii.com',
            password: 'Admin@123',
            role: 'superadmin',
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Default admin created successfully',
            response: {
                email: admin.email,
                name: admin.name,
            },
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create default admin' });
    }
});

// POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            response: {
                token,
                admin: admin.toJSON(),
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// GET /api/admin/me - Get current admin profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        res.json({ success: true, response: req.admin.toJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get profile' });
    }
});

// PUT /api/admin/profile - Update profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const admin = req.admin;

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (avatar !== undefined) admin.avatar = avatar;

        await admin.save();

        res.json({ success: true, response: admin.toJSON() });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

// PUT /api/admin/password - Update password
router.put('/password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const isMatch = await req.admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        req.admin.password = newPassword;
        await req.admin.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

// GET /api/admin/activity - Get admin activity
router.get('/activity', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            response: {
                admin: req.admin.toJSON(),
                activity: {
                    lastLogin: req.admin.lastLogin || req.admin.createdAt,
                    accountCreated: req.admin.createdAt,
                    stats: {
                        totalOrders: 0,
                        totalUsers: 0,
                        totalCoupons: 0,
                        totalCategories: 0,
                        totalBanners: 0,
                        totalDeliveryPartners: 0,
                    },
                },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get activity' });
    }
});

// GET /api/admin/analytics - Dashboard analytics (real Naam Jap data)
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        // Naam Jap stats
        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });
        const totals = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, totalMalas: { $sum: '$totalMalas' }, totalCount: { $sum: '$totalCount' } } },
        ]);

        const today = getTodayString();
        const todayActive = await NaamJapUser.countDocuments({
            isActive: true,
            'dailyLogs.date': today,
        });

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newThisWeek = await NaamJapUser.countDocuments({
            createdAt: { $gte: weekAgo },
        });

        // Daily Quotes stats
        const totalQuotes = await DailyQuote.countDocuments();
        const activeQuotes = await DailyQuote.countDocuments({ isActive: true });

        // Top 10 users
        const topUsersRaw = await NaamJapUser.find({ isActive: true })
            .sort({ totalMalas: -1 })
            .limit(10)
            .select('name city totalMalas totalCount lastSyncAt');

        // Daily activity for last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }

        const dailyActivityRaw = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$dailyLogs' },
            { $match: { 'dailyLogs.date': { $in: last7Days } } },
            {
                $group: {
                    _id: '$dailyLogs.date',
                    malas: { $sum: '$dailyLogs.malas' },
                    count: { $sum: '$dailyLogs.count' },
                    users: { $addToSet: '$_id' },
                },
            },
            { $project: { date: '$_id', malas: 1, count: 1, users: { $size: '$users' } } },
            { $sort: { date: 1 } },
        ]);

        res.json({
            success: true,
            response: {
                naamJap: {
                    totalUsers,
                    totalMalas: totals[0]?.totalMalas || 0,
                    totalCount: totals[0]?.totalCount || 0,
                    todayActiveUsers: todayActive,
                    newUsersThisWeek: newThisWeek,
                },
                dailyQuotes: {
                    total: totalQuotes,
                    active: activeQuotes,
                },
                topUsers: topUsersRaw.map((u, i) => ({
                    rank: i + 1,
                    name: u.name,
                    city: u.city,
                    malas: u.totalMalas,
                    count: u.totalCount,
                })),
                dailyActivity: last7Days.map((date) => {
                    const found = dailyActivityRaw.find((d) => d.date === date);
                    const shortDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    return {
                        name: shortDate,
                        malas: found?.malas || 0,
                        users: found?.users || 0,
                        count: found?.count || 0,
                    };
                }),
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to get analytics' });
    }
});

module.exports = router;
