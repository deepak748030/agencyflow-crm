const connectDB = require('../config/db');

// Database connection middleware for serverless
const dbMiddleware = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Unable to connect to database. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

module.exports = dbMiddleware;
