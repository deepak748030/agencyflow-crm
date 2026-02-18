// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            details: Object.values(err.errors).map(e => e.message),
        });
    }
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate entry' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    });
};

module.exports = errorHandler;
