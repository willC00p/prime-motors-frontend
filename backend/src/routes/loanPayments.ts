import { Router } from 'express';
import { 
    recordLoanPayment, 
    getLoanPayments, 
    getOverduePayments,
    generateLoanPayments,
    updateLoanPayment,
    getUpcomingPayments,
    generateMonthlyReport
} from '../controllers/loanPaymentsController';
import { authenticateToken } from '../utils/auth';

const router = Router();

// Record a loan payment
router.post('/', authenticateToken, recordLoanPayment);

// Get loan payments for a sale
router.get('/sale/:saleId', authenticateToken, getLoanPayments);

// Get overdue payments
router.get('/overdue', authenticateToken, getOverduePayments);

// Generate payment schedule
router.post('/generate/:saleId', authenticateToken, generateLoanPayments);

// Update a payment
router.patch('/:paymentId', authenticateToken, updateLoanPayment);

// Get upcoming payments
router.get('/upcoming', authenticateToken, getUpcomingPayments);

// Generate monthly report
router.get('/monthly-report', authenticateToken, generateMonthlyReport);

export default router;
