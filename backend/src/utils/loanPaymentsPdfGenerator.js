"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLoanPaymentsPDF = generateLoanPaymentsPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
function generateLoanPaymentsPDF(res, data) {
    const doc = new pdfkit_1.default({
        margin: 50,
        size: 'A4',
        layout: 'landscape'
    });
    // Set response headers BEFORE piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LoanPayments_${data.year}_${data.month}.pdf`);
    // Pipe to response stream
    doc.pipe(res);
    // Add a subtle background color
    doc.rect(0, 0, doc.page.width, doc.page.height)
        .fill('#f8fafc');
    // Header with company logo placeholder (you can add an actual logo image here)
    doc.rect(50, 30, doc.page.width - 100, 100)
        .fill('#ffffff')
        .stroke('#e2e8f0');
    // Company name with modern styling
    doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#1e40af') // Deep blue color
        .text('PRIME MOTORS', 50, 45, { align: 'center' })
        .moveDown(0.3);
    // Company address with professional layout
    doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#475569') // Slate gray color
        .text('92 TRINIDAD BUILDING KAMIAS ROAD', { align: 'center' })
        .text('BRGY EAST KAMIAS, QUEZON CITY', { align: 'center' })
        .moveDown();
    // Report title with professional styling
    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('MONTHLY LOAN PAYMENTS REPORT', 50, 150, { align: 'center' })
        .fontSize(14)
        .fillColor('#475569')
        .text(`${monthName} ${data.year}`, { align: 'center' })
        .moveDown();
    // Add a decorative line
    doc
        .strokeColor('#e2e8f0')
        .lineWidth(2)
        .moveTo(100, doc.y)
        .lineTo(doc.page.width - 100, doc.y)
        .stroke()
        .moveDown();
    // Table headers with modern styling
    const startX = 50;
    let currentY = doc.y + 10;
    const columns = [
        { header: 'Customer Name', width: 150, icon: '👤' },
        { header: 'Total Loan', width: 100, align: 'right', icon: '💰' },
        { header: 'Monthly Payment', width: 100, align: 'right', icon: '📅' },
        { header: 'Amount Paid', width: 100, align: 'right', icon: '✓' },
        { header: 'Balance', width: 100, align: 'right', icon: '⚖️' },
        { header: 'Progress', width: 80, align: 'center', icon: '📊' },
        { header: 'Status', width: 80, icon: '🔄' },
        { header: 'Last Payment', width: 120, icon: '📆' }
    ];
    // Draw modern header with icons
    doc.rect(startX, currentY, doc.page.width - 100, 30)
        .fillColor('#1e40af')
        .fill();
    let x = startX;
    columns.forEach(col => {
        // Draw icon
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#ffffff')
            .text(col.icon, x + 2, currentY + 5, {
            width: 20,
            align: 'center'
        });
        // Draw header text
        doc.font('Helvetica-Bold')
            .fontSize(10)
            .fillColor('#ffffff')
            .text(col.header, x + 22, currentY + 5, {
            width: col.width - 20,
            align: col.align || 'left'
        });
        x += col.width;
    });
    currentY += 35;
    // Draw rows with enhanced styling
    data.payments.forEach((payment, index) => {
        // Add alternating row background with subtle gradient
        if (index % 2 === 0) {
            doc.rect(startX, currentY - 5, doc.page.width - 100, 25)
                .fillColor('#f8fafc')
                .fill();
        }
        doc.fillColor('#334155');
        let x = startX;
        doc.font('Helvetica').fontSize(10)
            .text(payment.customer_name, x + 2, currentY, { width: columns[0].width });
        x += columns[0].width;
        doc.text(formatCurrency(payment.total_loan_amount), x, currentY, { width: columns[1].width, align: 'right' });
        x += columns[1].width;
        doc.text(formatCurrency(payment.monthly_payment), x, currentY, { width: columns[2].width, align: 'right' });
        x += columns[2].width;
        doc.text(formatCurrency(payment.amount_paid), x, currentY, { width: columns[3].width, align: 'right' });
        x += columns[3].width;
        doc.text(formatCurrency(payment.balance), x, currentY, { width: columns[4].width, align: 'right' });
        x += columns[4].width;
        doc.text(`${payment.payments_made}/${payment.total_payments} months`, x, currentY, { width: columns[5].width, align: 'center' });
        x += columns[5].width;
        doc.text(payment.status, x, currentY, { width: columns[6].width });
        x += columns[6].width;
        doc.text(payment.last_payment_date ? new Date(payment.last_payment_date).toLocaleDateString() : '-', x, currentY, { width: columns[7].width });
        currentY += 20;
        // Add new page if needed
        if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
        }
    });
    // Modern Summary box with gradient background
    doc.moveDown(2);
    currentY = doc.y;
    // Draw summary container with shadow effect
    doc.rect(startX, currentY, 400, 120)
        .fillColor('#ffffff')
        .fill()
        .strokeColor('#e2e8f0')
        .stroke();
    // Summary title with icon
    doc.font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#1e40af')
        .text('📊 Summary', startX + 20, currentY + 20);
    // Add decorative line under title
    doc.strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(startX + 20, currentY + 45)
        .lineTo(startX + 380, currentY + 45)
        .stroke();
    // Summary content with icons and better formatting
    doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#334155')
        .text('💰 Total Loan Amount:', startX + 20, currentY + 55)
        .font('Helvetica-Bold')
        .text(formatCurrency(data.summary.total_loans), startX + 180, currentY + 55)
        .font('Helvetica')
        .text('✓ Total Amount Paid:', startX + 20, currentY + 75)
        .font('Helvetica-Bold')
        .text(formatCurrency(data.summary.total_paid), startX + 180, currentY + 75)
        .font('Helvetica')
        .text('⚖️ Total Balance:', startX + 20, currentY + 95)
        .font('Helvetica-Bold')
        .text(formatCurrency(data.summary.total_balance), startX + 180, currentY + 95);
    // Enhanced footer with icons and timestamp
    doc.fontSize(9)
        .fillColor('#64748b')
        .text('🕒 Generated on: ' + new Date().toLocaleString(), startX, doc.page.height - 30, {
        align: 'left'
    })
        .text('Prime Motors © ' + new Date().getFullYear(), doc.page.width - 150, doc.page.height - 30, {
        align: 'right'
    });
    // Important: End the document
    doc.end();
}
function formatCurrency(amount) {
    const formattedNumber = new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return `PHP ${formattedNumber}`;
}
