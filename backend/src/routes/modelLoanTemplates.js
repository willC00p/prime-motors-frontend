"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modelLoanTemplateController_1 = require("../controllers/modelLoanTemplateController");
const router = express_1.default.Router();
router.post('/', modelLoanTemplateController_1.createModelLoanTemplate);
router.get('/:item_id', modelLoanTemplateController_1.getModelLoanTemplates);
router.put('/:id', modelLoanTemplateController_1.updateModelLoanTemplate);
router.delete('/:id', modelLoanTemplateController_1.deleteModelLoanTemplate);
exports.default = router;
