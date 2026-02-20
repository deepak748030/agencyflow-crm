const crypto = require('crypto');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const activityService = require('../services/activityService');
const { sendPaymentSuccess } = require('../services/emailService');
const { generateInvoicePDF } = require('../services/invoiceService');

// POST /api/webhooks/razorpay - handles Razorpay webhook events
const razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ success: false });
        }

        // Verify webhook signature
        const signature = req.headers['x-razorpay-signature'];
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Razorpay webhook signature mismatch');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const orderId = payment.order_id;

            // Find milestone by razorpay order ID
            const milestone = await Milestone.findOne({ razorpayOrderId: orderId });
            if (!milestone) {
                console.log(`Webhook: No milestone found for order ${orderId}`);
                return res.json({ success: true, message: 'No matching milestone' });
            }

            // Already paid? Skip
            if (milestone.status === 'paid') {
                return res.json({ success: true, message: 'Already paid' });
            }

            milestone.status = 'paid';
            milestone.paidAt = new Date();
            milestone.razorpayPaymentId = payment.id;
            await milestone.save();

            // Update project budget
            const project = await Project.findById(milestone.projectId).populate('clientId', 'name email company');
            if (project) {
                project.budget.paid = (project.budget.paid || 0) + milestone.amount;
                project.budget.pending = project.budget.amount - project.budget.paid;
                await project.save();

                // Send payment success email with invoice PDF
                if (project.clientId && project.clientId.email) {
                    try {
                        const pdfBuffer = await generateInvoicePDF({
                            milestone, project, client: project.clientId, paymentId: payment.id,
                        });
                        sendPaymentSuccess({
                            to: project.clientId.email,
                            clientName: project.clientId.name,
                            milestoneTitle: milestone.title,
                            amount: milestone.amount,
                            projectName: project.name,
                            paymentId: payment.id,
                            invoicePdf: pdfBuffer,
                        });
                    } catch (pdfErr) {
                        console.error('Invoice PDF generation failed in webhook:', pdfErr.message);
                        sendPaymentSuccess({
                            to: project.clientId.email,
                            clientName: project.clientId.name,
                            milestoneTitle: milestone.title,
                            amount: milestone.amount,
                            projectName: project.name,
                            paymentId: payment.id,
                        });
                    }
                }
            }

            await activityService.log({
                action: 'milestone.paid',
                resource: 'milestone',
                resourceId: milestone._id,
                details: { title: milestone.title, paymentId: payment.id, source: 'webhook' },
            });

            console.log(`Webhook: Milestone ${milestone._id} marked as paid via webhook`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(500).json({ success: false });
    }
};

module.exports = { razorpayWebhook };
