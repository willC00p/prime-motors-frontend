"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlyLoanReport = generateMonthlyLoanReport;
const XLSX = __importStar(require("xlsx"));
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
function generateMonthlyLoanReport(res, data) {
    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    // Create header rows for company info and report title
    const headerRows = [
        ['PRIME MOTORS'],
        ['92 TRINIDAD BUILDING KAMIAS ROAD'],
        ['BRGY EAST KAMIAS, QUEZON CITY'],
        [''],
        ['MONTHLY LOAN PAYMENTS REPORT'],
        [`Period: ${monthName} ${data.year}`],
        ['']
    ];
    // Create table headers
    const tableHeaders = [
        ['Customer Name', 'Total Loan Amount', 'Monthly Payment', 'Amount Paid', 'Balance', 'Paid/Total', 'Status', 'Last Payment']
    ];
    // Create data rows
    const dataRows = data.payments.map(payment => [
        payment.customer_name,
        formatCurrency(payment.total_loan_amount),
        formatCurrency(payment.monthly_payment),
        formatCurrency(payment.amount_paid),
        formatCurrency(payment.balance),
        `${payment.payments_made}/${payment.total_payments}`,
        payment.status,
        payment.last_payment_date ? new Date(payment.last_payment_date).toLocaleDateString() : '-'
    ]);
    // Add empty row before summary
    const summaryRows = [
        [''],
        ['Summary'],
        ['Total Loan Amount:', formatCurrency(data.summary.total_loans)],
        ['Total Amount Paid:', formatCurrency(data.summary.total_paid)],
        ['Total Balance:', formatCurrency(data.summary.total_balance)],
        [''],
        [`Generated on: ${new Date().toLocaleString()}`]
    ];
    // Combine all rows
    const allRows = [...headerRows, ...tableHeaders, ...dataRows, ...summaryRows];
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    // Set column widths
    const colWidths = [
        { wch: 30 }, // Customer Name
        { wch: 15 }, // Total Loan Amount
        { wch: 15 }, // Monthly Payment
        { wch: 15 }, // Amount Paid
        { wch: 15 }, // Balance
        { wch: 12 }, // Paid/Total
        { wch: 12 }, // Status
        { wch: 15 } // Last Payment
    ];
    ws['!cols'] = colWidths;
    // Style the cells
    // Company name
    ws['A1'] = { v: 'PRIME MOTORS', s: { font: { bold: true, sz: 16 } } };
    // Report title
    ws['A5'] = { v: 'MONTHLY LOAN PAYMENTS REPORT', s: { font: { bold: true, sz: 14 } } };
    // Table headers (make them bold)
    tableHeaders[0].forEach((_, index) => {
        const cell = XLSX.utils.encode_cell({ r: headerRows.length, c: index });
        ws[cell] = Object.assign(Object.assign({}, ws[cell]), { s: {
                font: { bold: true },
                fill: { fgColor: { rgb: "CCCCCC" } }
            } });
    });
    // Summary section
    const summaryStartRow = headerRows.length + tableHeaders.length + dataRows.length + 1;
    ws[`A${summaryStartRow + 1}`] = { v: 'Summary', s: { font: { bold: true } } };
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Payments');
    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    // Set headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=LoanPayments_${data.year}_${data.month}.xlsx`);
    // Send the buffer
    res.send(buf);
}
