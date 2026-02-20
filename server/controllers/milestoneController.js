const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const activityService = require('../services/activityService');
const { sendPaymentReminder, sendPaymentSuccess, sendMilestoneStatusUpdate } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/invoiceService');

const sendPaymentSuccessWithInvoice = async (milestone, project, paymentId) => {
    if (!project?.clientId?.email) return;
    try {
        const pdfBuffer = await generateInvoicePDF({
            milestone, project,
            client: project.clientId,
            paymentId,
        });
        sendPaymentSuccess({
            to: project.clientId.email,
            clientName: project.clientId.name,
            milestoneTitle: milestone.title,
            amount: milestone.amount,
            projectName: project.name,
            paymentId,
            invoicePdf: pdfBuffer,
        });
    } catch (err) {
        console.error('Failed to generate invoice for email:', err.message);
        sendPaymentSuccess({
            to: project.clientId.email,
            clientName: project.clientId.name,
            milestoneTitle: milestone.title,
            amount: milestone.amount,
            projectName: project.name,
            paymentId,
        });
    }
};

// Send status change email to all project team members
const notifyTeamStatusChange = async (milestone, project, oldStatus, newStatus, updatedByUser) => {
    try {
        const teamUserIds = [
            project.clientId,
            project.managerId,
            ...(project.developerIds || []),
        ].filter(Boolean);

        const users = await User.find({ _id: { $in: teamUserIds }, isActive: true }).select('name email');
        const updatedByName = updatedByUser?.name || 'System';

        for (const member of users) {
            if (member._id.toString() === updatedByUser?._id?.toString()) continue; // skip the person who made the change
            sendMilestoneStatusUpdate({
                to: member.email,
                recipientName: member.name,
                milestoneTitle: milestone.title,
                amount: milestone.amount,
                projectName: project.name,
                oldStatus,
                newStatus,
                updatedBy: updatedByName,
            });
        }
    } catch (err) {
        console.error('Failed to send team status notifications:', err.message);
    }
};

const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// POST /api/milestones
const createMilestone = async (req, res) => {
    try {
        const { projectId, title, description, amount, dueDate } = req.body;
        if (!projectId || !title || !amount) {
            return res.status(400).json({ success: false, message: 'Project, title, and amount are required' });
        }

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

        const milestone = new Milestone({
            projectId, title, description, amount, dueDate,
            createdBy: req.user._id,
        });
        await milestone.save();

        await activityService.log({
            userId: req.user._id,
            action: 'milestone.created',
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title, amount, projectName: project.name },
            ip: req.ip,
        });

        res.status(201).json({ success: true, response: milestone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create milestone' });
    }
};

// GET /api/milestones/project/:projectId
const getProjectMilestones = async (req, res) => {
    try {
        const milestones = await Milestone.find({ projectId: req.params.projectId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, response: milestones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
    }
};

// PATCH /api/milestones/:id/status
const updateMilestoneStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

        const oldStatus = milestone.status;

        const validTransitions = {
            pending: ['in_progress'],
            in_progress: ['completed'],
            completed: ['payment_pending'],
            payment_pending: ['paid'], // admin can manually mark as paid
        };

        // Only admin can move to payment_pending or paid
        if ((status === 'payment_pending' || status === 'paid') && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admin can perform this action' });
        }

        if (!validTransitions[milestone.status]?.includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot transition from ${milestone.status} to ${status}` });
        }

        milestone.status = status;
        if (status === 'paid') {
            milestone.paidAt = new Date();
        }
        await milestone.save();

        // If admin manually marked as paid, update project budget and send invoice
        if (status === 'paid') {
            const proj = await Project.findById(milestone.projectId).populate('clientId', 'name email company');
            if (proj) {
                proj.budget.paid = (proj.budget.paid || 0) + milestone.amount;
                proj.budget.pending = proj.budget.amount - proj.budget.paid;
                await proj.save();
                sendPaymentSuccessWithInvoice(milestone, proj, 'MANUAL-ADMIN');
            }
        }

        // Send status change notification to all team members
        const project = await Project.findById(milestone.projectId).populate('clientId', 'name email');
        if (project) {
            notifyTeamStatusChange(milestone, project, oldStatus, status, req.user);

            // If moved to payment_pending, also send payment reminder to client
            if (status === 'payment_pending' && project.clientId?.email) {
                sendPaymentReminder({
                    to: project.clientId.email,
                    clientName: project.clientId.name,
                    milestoneTitle: milestone.title,
                    amount: milestone.amount,
                    projectName: project.name,
                });
            }
        }

        await activityService.log({
            userId: req.user._id,
            action: `milestone.${status}`,
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title: milestone.title, status },
            ip: req.ip,
        });

        res.json({ success: true, response: milestone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update milestone' });
    }
};

// PUT /api/milestones/:id (admin only - edit milestone)
const editMilestone = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

        // Cannot edit paid milestones
        if (milestone.status === 'paid') {
            return res.status(400).json({ success: false, message: 'Cannot edit a paid milestone' });
        }

        const { title, description, amount, dueDate } = req.body;
        if (title) milestone.title = title;
        if (description !== undefined) milestone.description = description;
        if (amount) milestone.amount = amount;
        if (dueDate !== undefined) milestone.dueDate = dueDate || null;

        await milestone.save();

        await activityService.log({
            userId: req.user._id,
            action: 'milestone.edited',
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title: milestone.title },
            ip: req.ip,
        });

        res.json({ success: true, response: milestone });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to edit milestone' });
    }
};

// DELETE /api/milestones/:id (admin only)
const deleteMilestone = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

        if (milestone.status === 'paid') {
            return res.status(400).json({ success: false, message: 'Cannot delete a paid milestone' });
        }

        const title = milestone.title;
        await Milestone.findByIdAndDelete(req.params.id);

        await activityService.log({
            userId: req.user._id,
            action: 'milestone.deleted',
            resource: 'milestone',
            resourceId: req.params.id,
            details: { title },
            ip: req.ip,
        });

        res.json({ success: true, message: 'Milestone deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete milestone' });
    }
};

// POST /api/milestones/:id/create-order (Razorpay order)
const createRazorpayOrder = async (req, res) => {
    try {
        const razorpay = getRazorpay();
        if (!razorpay) return res.status(500).json({ success: false, message: 'Razorpay not configured' });

        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
        if (milestone.status !== 'payment_pending') {
            return res.status(400).json({ success: false, message: 'Milestone is not in payment_pending status' });
        }

        const order = await razorpay.orders.create({
            amount: milestone.amount * 100,
            currency: 'INR',
            receipt: `milestone_${milestone._id}`,
            notes: { milestoneId: milestone._id.toString(), title: milestone.title },
        });

        milestone.razorpayOrderId = order.id;
        await milestone.save();

        res.json({
            success: true,
            response: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error) {
        console.error('Razorpay order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

// POST /api/milestones/:id/verify-payment
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }

        const oldStatus = milestone.status;
        milestone.status = 'paid';
        milestone.paidAt = new Date();
        milestone.razorpayPaymentId = razorpay_payment_id;
        milestone.razorpaySignature = razorpay_signature;
        await milestone.save();

        const project = await Project.findById(milestone.projectId).populate('clientId', 'name email company');
        if (project) {
            project.budget.paid = (project.budget.paid || 0) + milestone.amount;
            project.budget.pending = project.budget.amount - project.budget.paid;
            await project.save();

            sendPaymentSuccessWithInvoice(milestone, project, razorpay_payment_id);
            notifyTeamStatusChange(milestone, project, oldStatus, 'paid', req.user);
        }

        await activityService.log({
            userId: req.user._id,
            action: 'milestone.paid',
            resource: 'milestone',
            resourceId: milestone._id,
            details: { title: milestone.title, paymentId: razorpay_payment_id },
            ip: req.ip,
        });

        res.json({ success: true, response: milestone });
    } catch (error) {
        console.error('Payment verify error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
};

// POST /api/milestones/:id/send-reminder
const sendReminder = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
        if (milestone.status !== 'payment_pending') {
            return res.status(400).json({ success: false, message: 'Only payment_pending milestones can get reminders' });
        }

        const project = await Project.findById(milestone.projectId).populate('clientId', 'name email');
        if (!project || !project.clientId?.email) {
            return res.status(400).json({ success: false, message: 'Client email not found' });
        }

        await sendPaymentReminder({
            to: project.clientId.email,
            clientName: project.clientId.name,
            milestoneTitle: milestone.title,
            amount: milestone.amount,
            projectName: project.name,
        });

        res.json({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send reminder' });
    }
};

// GET /api/milestones/:id/invoice
const downloadInvoice = async (req, res) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
        if (milestone.status !== 'paid') {
            return res.status(400).json({ success: false, message: 'Invoice only available for paid milestones' });
        }

        const project = await Project.findById(milestone.projectId).populate('clientId', 'name email company');
        const client = project?.clientId || {};

        const pdfBuffer = await generateInvoicePDF({
            milestone,
            project,
            client,
            paymentId: milestone.razorpayPaymentId,
        });

        const invoiceNo = `INV-${milestone._id.toString().slice(-8).toUpperCase()}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoiceNo}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
};

module.exports = {
    createMilestone, getProjectMilestones, updateMilestoneStatus,
    editMilestone, deleteMilestone,
    createRazorpayOrder, verifyPayment, sendReminder, downloadInvoice,
};
