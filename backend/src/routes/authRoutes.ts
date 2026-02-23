import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../utils/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;
