const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'paid'],
        default: 'pending',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
}, { timestamps: true });

milestoneSchema.index({ projectId: 1 });
milestoneSchema.index({ status: 1 });
milestoneSchema.index({ dueDate: 1 });
milestoneSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
