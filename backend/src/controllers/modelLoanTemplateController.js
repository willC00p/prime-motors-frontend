"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteModelLoanTemplate = exports.updateModelLoanTemplate = exports.getModelLoanTemplates = exports.createModelLoanTemplate = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createModelLoanTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_id, term_months, loan_amount, downpayment_percentage, rebates_commission, monthly_amortization } = req.body;
        const template = yield prisma_1.default.model_loan_templates.create({
            data: {
                item_id,
                term_months,
                loan_amount,
                downpayment_percentage,
                rebates_commission,
                monthly_amortization
            }
        });
        res.json(template);
    }
    catch (error) {
        console.error('Error creating loan template:', error);
        res.status(500).json({ error: 'Failed to create loan template' });
    }
});
exports.createModelLoanTemplate = createModelLoanTemplate;
const getModelLoanTemplates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_id } = req.params;
        const templates = yield prisma_1.default.model_loan_templates.findMany({
            where: {
                item_id: parseInt(item_id)
            },
            orderBy: {
                term_months: 'asc'
            }
        });
        res.json(templates);
    }
    catch (error) {
        console.error('Error fetching loan templates:', error);
        res.status(500).json({ error: 'Failed to fetch loan templates' });
    }
});
exports.getModelLoanTemplates = getModelLoanTemplates;
const updateModelLoanTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { loan_amount, downpayment_percentage, rebates_commission, monthly_amortization } = req.body;
        const template = yield prisma_1.default.model_loan_templates.update({
            where: { id: parseInt(id) },
            data: {
                loan_amount,
                downpayment_percentage,
                rebates_commission,
                monthly_amortization
            }
        });
        res.json(template);
    }
    catch (error) {
        console.error('Error updating loan template:', error);
        res.status(500).json({ error: 'Failed to update loan template' });
    }
});
exports.updateModelLoanTemplate = updateModelLoanTemplate;
const deleteModelLoanTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.model_loan_templates.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting loan template:', error);
        res.status(500).json({ error: 'Failed to delete loan template' });
    }
});
exports.deleteModelLoanTemplate = deleteModelLoanTemplate;
