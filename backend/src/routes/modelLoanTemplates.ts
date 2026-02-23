import express from 'express';
import {
    createModelLoanTemplate,
    getModelLoanTemplates,
    updateModelLoanTemplate,
    deleteModelLoanTemplate
} from '../controllers/modelLoanTemplateController';

const router = express.Router();

router.post('/', createModelLoanTemplate);
router.get('/:item_id', getModelLoanTemplates);
router.put('/:id', updateModelLoanTemplate);
router.delete('/:id', deleteModelLoanTemplate);

export default router;
