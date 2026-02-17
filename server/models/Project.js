const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    developerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    budget: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        paid: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
    },
    deadline: { type: Date, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['draft', 'active', 'on_hold', 'completed'], default: 'draft' },
    tags: [{ type: String }],
    documents: [{
        name: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
}, { timestamps: true });

projectSchema.index({ clientId: 1 });
projectSchema.index({ managerId: 1 });
projectSchema.index({ developerIds: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', projectSchema);
