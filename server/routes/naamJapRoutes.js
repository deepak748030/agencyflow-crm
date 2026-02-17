const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const NaamJapUser = require('../models/NaamJapUser');
const router = express.Router();

// Admin auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Helper: get today's date string YYYY-MM-DD in Indian timezone (IST)
const getTodayString = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset);
    return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
};

// ============ PUBLIC ROUTES (for mobile app) ============

// POST /api/naam-jap/auth-mobile - Login or register by mobile number
router.post('/auth-mobile', async (req, res) => {
    try {
        const { mobile, deviceId, pushToken } = req.body;

        if (!mobile || !deviceId) {
            return res.status(400).json({
                success: false,
                message: 'mobile and deviceId are required',
            });
        }

        const trimmedMobile = String(mobile).trim().replace(/[^0-9]/g, '');
        if (trimmedMobile.length < 10 || trimmedMobile.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number',
            });
        }

        // Check if user exists with this mobile number
        let user = await NaamJapUser.findOne({ mobile: trimmedMobile });

        if (user) {
            // Update deviceId if different
            if (user.deviceId !== deviceId) {
                user.deviceId = deviceId;
            }
            // Update push token if provided
            if (pushToken) {
                user.pushToken = pushToken;
            }
            await user.save();
            return res.json({
                success: true,
                isNewUser: false,
                response: user,
            });
        }

        // New user - return that registration is needed
        return res.json({
            success: true,
            isNewUser: true,
            response: null,
        });
    } catch (error) {
        console.error('Auth mobile error:', error);
        res.status(500).json({ success: false, message: 'Failed to authenticate' });
    }
});

// POST /api/naam-jap/register - Register or update user info
router.post('/register', async (req, res) => {
    try {
        const { deviceId, name, city, mobile, pushToken } = req.body;
        console.log('=== NAAM JAP REGISTER ===');

        if (!deviceId || !name || !city || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'deviceId, name, city, and mobile are required',
            });
        }

        const trimmedName = String(name).trim().slice(0, 100);
        const trimmedCity = String(city).trim().slice(0, 100);

        if (!trimmedName || !trimmedCity) {
            return res.status(400).json({
                success: false,
                message: 'name and city cannot be empty',
            });
        }

        const trimmedMobile = String(mobile).trim().replace(/[^0-9]/g, '');

        // Check if mobile already registered to another user
        let existingMobileUser = await NaamJapUser.findOne({ mobile: trimmedMobile, deviceId: { $ne: deviceId } });
        if (existingMobileUser) {
            return res.status(400).json({
                success: false,
                message: 'This mobile number is already registered',
            });
        }

        let user = await NaamJapUser.findOne({ deviceId });

        if (user) {
            user.name = trimmedName;
            user.city = trimmedCity;
            user.mobile = trimmedMobile;
            if (pushToken) user.pushToken = pushToken;
            await user.save();
        } else {
            user = new NaamJapUser({
                deviceId,
                mobile: trimmedMobile,
                name: trimmedName,
                city: trimmedCity,
                pushToken: pushToken || null,
            });
            await user.save();
        }

        console.log('=== REGISTER COMPLETE ===');
        res.json({ success: true, response: user });
    } catch (error) {
        console.error('NaamJap register error:', error);
        res.status(500).json({ success: false, message: 'Failed to register user' });
    }
});

// POST /api/naam-jap/sync - Sync count data from device
router.post('/sync', async (req, res) => {
    try {
        const { deviceId, totalCount, totalMalas, todayCount, todayMalas } = req.body;

        if (!deviceId) {
            return res.status(400).json({ success: false, message: 'deviceId is required' });
        }

        const user = await NaamJapUser.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found. Please register first.' });
        }

        // Update totals
        user.totalCount = Math.max(0, Number(totalCount) || 0);
        user.totalMalas = Math.max(0, Number(totalMalas) || 0);
        user.lastSyncAt = new Date();

        // Update today's daily log
        const today = getTodayString();
        const existingLog = user.dailyLogs.find(log => log.date === today);
        if (existingLog) {
            existingLog.count = Math.max(0, Number(todayCount) || 0);
            existingLog.malas = Math.max(0, Number(todayMalas) || 0);
        } else {
            // Keep only last 90 days of logs
            if (user.dailyLogs.length >= 90) {
                user.dailyLogs.sort((a, b) => a.date.localeCompare(b.date));
                user.dailyLogs = user.dailyLogs.slice(-89);
            }
            user.dailyLogs.push({
                date: today,
                count: Math.max(0, Number(todayCount) || 0),
                malas: Math.max(0, Number(todayMalas) || 0),
            });
        }

        await user.save();

        // Get user's rank
        const rank = await NaamJapUser.countDocuments({
            isActive: true,
            totalMalas: { $gt: user.totalMalas },
        }) + 1;

        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });

        res.json({
            success: true,
            response: {
                user,
                rank,
                totalUsers,
            },
        });
    } catch (error) {
        console.error('NaamJap sync error:', error);
        res.status(500).json({ success: false, message: 'Failed to sync data' });
    }
});

// GET /api/naam-jap/leaderboard - Get top users
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 200, 500);
        const period = req.query.period || 'all'; // all, daily, weekly, monthly

        let users;

        if (period === 'all') {
            users = await NaamJapUser.find({ isActive: true })
                .sort({ totalMalas: -1 })
                .limit(limit)
                .select('name city totalMalas totalCount');
        } else {
            // For period-based, we aggregate from dailyLogs
            const now = new Date();
            let startDate;

            if (period === 'daily') {
                startDate = getTodayString();
            } else if (period === 'weekly') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                startDate = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
            } else if (period === 'monthly') {
                const monthAgo = new Date(now);
                monthAgo.setDate(monthAgo.getDate() - 30);
                startDate = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
            }

            users = await NaamJapUser.aggregate([
                { $match: { isActive: true } },
                { $unwind: '$dailyLogs' },
                { $match: { 'dailyLogs.date': { $gte: startDate } } },
                {
                    $group: {
                        _id: '$_id',
                        name: { $first: '$name' },
                        city: { $first: '$city' },
                        periodMalas: { $sum: '$dailyLogs.malas' },
                        periodCount: { $sum: '$dailyLogs.count' },
                    },
                },
                { $sort: { periodMalas: -1 } },
                { $limit: limit },
                {
                    $project: {
                        name: 1,
                        city: 1,
                        totalMalas: '$periodMalas',
                        totalCount: '$periodCount',
                    },
                },
            ]);
        }

        res.json({
            success: true,
            response: users.map((u, i) => ({
                rank: i + 1,
                name: u.name,
                city: u.city,
                malas: u.totalMalas || 0,
                count: u.totalCount || 0,
            })),
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to get leaderboard' });
    }
});

// GET /api/naam-jap/stats - Get worldwide stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });

        const totals = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalMalas: { $sum: '$totalMalas' },
                    totalCount: { $sum: '$totalCount' },
                },
            },
        ]);

        const allTimeMalas = totals[0]?.totalMalas || 0;

        // Weekly stats
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStart = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;

        const weeklyStats = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$dailyLogs' },
            { $match: { 'dailyLogs.date': { $gte: weekStart } } },
            {
                $group: {
                    _id: null,
                    weeklyMalas: { $sum: '$dailyLogs.malas' },
                    weeklyUsers: { $addToSet: '$_id' },
                },
            },
            {
                $project: {
                    weeklyMalas: 1,
                    weeklyUsers: { $size: '$weeklyUsers' },
                },
            },
        ]);

        // Monthly stats
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthStart = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;

        const monthlyStats = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$dailyLogs' },
            { $match: { 'dailyLogs.date': { $gte: monthStart } } },
            {
                $group: {
                    _id: null,
                    monthlyMalas: { $sum: '$dailyLogs.malas' },
                    monthlyUsers: { $addToSet: '$_id' },
                },
            },
            {
                $project: {
                    monthlyMalas: 1,
                    monthlyUsers: { $size: '$monthlyUsers' },
                },
            },
        ]);

        res.json({
            success: true,
            response: {
                allTimeUsers: totalUsers,
                allTimeMalas: allTimeMalas,
                weeklyUsers: weeklyStats[0]?.weeklyUsers || 0,
                weeklyMalas: weeklyStats[0]?.weeklyMalas || 0,
                monthlyUsers: monthlyStats[0]?.monthlyUsers || 0,
                monthlyMalas: monthlyStats[0]?.monthlyMalas || 0,
            },
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
});

// GET /api/naam-jap/user/:deviceId - Get user data + rank
router.get('/user/:deviceId', async (req, res) => {
    try {
        const user = await NaamJapUser.findOne({ deviceId: req.params.deviceId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const rank = await NaamJapUser.countDocuments({
            isActive: true,
            totalMalas: { $gt: user.totalMalas },
        }) + 1;

        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });

        // Get highest mala day
        let highestMalaDay = 0;
        for (const log of user.dailyLogs) {
            if (log.malas > highestMalaDay) highestMalaDay = log.malas;
        }

        // Get recent logs (last 30 days)
        const recentLogs = user.dailyLogs
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);

        res.json({
            success: true,
            response: {
                user: {
                    name: user.name,
                    city: user.city,
                    totalCount: user.totalCount,
                    totalMalas: user.totalMalas,
                    lastSyncAt: user.lastSyncAt,
                },
                rank,
                totalUsers,
                highestMalaDay,
                recentLogs,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Failed to get user data' });
    }
});

// POST /api/naam-jap/update-push-token - Update push token for a device
router.post('/update-push-token', async (req, res) => {
    try {
        const { deviceId, pushToken } = req.body;

        if (!deviceId || !pushToken) {
            return res.status(400).json({
                success: false,
                message: 'deviceId and pushToken are required',
            });
        }

        const user = await NaamJapUser.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.pushToken = pushToken;
        await user.save();

        console.log(`Push token updated for ${user.name} (${deviceId}): ${pushToken}`);

        res.json({ success: true, message: 'Push token updated' });
    } catch (error) {
        console.error('Update push token error:', error);
        res.status(500).json({ success: false, message: 'Failed to update push token' });
    }
});

// POST /api/naam-jap/delete-account - Delete user account by mobile number (Play Store compliant)
router.post('/delete-account', async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required',
            });
        }

        const trimmedMobile = String(mobile).trim().replace(/[^0-9]/g, '');
        if (trimmedMobile.length < 10 || trimmedMobile.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number',
            });
        }

        const user = await NaamJapUser.findOne({ mobile: trimmedMobile });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this mobile number',
            });
        }

        // Permanently delete the user and all associated data
        await NaamJapUser.deleteOne({ _id: user._id });

        console.log(`Account deleted for mobile: ${trimmedMobile}, user: ${user.name}`);

        res.json({
            success: true,
            message: 'Your account and all associated data have been permanently deleted',
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete account. Please try again.' });
    }
});

// ============ ADMIN ROUTES ============

// GET /api/naam-jap/admin/users - List all users (admin)
router.get('/admin/users', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'totalMalas';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const filter = { isActive: true };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            NaamJapUser.find(filter)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .select('name city totalCount totalMalas lastSyncAt createdAt'),
            NaamJapUser.countDocuments(filter),
        ]);

        res.json({
            success: true,
            response: {
                users,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error('Admin list users error:', error);
        res.status(500).json({ success: false, message: 'Failed to list users' });
    }
});

// GET /api/naam-jap/admin/stats - Admin overview stats
router.get('/admin/stats', authMiddleware, async (req, res) => {
    try {
        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });
        const totals = await NaamJapUser.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: null,
                    totalMalas: { $sum: '$totalMalas' },
                    totalCount: { $sum: '$totalCount' },
                },
            },
        ]);

        // Today's active users
        const today = getTodayString();
        const todayActive = await NaamJapUser.countDocuments({
            isActive: true,
            'dailyLogs.date': today,
        });

        // New users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newThisWeek = await NaamJapUser.countDocuments({
            createdAt: { $gte: weekAgo },
        });

        res.json({
            success: true,
            response: {
                totalUsers,
                totalMalas: totals[0]?.totalMalas || 0,
                totalCount: totals[0]?.totalCount || 0,
                todayActiveUsers: todayActive,
                newUsersThisWeek: newThisWeek,
            },
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get admin stats' });
    }
});

// GET /api/naam-jap/user/:deviceId/daily/:date - Get or create daily log for specific date
router.get('/user/:deviceId/daily/:date', async (req, res) => {
    try {
        const { deviceId, date } = req.params;

        // Validate date format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
        }

        const user = await NaamJapUser.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find today's log
        let dailyLog = user.dailyLogs.find(log => log.date === date);

        // If no log exists for this date, create one with 0
        if (!dailyLog) {
            dailyLog = { date, count: 0, malas: 0 };
            // Keep only last 90 days
            if (user.dailyLogs.length >= 90) {
                user.dailyLogs.sort((a, b) => a.date.localeCompare(b.date));
                user.dailyLogs = user.dailyLogs.slice(-89);
            }
            user.dailyLogs.push(dailyLog);
            await user.save();
        }

        const rank = await NaamJapUser.countDocuments({
            isActive: true,
            totalMalas: { $gt: user.totalMalas },
        }) + 1;

        const totalUsers = await NaamJapUser.countDocuments({ isActive: true });

        res.json({
            success: true,
            response: {
                user: {
                    name: user.name,
                    city: user.city,
                    totalCount: user.totalCount,
                    totalMalas: user.totalMalas,
                    lastSyncAt: user.lastSyncAt,
                },
                dailyLog,
                rank,
                totalUsers,
            },
        });
    } catch (error) {
        console.error('Get daily log error:', error);
        res.status(500).json({ success: false, message: 'Failed to get daily log' });
    }
});

module.exports = router;
