import { Router } from 'express';
import fileUpload from 'express-fileupload';
import { importSales } from '../controllers/salesImportController';

const router = Router();

router.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: true
}));

router.post('/', importSales);

export default router;
