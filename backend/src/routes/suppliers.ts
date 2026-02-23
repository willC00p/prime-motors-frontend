import { Router } from 'express';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPayments
} from '../controllers/supplierController';

const router = Router();

// List all suppliers
router.get('/', listSuppliers);

// Get supplier payment monitoring data
router.get('/payments/monitor', getSupplierPayments);

// Get a single supplier by id
router.get('/:id', getSupplier);

// Create a new supplier
router.post('/', createSupplier);

// Update a supplier by id
router.put('/:id', updateSupplier);

// Delete a supplier by id
router.delete('/:id', deleteSupplier);

export default router;
