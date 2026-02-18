const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    type: { type: String, enum: ['project_group', 'direct'], default: 'project_group' },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
        joinedAt: { type: Date, default: Date.now },
        lastReadAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true },
    }],
    lastMessage: {
        text: String,
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentAt: Date,
    },
}, { timestamps: true });

conversationSchema.index({ projectId: 1 });
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
