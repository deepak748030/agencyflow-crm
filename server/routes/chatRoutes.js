const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            'participants.userId': req.user._id,
            'participants.isActive': true,
        })
            .populate('projectId', 'name status')
            .populate('participants.userId', 'name email avatar role')
            .populate('lastMessage.senderId', 'name')
            .sort({ updatedAt: -1 });

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
        if (!isParticipant) return res.status(403).json({ success: false, message: 'Not a participant' });

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
