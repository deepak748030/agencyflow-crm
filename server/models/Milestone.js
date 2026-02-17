const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'submitted', 'client_approved', 'payment_pending', 'paid'],
        default: 'pending',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    paidBy: { type: String, enum: ['razorpay', 'manual', null], default: null },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    remindersSent: [{
        channel: { type: String, enum: ['email', 'whatsapp'] },
        sentAt: Date,
        status: String,
    }],
}, { timestamps: true });

milestoneSchema.index({ projectId: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ dueDate: 1 });
milestoneSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
