const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');

// Get all conversations for current user (admin sees all, others see only their own)
router.get('/conversations', auth, async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === 'admin') {
            // Admin sees all conversations
            filter = {};
        } else {
            // Other roles only see conversations they are a participant of
            filter = {
                'participants.userId': req.user._id,
                'participants.isActive': true,
            };
        }

        const conversations = await Conversation.find(filter)
            .populate('projectId', 'name status')
            .populate('participants.userId', 'name email avatar role')
            .populate('lastMessage.senderId', 'name')
            .sort({ updatedAt: -1 });

        // For admin, auto-create conversations for projects that don't have one yet
        if (req.user.role === 'admin') {
            const existingProjectIds = conversations
                .filter(c => c.projectId)
                .map(c => c.projectId._id?.toString() || c.projectId.toString());

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

                const users = await User.find({ _id: { $in: Array.from(participantIds) } });
                const participants = users.map(u => ({
                    userId: u._id,
                    role: u.role,
                    joinedAt: new Date(),
                    lastReadAt: new Date(),
                    isActive: true,
                }));

                // Add admin as participant too
                if (!participantIds.has(req.user._id.toString())) {
                    participants.push({
                        userId: req.user._id,
                        role: 'admin',
                        joinedAt: new Date(),
                        lastReadAt: new Date(),
                        isActive: true,
                    });
                }

                await Conversation.create({
                    projectId: project._id,
                    type: 'project_group',
                    participants,
                });
            }

            // Re-fetch all conversations after creating new ones
            if (projectsWithoutChat.length > 0) {
                const updatedConversations = await Conversation.find({})
                    .populate('projectId', 'name status')
                    .populate('participants.userId', 'name email avatar role')
                    .populate('lastMessage.senderId', 'name')
                    .sort({ updatedAt: -1 });
                return res.json({ success: true, response: updatedConversations });
            }
        }

        res.json({ success: true, response: conversations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get or create conversation for a project
router.post('/conversations/project/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        let conversation = await Conversation.findOne({ projectId: project._id, type: 'project_group' });

        if (!conversation) {
            // Build participants from project members
            const participantIds = new Set();
            if (project.clientId) participantIds.add(project.clientId.toString());
            if (project.managerId) participantIds.add(project.managerId.toString());
            if (project.developerIds) project.developerIds.forEach(id => participantIds.add(id.toString()));
            if (project.createdBy) participantIds.add(project.createdBy.toString());

            const users = await User.find({ _id: { $in: Array.from(participantIds) } });
            const participants = users.map(u => ({
                userId: u._id,
                role: u.role,
                joinedAt: new Date(),
                lastReadAt: new Date(),
                isActive: true,
            }));

            conversation = await Conversation.create({
                projectId: project._id,
                type: 'project_group',
                participants,
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('projectId', 'name status')
            .populate('participants.userId', 'name email avatar role');

        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
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

        // Update lastReadAt for current user
        await Conversation.updateOne(
            { _id: req.params.id, 'participants.userId': req.user._id },
            { $set: { 'participants.$.lastReadAt': new Date() } }
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
});

// Send a message
router.post('/conversations/:id/messages', auth, async (req, res) => {
    try {
        const { message, type = 'text', attachments = [], replyTo } = req.body;

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const isParticipant = conversation.participants.some(
            p => p.userId.toString() === req.user._id.toString() && p.isActive
        );

        // Admin can always send - auto-add as participant if not already
        if (!isParticipant && req.user.role === 'admin') {
            conversation.participants.push({
                userId: req.user._id,
                role: 'admin',
                joinedAt: new Date(),
                lastReadAt: new Date(),
                isActive: true,
            });
            await conversation.save();
        } else if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        const newMessage = await Message.create({
            conversationId: req.params.id,
            senderId: req.user._id,
            type,
            message,
            attachments,
            replyTo: replyTo || undefined,
            seenBy: [{ userId: req.user._id, seenAt: new Date() }],
        });

        // Update conversation lastMessage
        conversation.lastMessage = {
            text: message,
            senderId: req.user._id,
            sentAt: new Date(),
        };
        await conversation.save();

        const populated = await Message.findById(newMessage._id)
            .populate('senderId', 'name email avatar role');

        res.status(201).json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get unread count for current user across all conversations
router.get('/unread-count', auth, async (req, res) => {
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
});

// Mark conversation as read
router.post('/conversations/:id/read', auth, async (req, res) => {
    try {
        await Conversation.updateOne(
            { _id: req.params.id, 'participants.userId': req.user._id },
            { $set: { 'participants.$.lastReadAt': new Date() } }
        );
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Edit a message
router.put('/messages/:id', auth, async (req, res) => {
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
        res.json({ success: true, response: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete a message (soft)
router.delete('/messages/:id', auth, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
        if (msg.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete this message' });
        }

        msg.isDeleted = true;
        await msg.save();

        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
