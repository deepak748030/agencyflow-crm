const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
// Map userId -> Set of socket IDs
const onlineUsers = new Map();

const initializeSocket = (server) => {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Auth middleware - verify JWT on connection
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user || !user.isActive) return next(new Error('User not found'));

            socket.user = user;
            socket.userId = user._id.toString();
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`Socket connected: ${socket.user.name} (${userId})`);

        // Track online users
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast online status
        io.emit('user:online', { userId, name: socket.user.name });

        // Join conversation rooms
        socket.on('conversation:join', (conversationId) => {
            socket.join(`conv:${conversationId}`);
            console.log(`${socket.user.name} joined conv:${conversationId}`);
        });

        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conv:${conversationId}`);
        });

        // Typing indicators
        socket.on('typing:start', ({ conversationId }) => {
            socket.to(`conv:${conversationId}`).emit('typing:start', {
                conversationId,
                userId,
                userName: socket.user.name,
            });
        });

        socket.on('typing:stop', ({ conversationId }) => {
            socket.to(`conv:${conversationId}`).emit('typing:stop', {
                conversationId,
                userId,
            });
        });

        // Mark messages as read (real-time notification to sender)
        socket.on('messages:read', ({ conversationId }) => {
            socket.to(`conv:${conversationId}`).emit('messages:read', {
                conversationId,
                userId,
                userName: socket.user.name,
                readAt: new Date().toISOString(),
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.user.name}`);
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user:offline', { userId });
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        console.warn('Socket.io not initialized yet');
        return null;
    }
    return io;
};

const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};

module.exports = { initializeSocket, getIO, getOnlineUsers };
