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
        const branches = yield prisma_1.default.branches.findMany();
        res.json(branches);
    }
    catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
}));
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, address } = req.body;
        const newBranch = yield prisma_1.default.branches.create({
            data: {
                name,
                address
            }
        });
        res.status(201).json(newBranch);
    }
    catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ error: 'Failed to create branch' });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, address } = req.body;
        const updatedBranch = yield prisma_1.default.branches.update({
            where: { id: Number(id) },
            data: {
                name,
                address
            }
        });
        res.json(updatedBranch);
    }
    catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.branches.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
}));
exports.default = router;
