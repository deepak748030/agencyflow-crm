require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const dailyQuoteRoutes = require('./routes/dailyQuoteRoutes');
const naamJapRoutes = require('./routes/naamJapRoutes');
const homeContentRoutes = require('./routes/homeContentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const presetImageRoutes = require('./routes/presetImageRoutes');
const stepTrackerRoutes = require('./routes/stepTrackerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '4.5mb' }));
app.use(express.urlencoded({ limit: '4.5mb', extended: true }));

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
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Apply DB middleware to all API routes
app.use('/api', dbMiddleware);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/daily-quotes', dailyQuoteRoutes);
app.use('/api/naam-jap', naamJapRoutes);
app.use('/api/home-content', homeContentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/preset-images', presetImageRoutes);
app.use('/api/step-tracker', stepTrackerRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Shree Jii API Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Shree Jii API Server' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Shree Jii Server running on port ${PORT}`);
    });
}

module.exports = app;
