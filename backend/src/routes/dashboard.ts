import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController';

const router = Router();

// GET /api/dashboard - returns analytics for dashboard
router.get('/', getDashboardAnalytics);

export default router;
