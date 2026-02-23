import { Router } from 'express';
import { exportSalesReport } from '../controllers/reportsController';

const router = Router();

// Health checks for debugging router mounting
router.get('/', (_, res) => res.json({ ok: true, message: 'Reports router mounted' }));
router.get('/ping', (_, res) => res.json({ pong: true }));

// GET /api/reports/sales/export?period=daily|weekly|monthly|yearly|custom|all&branch_id=&start=&end=
router.get('/sales/export', exportSalesReport);

export default router;
