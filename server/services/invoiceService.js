const PDFDocument = require('pdfkit');

const generateInvoicePDF = ({ milestone, project, client, paymentId }) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 0 });
            const buffers = [];

            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const invoiceNo = `INV-${milestone._id.toString().slice(-8).toUpperCase()}`;
            const paidDate = milestone.paidAt ? new Date(milestone.paidAt) : new Date();
            const W = 595.28; // A4 width
            const M = 50; // margin
            const contentW = W - M * 2;

            // ── Accent bar at top ──
            doc.rect(0, 0, W, 8).fill('#4F46E5');

            // ── Header section ──
            doc.fontSize(32).font('Helvetica-Bold').fillColor('#1E1B4B')
                .text('INVOICE', M, 40);

            doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
                .text(invoiceNo, M, 78)
                .text(`Issued: ${paidDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, M, 92);

            // ── Company branding (right) ──
            doc.fontSize(20).font('Helvetica-Bold').fillColor('#4F46E5')
                .text('AgencyFlow', 350, 44, { align: 'right', width: contentW - 300 });
            doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF')
                .text('Digital Agency Platform', 350, 68, { align: 'right', width: contentW - 300 })
                .text('www.agencyflow.io', 350, 80, { align: 'right', width: contentW - 300 });

            // ── Divider ──
            doc.moveTo(M, 115).lineTo(W - M, 115).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

            // ── Bill To / Project Info cards ──
            const cardY = 130;

            // Bill To card
            doc.roundedRect(M, cardY, (contentW - 20) / 2, 90, 4)
                .fill('#F9FAFB');
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#9CA3AF')
                .text('BILL TO', M + 14, cardY + 12);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827')
                .text(client?.name || 'Client', M + 14, cardY + 28);
            doc.fontSize(9).font('Helvetica').fillColor('#6B7280');
            if (client?.email) doc.text(client.email, M + 14, cardY + 44);
            if (client?.company) doc.text(client.company, M + 14, cardY + 58);

            // Project card
            const card2X = M + (contentW - 20) / 2 + 20;
            doc.roundedRect(card2X, cardY, (contentW - 20) / 2, 90, 4)
                .fill('#F9FAFB');
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#9CA3AF')
                .text('PROJECT DETAILS', card2X + 14, cardY + 12);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827')
                .text(project?.name || 'Project', card2X + 14, cardY + 28);
            doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
                .text(`Payment ID: ${paymentId || 'N/A'}`, card2X + 14, cardY + 44)
                .text(`Status: Paid`, card2X + 14, cardY + 58);

            // ── Table ──
            const tableTop = cardY + 110;

            // Table header background
            doc.roundedRect(M, tableTop, contentW, 32, 4).fill('#4F46E5');

            doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
            doc.text('#', M + 14, tableTop + 10);
            doc.text('DESCRIPTION', M + 40, tableTop + 10);
            doc.text('STATUS', M + contentW * 0.6, tableTop + 10);
            doc.text('AMOUNT', M + contentW - 80, tableTop + 10, { width: 66, align: 'right' });

            // Table row
            const rowY = tableTop + 40;
            doc.roundedRect(M, rowY, contentW, 50, 4).fill('#FAFAFA');

            doc.fontSize(9).font('Helvetica').fillColor('#374151');
            doc.text('1', M + 14, rowY + 12);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827')
                .text(milestone.title, M + 40, rowY + 10, { width: contentW * 0.5 });
            if (milestone.description) {
                doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF')
                    .text(milestone.description, M + 40, rowY + 26, { width: contentW * 0.5 });
            }

            // Status badge
            const badgeX = M + contentW * 0.6;
            doc.roundedRect(badgeX, rowY + 10, 40, 16, 8).fill('#D1FAE5');
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#065F46')
                .text('PAID', badgeX + 8, rowY + 14);

            // Amount
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827')
                .text(`₹${milestone.amount.toLocaleString('en-IN')}`, M + contentW - 80, rowY + 14, { width: 66, align: 'right' });

            // ── Totals section ──
            const totalsY = rowY + 70;
            doc.moveTo(M + contentW * 0.55, totalsY).lineTo(W - M, totalsY).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

            const totalLabelX = M + contentW * 0.55;
            const totalValX = M + contentW - 80;

            doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
                .text('Subtotal', totalLabelX, totalsY + 12);
            doc.fontSize(9).font('Helvetica').fillColor('#374151')
                .text(`₹${milestone.amount.toLocaleString('en-IN')}`, totalValX, totalsY + 12, { width: 66, align: 'right' });

            doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
                .text('Tax (0%)', totalLabelX, totalsY + 30);
            doc.fontSize(9).font('Helvetica').fillColor('#374151')
                .text('₹0', totalValX, totalsY + 30, { width: 66, align: 'right' });

            doc.moveTo(totalLabelX, totalsY + 48).lineTo(W - M, totalsY + 48).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

            // Grand total with accent background
            doc.roundedRect(totalLabelX - 10, totalsY + 54, contentW * 0.45 + 10, 32, 4).fill('#EEF2FF');
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#4F46E5')
                .text('TOTAL', totalLabelX, totalsY + 62);
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E1B4B')
                .text(`₹${milestone.amount.toLocaleString('en-IN')}`, totalValX - 10, totalsY + 60, { width: 76, align: 'right' });

            // ── Payment Details ──
            const payY = totalsY + 110;
            doc.moveTo(M, payY).lineTo(W - M, payY).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold').fillColor('#9CA3AF')
                .text('PAYMENT INFORMATION', M, payY + 14);

            doc.fontSize(9).font('Helvetica').fillColor('#374151');
            const payInfoY = payY + 32;
            doc.font('Helvetica-Bold').text('Method:', M, payInfoY, { continued: true })
                .font('Helvetica').text('  Razorpay');
            if (paymentId) {
                doc.font('Helvetica-Bold').text('Transaction ID:', M, payInfoY + 16, { continued: true })
                    .font('Helvetica').text(`  ${paymentId}`);
            }
            doc.font('Helvetica-Bold').text('Paid On:', M, payInfoY + 32, { continued: true })
                .font('Helvetica').text(`  ${paidDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`);

            // ── Footer ──
            const footY = 750;
            doc.moveTo(M, footY).lineTo(W - M, footY).strokeColor('#E5E7EB').lineWidth(0.5).stroke();

            doc.fontSize(9).font('Helvetica-Bold').fillColor('#4F46E5')
                .text('Thank you for your business!', M, footY + 14, { align: 'center', width: contentW });
            doc.fontSize(7).font('Helvetica').fillColor('#9CA3AF')
                .text('This is a computer-generated invoice and does not require a signature.', M, footY + 32, { align: 'center', width: contentW })
                .text('Generated by AgencyFlow • agencyflow.io', M, footY + 44, { align: 'center', width: contentW });

            // ── Bottom accent bar ──
            doc.rect(0, 842 - 6, W, 6).fill('#4F46E5');

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateInvoicePDF };
