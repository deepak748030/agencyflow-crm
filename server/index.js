require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

// Socket.io
const { initializeSocket } = require('./socket/socketManager');

// Middleware imports
const dbMiddleware = require('./middleware/dbMiddleware');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
initializeSocket(server);

// Global middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '4.5mb' }));
app.use(express.urlencoded({ limit: '4.5mb', extended: true }));

// Database connection middleware
app.use('/api', dbMiddleware);

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'AgencyFlow CRM API is running', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ success: true, message: 'AgencyFlow CRM API Server' });
});

// Global error handler
app.use(errorHandler);

// Start server using http server (supports both HTTP + WebSocket)
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`AgencyFlow CRM Server running on port ${PORT} (with Socket.io)`);
    });
}

module.exports = app;
