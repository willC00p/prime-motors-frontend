"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loanPaymentsController_1 = require("../controllers/loanPaymentsController");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
// Record a loan payment
router.post('/', auth_1.authenticateToken, loanPaymentsController_1.recordLoanPayment);
// Get loan payments for a sale
router.get('/sale/:saleId', auth_1.authenticateToken, loanPaymentsController_1.getLoanPayments);
// Get overdue payments
router.get('/overdue', auth_1.authenticateToken, loanPaymentsController_1.getOverduePayments);
// Generate payment schedule
router.post('/generate/:saleId', auth_1.authenticateToken, loanPaymentsController_1.generateLoanPayments);
// Update a payment
router.patch('/:paymentId', auth_1.authenticateToken, loanPaymentsController_1.updateLoanPayment);
// Get upcoming payments
router.get('/upcoming', auth_1.authenticateToken, loanPaymentsController_1.getUpcomingPayments);
// Generate monthly report
router.get('/monthly-report', auth_1.authenticateToken, loanPaymentsController_1.generateMonthlyReport);
exports.default = router;
