"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMonthlyLoanReport = generateMonthlyLoanReport;
const pdfmake_1 = __importDefault(require("pdfmake"));
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};
// Using built-in fonts instead of Roboto
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};
function generateMonthlyLoanReport(res, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const printer = new pdfmake_1.default(fonts);
        const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });
        // Table headers
        const tableHeaders = [
            'Customer Name',
            'Total Loan Amount',
            'Monthly Payment',
            'Amount Paid',
            'Balance',
            'Paid/Total',
            'Status',
            'Last Payment'
        ];
        // Table rows
        const tableRows = data.payments.map(payment => [
            payment.customer_name,
            { text: formatCurrency(payment.total_loan_amount), alignment: 'right' },
            { text: formatCurrency(payment.monthly_payment), alignment: 'right' },
            { text: formatCurrency(payment.amount_paid), alignment: 'right' },
            { text: formatCurrency(payment.balance), alignment: 'right' },
            { text: `${payment.payments_made}/${payment.total_payments}`, alignment: 'center' },
            payment.status,
            payment.last_payment_date ? payment.last_payment_date.toLocaleDateString() : '-'
        ]);
        const docDefinition = {
            pageOrientation: 'landscape',
            pageMargins: [40, 60, 40, 60],
            header: {
                stack: [
                    { text: 'PRIME MOTORS', style: 'header' },
                    { text: '92 TRINIDAD BUILDING KAMIAS ROAD', style: 'subheader' },
                    { text: 'BRGY EAST KAMIAS, QUEZON CITY', style: 'subheader' },
                    { text: 'MONTHLY LOAN PAYMENTS REPORT', style: 'reportTitle' },
                    { text: `Period: ${monthName} ${data.year}`, style: 'period' }
                ],
                margin: [40, 20, 40, 20]
            },
            content: [
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            tableHeaders.map(header => ({
                                text: header,
                                style: 'tableHeader',
                                fillColor: '#f3f4f6'
                            })),
                            ...tableRows
                        ]
                    },
                    layout: {
                        fillColor: (rowIndex) => {
                            return (rowIndex % 2 === 0) ? '#ffffff' : '#f8f9fa';
                        }
                    }
                },
                { text: '', margin: [0, 20] },
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: 'Summary', style: 'summaryHeader', fillColor: '#f3f4f6' }],
                            [{
                                    stack: [
                                        { text: `Total Loan Amount: ${formatCurrency(data.summary.total_loans)}`, margin: [0, 5] },
                                        { text: `Total Amount Paid: ${formatCurrency(data.summary.total_paid)}`, margin: [0, 5] },
                                        { text: `Total Balance: ${formatCurrency(data.summary.total_balance)}`, margin: [0, 5] }
                                    ],
                                    margin: [10, 5]
                                }]
                        ]
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            footer: {
                text: `Generated on: ${new Date().toLocaleString()}`,
                style: 'footer',
                margin: [40, 0]
            },
            styles: {
                header: {
                    fontSize: 20,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 5]
                },
                subheader: {
                    fontSize: 12,
                    alignment: 'center',
                    margin: [0, 0, 0, 2]
                },
                reportTitle: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 10, 0, 5]
                },
                period: {
                    fontSize: 12,
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                },
                tableHeader: {
                    fontSize: 10,
                    bold: true,
                    margin: [0, 5]
                },
                summaryHeader: {
                    fontSize: 12,
                    bold: true,
                    margin: [5, 5]
                },
                footer: {
                    fontSize: 8,
                    alignment: 'left'
                }
            },
            defaultStyle: {
                fontSize: 10
            }
        };
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=LoanPayments_${data.year}_${data.month}.pdf`);
        // Pipe the PDF to the response
        pdfDoc.pipe(res);
        pdfDoc.end();
    });
}
