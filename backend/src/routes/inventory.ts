import { Router } from 'express';
import { listInventory, createInventory, updateInventory, deleteInventory, transferUnit, listTransferred } from '../controllers/inventoryController';
import { uploadSiPhoto } from '../utils/fileUpload';

const router = Router();

router.get('/', listInventory);
router.get('/transferred', listTransferred);
router.post('/', uploadSiPhoto.single('si_photo'), createInventory);
router.post('/transfer', transferUnit);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
