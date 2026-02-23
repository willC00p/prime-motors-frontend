import { Router } from 'express';
import { listModels } from '../controllers/modelController';

const router = Router();

// GET /api/models - list all models with loan templates
router.get('/', listModels);

export default router;
