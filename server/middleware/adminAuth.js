const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin JWT authentication middleware
const adminAuth = async (req, res, next) => {
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

module.exports = { adminAuth };
