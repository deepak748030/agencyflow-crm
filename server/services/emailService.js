const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendPaymentReminder = async ({ to, clientName, milestoneTitle, amount, projectName }) => {
    if (!process.env.SMTP_USER) return console.log('SMTP not configured, skipping email');
    try {
        await transporter.sendMail({
            from: `"AgencyFlow" <${process.env.SMTP_USER}>`,
            to,
            subject: `Payment Reminder: ${milestoneTitle} - ₹${amount.toLocaleString('en-IN')}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#e53e3e;">Payment Reminder</h2>
                    <p>Hi ${clientName},</p>
                    <p>This is a reminder that payment is pending for the following milestone:</p>
                    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                        <p style="margin:4px 0;"><strong>Project:</strong> ${projectName}</p>
                        <p style="margin:4px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
                        <p style="margin:4px 0;font-size:20px;color:#2d3748;"><strong>Amount: ₹${amount.toLocaleString('en-IN')}</strong></p>
                    </div>
                    <p>Please complete the payment to continue with the next tasks.</p>
                    <p style="color:#718096;font-size:12px;margin-top:24px;">— AgencyFlow CRM</p>
                </div>
            `,
        });
        console.log(`Payment reminder sent to ${to}`);
    } catch (err) {
        console.error('Failed to send payment reminder:', err.message);
    }
};

const sendPaymentSuccess = async ({ to, clientName, milestoneTitle, amount, projectName, paymentId, invoicePdf }) => {
    if (!process.env.SMTP_USER) return console.log('SMTP not configured, skipping email');
    try {
        const mailOptions = {
            from: `"AgencyFlow" <${process.env.SMTP_USER}>`,
            to,
            subject: `Payment Received: ${milestoneTitle} - ₹${amount.toLocaleString('en-IN')}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#38a169;">Payment Successful ✓</h2>
                    <p>Hi ${clientName},</p>
                    <p>Your payment has been successfully received!</p>
                    <div style="background:#f0fff4;border:1px solid #c6f6d5;border-radius:8px;padding:16px;margin:16px 0;">
                        <p style="margin:4px 0;"><strong>Project:</strong> ${projectName}</p>
                        <p style="margin:4px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
                        <p style="margin:4px 0;font-size:20px;color:#2d3748;"><strong>Amount Paid: ₹${amount.toLocaleString('en-IN')}</strong></p>
                        ${paymentId ? `<p style="margin:4px 0;color:#718096;font-size:12px;">Payment ID: ${paymentId}</p>` : ''}
                    </div>
                    <p>Thank you for your payment. Work on the next milestone will now proceed.</p>
                    ${invoicePdf ? '<p style="color:#718096;font-size:12px;">Invoice PDF is attached below.</p>' : ''}
                    <p style="color:#718096;font-size:12px;margin-top:24px;">— AgencyFlow CRM</p>
                </div>
            `,
        };

        if (invoicePdf) {
            const invoiceNo = paymentId ? `INV-${paymentId.slice(-8).toUpperCase()}` : 'Invoice';
            mailOptions.attachments = [{
                filename: `${invoiceNo}.pdf`,
                content: invoicePdf,
                contentType: 'application/pdf',
            }];
        }

        await transporter.sendMail(mailOptions);
        console.log(`Payment success email sent to ${to}`);
    } catch (err) {
        console.error('Failed to send payment success email:', err.message);
    }
};

const sendMilestoneStatusUpdate = async ({ to, recipientName, milestoneTitle, amount, projectName, oldStatus, newStatus, updatedBy }) => {
    if (!process.env.SMTP_USER) return console.log('SMTP not configured, skipping email');

    const statusLabels = {
        pending: 'Pending',
        in_progress: 'In Progress',
        completed: 'Completed',
        payment_pending: 'Payment Pending',
        paid: 'Paid',
    };

    const statusColors = {
        pending: '#718096',
        in_progress: '#3182ce',
        completed: '#38a169',
        payment_pending: '#e53e3e',
        paid: '#38a169',
    };

    try {
        await transporter.sendMail({
            from: `"AgencyFlow" <${process.env.SMTP_USER}>`,
            to,
            subject: `Milestone Update: ${milestoneTitle} → ${statusLabels[newStatus] || newStatus}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#2d3748;">Milestone Status Updated</h2>
                    <p>Hi ${recipientName},</p>
                    <p>A milestone status has been updated on your project:</p>
                    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                        <p style="margin:4px 0;"><strong>Project:</strong> ${projectName}</p>
                        <p style="margin:4px 0;"><strong>Milestone:</strong> ${milestoneTitle}</p>
                        <p style="margin:4px 0;"><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                        <p style="margin:8px 0;">
                            <span style="color:${statusColors[oldStatus] || '#718096'};font-weight:bold;">${statusLabels[oldStatus] || oldStatus}</span>
                            &nbsp;→&nbsp;
                            <span style="color:${statusColors[newStatus] || '#718096'};font-weight:bold;">${statusLabels[newStatus] || newStatus}</span>
                        </p>
                        <p style="margin:4px 0;color:#718096;font-size:12px;">Updated by: ${updatedBy}</p>
                    </div>
                    <p style="color:#718096;font-size:12px;margin-top:24px;">— AgencyFlow CRM</p>
                </div>
            `,
        });
        console.log(`Milestone status update email sent to ${to}`);
    } catch (err) {
        console.error('Failed to send milestone status update email:', err.message);
    }
};

module.exports = { sendPaymentReminder, sendPaymentSuccess, sendMilestoneStatusUpdate };
