const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/admin/setup
const setup = async (req, res) => {
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
            response: { email: admin.email, name: admin.name },
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ success: false, message: 'Failed to create default admin' });
    }
};

// POST /api/admin/login
const login = async (req, res) => {
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

        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ success: true, response: { token, admin: admin.toJSON() } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

// GET /api/admin/me
const getMe = (req, res) => {
    res.json({ success: true, response: req.admin.toJSON() });
};

// PUT /api/admin/profile
const updateProfile = async (req, res) => {
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
};

// PUT /api/admin/password
const updatePassword = async (req, res) => {
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
};

// GET /api/admin/activity
const getActivity = (req, res) => {
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
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        // Note: NaamJapUser and DailyQuote models may need to be created/imported
        // when these features are re-integrated
        res.json({
            success: true,
            response: {
                naamJap: { totalUsers: 0, totalMalas: 0, totalCount: 0, todayActiveUsers: 0, newUsersThisWeek: 0 },
                dailyQuotes: { total: 0, active: 0 },
                topUsers: [],
                dailyActivity: [],
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to get analytics' });
    }
};

module.exports = { setup, login, getMe, updateProfile, updatePassword, getActivity, getAnalytics };
