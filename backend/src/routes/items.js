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
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
router.get('/', (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield prisma_1.default.items.findMany();
        res.json(items);
    }
    catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Failed to fetch items', details: error instanceof Error ? error.message : String(error) });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_no, brand, model, color, srp, cost_of_purchase } = req.body;
        const colorArray = Array.isArray(color) ? color : color.split(',').map((c) => c.trim());
        const data = {
            item_no,
            brand,
            model,
            color: colorArray,
            srp: srp ? Number(srp) : null
        };
        if (cost_of_purchase !== undefined)
            data.cost_of_purchase = cost_of_purchase ? Number(cost_of_purchase) : null;
        const newItem = yield prisma_1.default.items.create({ data });
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error('Error creating item:', error);
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                return res.status(409).json({ error: 'Item number already exists' });
            }
        }
        res.status(500).json({ error: 'Failed to create item', details: error instanceof Error ? error.message : String(error) });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { item_no, brand, model, color, srp, cost_of_purchase } = req.body;
        const colorArray = Array.isArray(color) ? color : color.split(',').map((c) => c.trim());
        const data = {
            item_no,
            brand,
            model,
            color: colorArray,
            srp: srp ? Number(srp) : null
        };
        if (cost_of_purchase !== undefined)
            data.cost_of_purchase = cost_of_purchase ? Number(cost_of_purchase) : null;
        const updatedItem = yield prisma_1.default.items.update({ where: { id: Number(id) }, data });
        res.json(updatedItem);
    }
    catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.items.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
}));
exports.default = router;
