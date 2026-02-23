import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { importInventory } from '../controllers/importController';

const router = Router();

router.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true
}));

router.post('/inventory', importInventory);

export default router;
