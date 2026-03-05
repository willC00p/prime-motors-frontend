import { Router } from 'express';
import { clearData } from '../controllers/adminController';

const router = Router();

/**
 * Admin endpoints - These should be protected with proper authorization
 */

// Clear all data (models, inventory, sales)
router.post('/clear-data', clearData);

export default router;
