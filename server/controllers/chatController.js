const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { getIO } = require('../socket/socketManager');

// GET /api/chat/conversations
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        if (req.user.role === 'admin') {
            const allConversations = await Conversation.find({});
            const existingProjectIds = allConversations
                .filter(c => c.projectId)
                .map(c => c.projectId.toString());

            const projectsWithoutChat = await Project.find({
                _id: { $nin: existingProjectIds },
                status: { $in: ['active', 'on_hold', 'draft'] },
            });

            for (const project of projectsWithoutChat) {
                const participantIds = new Set();
                if (project.clientId) participantIds.add(project.clientId.toString());
                if (project.managerId) participantIds.add(project.managerId.toString());
                if (project.developerIds) project.developerIds.forEach(id => participantIds.add(id.toString()));
                if (project.createdBy) participantIds.add(project.createdBy.toString());
                participantIds.add(userId.toString());

                const users = await User.find({ _id: { $in: Array.from(participantIds) } });
                const participants = users.map(u => ({
                    userId: u._id, role: u.role, joinedAt: new Date(), lastReadAt: new Date(), isActive: true,
                }));

                await Conversation.create({ projectId: project._id, type: 'project_group', participants });
            }

            const conversations = await Conversation.find({})
                .populate('projectId', 'name status')
                .populate('participants.userId', 'name email avatar role')
                .populate('lastMessage.senderId', 'name')
                .sort({ updatedAt: -1 });

            return res.json({ success: true, response: conversations });
        }

        // Non-admin: find projects this user is assigned to
        const roleFilter = {};
        if (req.user.role === 'client') roleFilter.clientId = userId;
        else if (req.user.role === 'manager') roleFilter.managerId = userId;
        else if (req.user.role === 'developer') roleFilter.developerIds = userId;

        const userProjects = await Project.find(roleFilter).select('_id');
        const projectIds = userProjects.map(p => p._id);

        const conversations = await Conversation.find({
            projectId: { $in: projectIds },
        })
            .populate('projectId', 'name status')
            .populate('participants.userId', 'name email avatar role')
            .populate('lastMessage.senderId', 'name')
            .sort({ updatedAt: -1 });

        // Ensure user is a participant in each conversation
        for (const conv of conversations) {
            const isParticipant = conv.participants.some(
                p => p.userId && p.userId._id?.toString() === userId.toString()
            );
            if (!isParticipant) {
                conv.participants.push({
                    userId: userId, role: req.user.role,
                    joinedAt: new Date(), lastReadAt: new Date(), isActive: true,
                });
                await conv.save();
                await conv.populate('participants.userId', 'name email avatar role');
            }
        }

        res.json({ success: true, response: conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/chat/conversations/project/:projectId
const getOrCreateProjectConversation = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        let conversation = await Conversation.findOne({ projectId: project._id, type: 'project_group' });

        if (!conversation) {
            const participantIds = new Set();
            if (project.clientId) participantIds.add(project.clientId.toString());
            if (project.managerId) participantIds.add(project.managerId.toString());
            if (project.developerIds) project.developerIds.forEach(id => participantIds.add(id.toString()));
            if (project.createdBy) participantIds.add(project.createdBy.toString());

            const users = await User.find({ _id: { $in: Array.from(participantIds) } });
            const participants = users.map(u => ({
                userId: u._id, role: u.role, joinedAt: new Date(), lastReadAt: new Date(), isActive: true,
            }));

            conversation = await Conversation.create({
                projectId: project._id, type: 'project_group', participants,
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('projectId', 'name status')
            .populate('participants.userId', 'name email avatar role');

        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/chat/conversations/:id/messages
const getMessages = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const messages = await Message.find({
            conversationId: req.params.id,
            isDeleted: false,
        })
            .populate('senderId', 'name email avatar role')
            .populate('replyTo', 'message senderId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Message.countDocuments({ conversationId: req.params.id, isDeleted: false });

        await Conversation.updateOne(
            { _id: req.params.id, 'participants.userId': req.user._id },
            { $set: { 'participants.$.lastReadAt': new Date() } }
        );

        await Message.updateMany(
            {
                conversationId: req.params.id,
                isDeleted: false,
                senderId: { $ne: req.user._id },
                'seenBy.userId': { $ne: req.user._id },
            },
            { $addToSet: { seenBy: { userId: req.user._id, seenAt: new Date() } } }
        );

        res.json({
            success: true,
            response: {
                messages: messages.reverse(),
                pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/chat/conversations/:id/messages
const sendMessageHandler = async (req, res) => {
    try {
        const { message, type = 'text', attachments = [], replyTo } = req.body;

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const isParticipant = conversation.participants.some(
            p => p.userId.toString() === req.user._id.toString() && p.isActive
        );

        if (!isParticipant && req.user.role === 'admin') {
            conversation.participants.push({
                userId: req.user._id, role: 'admin',
                joinedAt: new Date(), lastReadAt: new Date(), isActive: true,
            });
            await conversation.save();
        } else if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        const newMessage = await Message.create({
            conversationId: req.params.id,
            senderId: req.user._id,
            type,
            message: message || '',
            attachments,
            replyTo: replyTo || undefined,
            seenBy: [{ userId: req.user._id, seenAt: new Date() }],
        });

        const lastText = message || (attachments.length > 0 ? `📎 ${attachments.length} file(s)` : '');
        conversation.lastMessage = {
            text: lastText,
            senderId: req.user._id,
            sentAt: new Date(),
        };
        await conversation.save();

        const populated = await Message.findById(newMessage._id)
            .populate('senderId', 'name email avatar role');

        // Emit via Socket.io
        const io = getIO();
        if (io) {
            io.to(`conv:${req.params.id}`).emit('message:new', {
                conversationId: req.params.id,
                message: populated,
            });

            // Notify all participants about conversation update (for sidebar)
            conversation.participants.forEach(p => {
                const pId = p.userId.toString();
                if (pId !== req.user._id.toString()) {
                    io.to(`conv:${req.params.id}`).emit('conversation:updated', {
                        conversationId: req.params.id,
                        lastMessage: { text: lastText, senderId: req.user._id, sentAt: new Date() },
                    });
                }
            });
        }

        res.status(201).json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/chat/upload
const uploadAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'agencyflow/chat', resource_type: 'auto', max_bytes: 10 * 1024 * 1024 },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.json({
            success: true,
            response: {
                name: req.file.originalname,
                url: result.secure_url,
                type: req.file.mimetype,
                size: req.file.size,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/chat/unread-count
const getUnreadCount = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            filter = { 'participants.userId': req.user._id, 'participants.isActive': true };
        }

        const conversations = await Conversation.find(filter);
        let totalUnread = 0;
        const perConversation = {};

        for (const conv of conversations) {
            const participant = conv.participants.find(
                p => p.userId.toString() === req.user._id.toString()
            );
            const lastRead = participant?.lastReadAt || new Date(0);

            const unread = await Message.countDocuments({
                conversationId: conv._id,
                createdAt: { $gt: lastRead },
                senderId: { $ne: req.user._id },
                isDeleted: false,
            });

            if (unread > 0) {
                perConversation[conv._id.toString()] = unread;
                totalUnread += unread;
            }
        }

        res.json({ success: true, response: { total: totalUnread, perConversation } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/chat/conversations/:id/read
const markAsRead = async (req, res) => {
    try {
        await Conversation.updateOne(
            { _id: req.params.id, 'participants.userId': req.user._id },
            { $set: { 'participants.$.lastReadAt': new Date() } }
        );

        await Message.updateMany(
            {
                conversationId: req.params.id,
                isDeleted: false,
                senderId: { $ne: req.user._id },
                'seenBy.userId': { $ne: req.user._id },
            },
            { $addToSet: { seenBy: { userId: req.user._id, seenAt: new Date() } } }
        );

        // Emit read receipt via Socket.io
        const io = getIO();
        if (io) {
            io.to(`conv:${req.params.id}`).emit('messages:read', {
                conversationId: req.params.id,
                userId: req.user._id.toString(),
                userName: req.user.name,
                readAt: new Date().toISOString(),
            });
        }

        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/chat/messages/:id
const editMessageHandler = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        if (msg.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Can only edit your own messages' });
        }

        msg.message = req.body.message;
        msg.isEdited = true;
        msg.editedAt = new Date();
        await msg.save();

        const populated = await Message.findById(msg._id).populate('senderId', 'name email avatar role');

        // Emit via Socket.io
        const io = getIO();
        if (io) {
            io.to(`conv:${msg.conversationId.toString()}`).emit('message:edited', {
                conversationId: msg.conversationId.toString(),
                message: populated,
            });
        }

        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/chat/messages/:id
const deleteMessageHandler = async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        if (msg.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete this message' });
        }

        const conversationId = msg.conversationId.toString();
        msg.isDeleted = true;
        await msg.save();

        // Emit via Socket.io
        const io = getIO();
        if (io) {
            io.to(`conv:${conversationId}`).emit('message:deleted', {
                conversationId,
                messageId: msg._id.toString(),
            });
        }

        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getConversations,
    getOrCreateProjectConversation,
    getMessages,
    sendMessage: sendMessageHandler,
    uploadAttachment,
    getUnreadCount,
    markAsRead,
    editMessage: editMessageHandler,
    deleteMessage: deleteMessageHandler,
};
