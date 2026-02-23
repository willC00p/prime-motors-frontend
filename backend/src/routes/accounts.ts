import { Router } from 'express';
import { accountController } from '../controllers/accountController';
import { authenticateToken } from '../utils/auth';

const router = Router();

// All routes require authentication and HR role
router.use(authenticateToken);

// GET all accounts
router.get('/', accountController.getAllAccounts);

// GET account by ID
router.get('/:id', accountController.getAccountById);

// POST create new account
router.post('/', accountController.createAccount);

// PUT update account
router.put('/:id', accountController.updateAccount);

// PUT update password
router.put('/:id/password', accountController.updatePassword);

// DELETE account
router.delete('/:id', accountController.deleteAccount);

// PATCH toggle account status
router.patch('/:id/toggle-status', accountController.toggleAccountStatus);

export default router;
