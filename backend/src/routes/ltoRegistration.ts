import { Router } from 'express';
import * as ltoController from '../controllers/ltoRegistrationController';

const router = Router();

// List all registrations (with optional filters)
router.get('/', ltoController.listRegistrations);

// Export registrations to Excel
router.get('/export/excel', ltoController.exportToExcel);

// Get a single registration
router.get('/:id', ltoController.getRegistration);

// Create new registration
router.post('/', ltoController.createRegistration);

// Update registration
router.put('/:id', ltoController.updateRegistration);

// Generate report
router.get('/report', ltoController.generateReport);

export default router;
