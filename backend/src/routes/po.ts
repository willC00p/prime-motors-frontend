import { Router } from 'express';
import {
  listPOs,
  listPendingItems,
  getAvailableModels,
  getNextPONumber,
  createPO,
  updatePaymentStatus,
  completePO,
  generatePDF,
  partialDeliverPO
} from '../controllers/poController';
import { getPOItems } from '../controllers/poController';

const router = Router();

// Route definitions
router.get('/', listPOs);
router.get('/pending-items', listPendingItems);
router.get('/available-models', getAvailableModels);
router.get('/next-po-number', getNextPONumber);
router.post('/', createPO);
router.post('/:id/payment', updatePaymentStatus);
router.post('/:id/deliver', partialDeliverPO);
router.post('/:id/complete', completePO);
router.get('/:id/pdf', generatePDF);
router.get('/:id/items', getPOItems);

export default router;
