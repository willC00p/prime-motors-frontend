import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface LoanReportData {
  month: number;
  year: number;
  payments: Array<{
    customer_name: string;
    total_loan_amount: number;
    monthly_payment: number;
    amount_paid: number;
    balance: number;
    payments_made: number;
    total_payments: number;
    status: string;
    last_payment_date?: Date;
  }>;
  summary: {
    total_loans: number;
    total_paid: number;
    total_balance: number;
  };
}

interface POItem {
  model_name?: string;
  model_code?: string;
  color?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  rebate_percentage?: number;
}

interface POData {
  date_issued: Date
  po_number: string
  contact_person?: string
  contact_number?: string
  dealer_discount?: number
  net_amount: number
  due_date?: Date
  payment_term?: string
  payment_mode?: string
  delivery_address?: string
  prepared_by?: string
  checked_by?: string
  items: POItem[]
}

export function generateLoanReportPDF(res: Response, data: LoanReportData): void {
  // Create a new PDF document
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4',
    layout: 'landscape'
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=LoanPayments_${data.year}_${data.month}.pdf`);
  doc.pipe(res);

  // Add letterhead
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('PRIME MOTORS', { align: 'center' })
    .moveDown(0.3);

  doc
    .font('Helvetica')
    .fontSize(14)
    .text('92 TRINIDAD BUILDING KAMIAS ROAD', { align: 'center' })
    .text('BRGY EAST KAMIAS, QUEZON CITY', { align: 'center' })
    .moveDown();

  // Add title and period
  const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('MONTHLY LOAN PAYMENTS REPORT', { align: 'center' })
    .fontSize(12)
    .font('Helvetica')
    .text(`Period: ${monthName} ${data.year}`, { align: 'center' })
    .moveDown();

  // Table setup
  const startX = 50;
  const columns = [
    { header: 'Customer Name', width: 150 },
    { header: 'Total Loan Amount', width: 100, align: 'right' as const },
    { header: 'Monthly Payment', width: 100, align: 'right' as const },
    { header: 'Amount Paid', width: 100, align: 'right' as const },
    { header: 'Balance', width: 100, align: 'right' as const },
    { header: 'Paid/Total', width: 80, align: 'center' as const },
    { header: 'Status', width: 80 },
    { header: 'Last Payment', width: 120 }
  ];

  let currentY = doc.y;

  // Draw headers with background
  doc
    .rect(startX, currentY, doc.page.width - 100, 20)
    .fillColor('#f3f4f6')
    .fill();

  doc.fillColor('#000000');

  let x = startX;
  columns.forEach(col => {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(col.header, x + 5, currentY + 5, { 
        width: col.width - 10,
        align: col.align || 'left'
      });
    x += col.width;
  });

  currentY += 25;

  // Draw rows
  data.payments.forEach((payment, index) => {
    // Add alternating row background
    if (index % 2 === 0) {
      doc
        .rect(startX, currentY - 5, doc.page.width - 100, 25)
        .fillColor('#f8f9fa')
        .fill();
    }
    doc.fillColor('#000000');

    x = startX;
    const row = [
      payment.customer_name,
      formatCurrency(payment.total_loan_amount),
      formatCurrency(payment.monthly_payment),
      formatCurrency(payment.amount_paid),
      formatCurrency(payment.balance),
      `${payment.payments_made}/${payment.total_payments}`,
      payment.status,
      payment.last_payment_date ? payment.last_payment_date.toLocaleDateString() : '-'
    ];

    columns.forEach((col, i) => {
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(row[i], x + 5, currentY, {
          width: col.width - 10,
          align: col.align || 'left'
        });
      x += col.width;
    });

    currentY += 25;

    // Add new page if needed
    if (currentY > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
    }
  });

  // Add summary section
  doc.moveDown(2);

  // Draw summary box
  doc
    .rect(startX, currentY, 300, 100)
    .fillColor('#f3f4f6')
    .fill()
    .fillColor('#000000');

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Summary', startX + 10, currentY + 10)
    .moveDown();

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Total Loan Amount: ${formatCurrency(data.summary.total_loans)}`, startX + 20, currentY + 35)
    .text(`Total Amount Paid: ${formatCurrency(data.summary.total_paid)}`, startX + 20, currentY + 55)
    .text(`Total Balance: ${formatCurrency(data.summary.total_balance)}`, startX + 20, currentY + 75);

  // Add footer
  doc
    .fontSize(8)
    .text('Generated on: ' + new Date().toLocaleString(), startX, doc.page.height - 20, {
      align: 'left'
    });

  // Finalize PDF
  doc.end();
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
}

export function generatePOPDF(res: Response, data: POData): void {
  // Create a new PDF document
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4'
  });


  // Pipe the PDF to the response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=PO-${data.po_number}.pdf`);
  doc.pipe(res);

  // Add letterhead
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .text('PRIME MOTORS', { align: 'center' })
    .moveDown(0.3);

  doc
    .font('Helvetica')
    .fontSize(14)
    .text('92 TRINIDAD BUILDING KAMIAS ROAD', { align: 'center' })
    .text('BRGY EAST KAMIAS, QUEZON CITY', { align: 'center' })
    .text('Tel: (+63) 2-8123-4567', { align: 'center' })
    .moveDown();

  // Add horizontal line
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#000000')
    .lineWidth(2)
    .stroke();

  doc.moveDown();

  // Title
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('PURCHASE ORDER', { align: 'center' })
    .moveDown();

  // Document details in a grid layout
  const startX = 50;
  const col2X = 300;
  let currentY = doc.y;

  // Left column
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('P.O. NUMBER:', startX, currentY)
    .font('Helvetica')
    .text(data.po_number, startX + 100, currentY);

  // Right column
  doc
    .font('Helvetica-Bold')
    .text('DATE:', col2X, currentY)
    .font('Helvetica')
    .text(data.date_issued.toLocaleDateString(), col2X + 70, currentY);

  currentY += 25;

  // Contact details
  doc
    .font('Helvetica-Bold')
    .text('CONTACT PERSON:', startX, currentY)
    .font('Helvetica')
    .text(data.contact_person || '', startX + 100, currentY)
    .font('Helvetica-Bold')
    .text('CONTACT NO:', col2X, currentY)
    .font('Helvetica')
    .text(data.contact_number || '', col2X + 70, currentY);

  currentY += 25;

  // Delivery details
  doc
    .font('Helvetica-Bold')
    .text('DELIVER TO:', startX, currentY)
    .font('Helvetica')
    .text(data.delivery_address || '', startX + 100, currentY, {
      width: 400,
      height: 40
    });

  currentY += 50;

  // Add another horizontal line before items
  doc
    .moveTo(50, currentY)
    .lineTo(545, currentY)
    .strokeColor('#000000')
    .lineWidth(1)
    .stroke();

  doc.moveDown();

  // Items table
  currentY = doc.y;
  
  // Table Headers with background
  doc
    .rect(startX, currentY, 495, 20)
    .fillColor('#f3f4f6')
    .fill();

  doc
    .fillColor('#000000')
    .fontSize(10)
    .font('Helvetica-Bold');

  // Calculate total width and spacing
  const totalWidth = 495; // Total available width
  const padding = 5;

  // Column headers with proportional widths
  const columns = [
    { text: 'MODEL NAME', x: startX + padding, width: totalWidth * 0.25 }, // 25%
    { text: 'MODEL CODE', x: startX + totalWidth * 0.25 + padding, width: totalWidth * 0.15 }, // 15%
    { text: 'COLOR', x: startX + totalWidth * 0.40 + padding, width: totalWidth * 0.10 }, // 10%
    { text: 'QTY', x: startX + totalWidth * 0.50 + padding, width: totalWidth * 0.08 }, // 8%
    { text: 'UNIT PRICE', x: startX + totalWidth * 0.58 + padding, width: totalWidth * 0.14 }, // 14%
    { text: 'REBATE %', x: startX + totalWidth * 0.72 + padding, width: totalWidth * 0.12 }, // 12%
    { text: 'AMOUNT', x: startX + totalWidth * 0.84 + padding, width: totalWidth * 0.16 } // 16%
  ];

  columns.forEach((col, index) => {
    let align: 'left' | 'center' | 'right' = 'left';
    if (index === 3 || index === 5) align = 'center'; // QTY and REBATE %
    if (index === 4 || index === 6) align = 'right';  // UNIT PRICE and AMOUNT
    doc.text(col.text, col.x, currentY + 5, { width: col.width, align });
  });

  currentY += 25;

  // Table Content
  doc.font('Helvetica');
  for (const item of data.items) {
    // Add light background for even rows
    if (data.items.indexOf(item) % 2 === 0) {
      doc
        .rect(startX, currentY - 5, 495, 20)
        .fillColor('#f8f9fa')
        .fill();
    }
    
    doc.fillColor('#000000');
    
    // Calculate amounts with proper formatting
    const formattedUnitPrice = new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(item.unit_price);
    
    const formattedAmount = new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(item.amount);

    doc
      .text(item.model_name || '', columns[0].x, currentY, { width: columns[0].width, ellipsis: true })
      .text(item.model_code || '', columns[1].x, currentY, { width: columns[1].width, ellipsis: true })
      .text(item.color || '', columns[2].x, currentY, { width: columns[2].width, ellipsis: true })
      .text(item.quantity.toString(), columns[3].x, currentY, { width: columns[3].width, align: 'center' })
      .text(formattedUnitPrice, columns[4].x, currentY, { width: columns[4].width, align: 'right' })
      .text((item.rebate_percentage || 0).toFixed(1) + '%', columns[5].x, currentY, { width: columns[5].width, align: 'center' })
      .text(formattedAmount, columns[6].x, currentY, { width: columns[6].width, align: 'right' });
    
    currentY += 20;
  }

  // Summary box with light background
  doc
    .rect(startX + 250, currentY + 10, 245, 100)
    .fillColor('#f3f4f6')
    .fill()
    .fillColor('#000000');

  currentY += 20;

  // Summary details
  const summaryX = startX + 260;
  const valuesX = startX + 415;

    // Calculate total rebates from items
  const totalRebates = data.items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unit_price;
    const rebateAmount = itemTotal * ((item.rebate_percentage || 0) / 100);
    return sum + rebateAmount;
  }, 0);

  doc
    .font('Helvetica-Bold')
    .text('NET AMOUNT DUE:', summaryX, currentY)
    .font('Helvetica')
    .text('₱' + data.net_amount.toLocaleString(), valuesX, currentY);  if (data.due_date) {
    currentY += 20;
    doc
      .font('Helvetica-Bold')
      .text('DUE DATE:', summaryX, currentY)
      .font('Helvetica')
      .text(data.due_date.toLocaleDateString(), valuesX, currentY);
  }

  // Payment details box
  currentY += 40;
  doc
    .rect(startX, currentY, 495, 60)
    .fillColor('#f8f9fa')
    .fill()
    .fillColor('#000000');

  currentY += 10;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Payment Details', startX + 10, currentY)
    .moveDown(0.5);

  doc
    .font('Helvetica')
    .text(`Payment Term: ${data.payment_term || ''}`, startX + 10, currentY + 20)
    .text(`Payment Mode: ${data.payment_mode || ''}`, startX + 250, currentY + 20);

  // Signatures section
  currentY += 60;

  // Add signature lines
  const signatureWidth = 200;
  const signatureGap = 45;
  
  // Add Prepared By signature
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Prepared by:', startX, currentY)
    .moveTo(startX, currentY + 40)
    .lineTo(startX + signatureWidth - 50, currentY + 40)
    .stroke()
    .font('Helvetica')
    .fontSize(10)
    .text(data.prepared_by || '_____________________________', startX, currentY + 45)
    .fontSize(8)
    .text('Signature Over Printed Name', startX, currentY + 75);

  // Add Checked By signature
  const checkedByX = startX + signatureWidth + signatureGap;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Approved by:', checkedByX, currentY)
    .moveTo(checkedByX, currentY + 40)
    .lineTo(checkedByX + signatureWidth - 50, currentY + 40)
    .stroke()
    .font('Helvetica')
    .fontSize(10)
    .text(data.checked_by || '_____________________________', checkedByX, currentY + 45)
    .fontSize(8)
    .text('Signature Over Printed Name', checkedByX, currentY + 75);

  // Add footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .text('This is a computer-generated ddd document. No signature is required.', 50, doc.page.height - 50, {
      align: 'center',
      width: doc.page.width - 100
    });

  // Finalize the PDF
  doc.end();
}
