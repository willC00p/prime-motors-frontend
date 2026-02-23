import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { generateLoanPaymentsPDF } from '../utils/loanPaymentsPdfGenerator';

const prisma = new PrismaClient();

// Generate PDF report for monthly loan payments
export const generateMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    if (!month || !year || typeof month !== "string" || typeof year !== "string") {
      return res.status(400).json({ error: "Invalid month or year format" });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    // Fetch all loan sales that started before or in the selected month
    const payments = await prisma.loan_payments.findMany({
      where: {
        due_date: { lte: endDate }, // Only include payments due up to the end of selected month
        sales: {
          date_granted: { lte: endDate } // Only include loans that started before or in the selected month
        }
      },
      include: { sales: true },
      orderBy: [{ sales: { last_name: "asc" } }, { payment_no: "asc" }],
    });

    // Group payments by sale for processing
    const paymentsBySale = payments.reduce((acc: Record<number, typeof payments>, payment) => {
      if (!acc[payment.sale_id]) acc[payment.sale_id] = [];
      acc[payment.sale_id].push(payment);
      return acc;
    }, {});

    // Prepare data for PDF generation
    const reportData = {
      month: parseInt(month),
      year: parseInt(year),
      payments: Object.values(paymentsBySale).map(salePayments => {
        if (!salePayments?.[0]?.sales) return null;

        const sale = salePayments[0].sales;
        // Filter payments that are due up to the selected month
        const paymentsUpToMonth = salePayments.filter(p => p.due_date <= endDate);
        const paidPayments = paymentsUpToMonth.filter(p => p.status === 'paid');
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
        const balance = Number(sale.loan_amount || 0) - totalPaid;
        const lastPaidDate = [...paidPayments]
          .sort((a, b) => new Date(b.paid_date || 0).getTime() - new Date(a.paid_date || 0).getTime())
          [0]?.paid_date;

        return {
          customer_name: `${sale.first_name} ${sale.last_name}`,
          total_loan_amount: Number(sale.loan_amount || 0),
          monthly_payment: Number(sale.monthly_amortization || 0),
          amount_paid: totalPaid,
          balance,
          payments_made: paidPayments.length,
          total_payments: paymentsUpToMonth.length,
          status: sale.payment_status || 'ongoing',
          last_payment_date: lastPaidDate ? new Date(lastPaidDate) : undefined
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null),
      summary: {
        total_loans: Object.values(paymentsBySale)
          .reduce((sum, payments) => sum + Number(payments[0].sales?.loan_amount || 0), 0),
        total_paid: Object.values(paymentsBySale)
          .reduce((sum, payments) => sum + payments
            .filter(p => p.status === 'paid')
            .reduce((pSum, p) => pSum + Number(p.paid_amount || 0), 0), 0),
        total_balance: 0 // Will be calculated below
      }
    };

    reportData.summary.total_balance = reportData.summary.total_loans - reportData.summary.total_paid;

    // Generate PDF using our utility
    generateLoanPaymentsPDF(res, reportData);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  }
};



// Record a new loan payment
export const recordLoanPayment = catchAsync(async (req: Request, res: Response) => {
    const { sale_id, paid_amount, payment_number, paid_date = new Date() } = req.body;

    // Validate required fields
    if (!sale_id || !paid_amount || !payment_number) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
        // Find and update the specific payment
        const payment = await tx.loan_payments.updateMany({
            where: { 
                sale_id,
                payment_no: payment_number,
                status: 'pending'
            },
            data: {
                paid_amount: parseFloat(paid_amount),
                paid_date: new Date(paid_date),
                status: 'paid'
            }
        });

        if (payment.count === 0) {
            throw new Error('Payment not found or already paid');
        }

        // Get all payments for this sale with their current status
        const allPayments = await tx.loan_payments.findMany({
            where: { sale_id },
            orderBy: { payment_no: 'asc' }
        });

        // Calculate totals and payment status
        const totalPaid = allPayments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

        const paidCount = allPayments.filter(p => p.status === 'paid').length;
        const totalCount = allPayments.length;

        // Get the sale details
        const sale = await tx.sales.update({
            where: { id: sale_id },
            data: {
                payment_status: paidCount >= totalCount ? 'completed' : 'ongoing'
            },
            include: {
                loan_payments: {
                    orderBy: { payment_no: 'asc' }
                }
            }
        });

        const remainingBalance = Number(sale.loan_amount || 0) - totalPaid;

        // Return comprehensive payment information
        return {
            id: sale.id,
            first_name: sale.first_name,
            last_name: sale.last_name,
            contact_no: sale.contact_no,
            total_amount: sale.loan_amount,
            loan_amount: sale.loan_amount,
            terms: sale.terms,
            monthly_amortization: sale.monthly_amortization,
            date_granted: sale.date_granted,
            maturity_date: sale.maturity_date,
            paid_payments: paidCount,
            total_paid: totalPaid,
            remaining_balance: remainingBalance,
            payment_status: sale.payment_status,
            payments: sale.loan_payments
        };
    });

    res.json(result);
});

// Get all loan payments for a sale with full details
export const getLoanPayments = catchAsync(async (req: Request, res: Response) => {
    const { saleId } = req.params;

    const payments = await prisma.loan_payments.findMany({
        where: { sale_id: parseInt(saleId) },
        include: {
            sales: {
                select: {
                    first_name: true,
                    last_name: true,
                    contact_no: true,
                    loan_amount: true,
                    terms: true,
                    monthly_amortization: true,
                    date_granted: true,
                    maturity_date: true
                }
            }
        },
        orderBy: { payment_no: 'asc' }
    });

    // Calculate summary
    const sale = await prisma.sales.findUnique({
        where: { id: parseInt(saleId) }
    });

    if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
    }

    const totalPaid = payments.reduce((sum, payment) => 
        sum + Number(payment.paid_amount || 0), 0);
    const remainingBalance = Number(sale.loan_amount || 0) - totalPaid;
    const paidPayments = payments.filter(p => p.status === 'paid').length;

    res.json({
        payments,
        summary: {
            total_amount: sale.loan_amount,
            total_paid: totalPaid,
            remaining_balance: remainingBalance,
            total_payments: payments.length,
            paid_payments: paidPayments,
            maturity_date: sale.maturity_date
        }
    });
});

// Generate loan payments for a sale
export const generateLoanPayments = catchAsync(async (req: Request, res: Response) => {
    const { saleId } = req.params;
    
    // Get the sale details
    const sale = await prisma.sales.findUnique({
        where: { id: parseInt(saleId) }
    });

    if (!sale) {
        return res.status(404).json({ message: 'Sale not found' });
    }

    if (!sale.loan_amount || !sale.terms || !sale.monthly_amortization || !sale.date_granted) {
        return res.status(400).json({ message: 'Sale does not have required loan details' });
    }

    // Delete any existing payments for this sale
    await prisma.loan_payments.deleteMany({
        where: { sale_id: parseInt(saleId) }
    });

    // Generate payment schedule starting from the month after sale
    const payments = [];
    // Start with sale date and move to the first day of next month
    let dueDate = new Date(sale.date_granted);
    dueDate.setMonth(dueDate.getMonth() + 1); // Move to next month first
    dueDate.setDate(1); // Set to first day of the month

    for (let i = 1; i <= sale.terms; i++) {
        payments.push({
            sale_id: sale.id,
            payment_no: i,
            due_date: new Date(dueDate), // Create new date object to avoid reference issues
            amount: sale.monthly_amortization,
            status: 'pending',
            paid_amount: 0
        });
        
        // Move to next month
        dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Create all payments in a transaction
    await prisma.$transaction(
        payments.map(payment => 
            prisma.loan_payments.create({ data: payment })
        )
    );

    res.json({ message: 'Payment schedule generated successfully' });
});

// Update a specific payment
export const updateLoanPayment = catchAsync(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { paid_amount, paid_date } = req.body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
        // Update the payment
        const payment = await tx.loan_payments.update({
            where: { id: parseInt(paymentId) },
            data: {
                paid_amount: parseFloat(paid_amount),
                paid_date: new Date(paid_date || Date.now()),
                status: 'paid'
            },
            include: {
                sales: true
            }
        });

        // Get all payments for this sale
        const allPayments = await tx.loan_payments.findMany({
            where: { sale_id: payment.sale_id }
        });

        // Check if all payments are completed
        const allPaid = allPayments.every(p => p.status === 'paid' || p.id === parseInt(paymentId));
        
        if (allPaid) {
            // Update sale status to completed
            await tx.sales.update({
                where: { id: payment.sale_id },
                data: { payment_status: 'completed' }
            });
        }

        // Calculate total paid and remaining balance
        const totalPaid = allPayments.reduce((sum, p) => 
            sum + Number(p.paid_amount || 0), 0) + Number(paid_amount);
        const remainingBalance = Number(payment.sales.loan_amount || 0) - totalPaid;

        return {
            ...payment,
            total_paid: totalPaid,
            remaining_balance: remainingBalance,
            payment_status: allPaid ? 'completed' : 'ongoing'
        };
    });

    res.json(result);
});

// Get overdue payments
export const getOverduePayments = catchAsync(async (req: Request, res: Response) => {
    const payments = await prisma.loan_payments.findMany({
        where: {
            due_date: {
                lt: new Date()
            },
            status: 'pending'
        },
        include: {
            sales: {
                select: {
                    first_name: true,
                    last_name: true,
                    contact_no: true
                }
            }
        },
        orderBy: {
            due_date: 'asc'
        }
    });

    res.json(payments);
});

// Get upcoming payments for the next 30 days
export const getUpcomingPayments = catchAsync(async (req: Request, res: Response) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Next 30 days

    const payments = await prisma.loan_payments.findMany({
        where: {
            due_date: {
                gte: startDate,
                lte: endDate
            },
            status: 'pending'
        },
        include: {
            sales: {
                select: {
                    first_name: true,
                    last_name: true,
                    contact_no: true
                }
            }
        },
        orderBy: {
            due_date: 'asc'
        }
    });

    res.json(payments);
});
