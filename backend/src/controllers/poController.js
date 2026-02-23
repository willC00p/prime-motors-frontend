"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.updatePaymentStatus = exports.getAvailableModels = exports.generatePDF = exports.createPO = exports.completePO = exports.listPOs = exports.listPendingItems = exports.getNextPONumber = exports.partialDeliverPO = exports.getPOItems = void 0;
// Get all items for a given purchase order
const getPOItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const poId = Number(req.params.id);
    if (isNaN(poId)) {
        return res.status(400).json({ error: 'Invalid purchase order ID' });
    }
    try {
        const items = yield prisma_1.default.purchase_order_items.findMany({
            where: { purchase_order_id: poId },
            include: { items: true }
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch purchase order items' });
    }
});
exports.getPOItems = getPOItems;
// Partial delivery controller
const partialDeliverPO = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { delivered_items, dr_number, si_number, delivery_date } = req.body;
        if (!id || !Array.isArray(delivered_items) || delivered_items.length === 0) {
            return res.status(400).json({ error: 'Missing required delivery data' });
        }
        const po = yield prisma_1.default.purchase_orders.findUnique({
            where: { id: Number(id) },
            include: { purchase_order_items: true }
        });
        if (!po)
            return res.status(404).json({ error: 'PO not found' });
        // For each delivered item, update delivered quantity and create inventory movement
        for (const delivered of delivered_items) {
            const poItem = po.purchase_order_items.find(i => i.item_id === delivered.item_id);
            if (!poItem)
                continue;
            // Calculate new delivered quantity (assume we store delivered_qty in PO item, else add it)
            const prevDelivered = poItem.delivered_qty || 0;
            const toDeliver = Number(delivered.quantity);
            const newDelivered = prevDelivered + toDeliver;
            // Update delivered_qty (add field if not present)
            yield prisma_1.default.purchase_order_items.update({
                where: { id: poItem.id },
                data: { delivered_qty: newDelivered }
            });
            // Create inventory movement for this delivery
            yield prisma_1.default.inventory_movements.create({
                data: {
                    branch_id: po.branch_id,
                    item_id: delivered.item_id,
                    supplier_id: po.supplier_id,
                    date_received: delivery_date ? new Date(delivery_date) : new Date(),
                    dr_no: dr_number,
                    si_no: si_number,
                    cost: Number(poItem.unit_price),
                    srp: null,
                    purchased_qty: toDeliver,
                    ending_qty: toDeliver,
                    color: poItem.color || null
                }
            });
        }
        res.json({ message: 'Partial delivery recorded' });
    }
    catch (error) {
        console.error('Error in partialDeliverPO:', error);
        res.status(500).json({ error: 'Failed to record partial delivery', details: error instanceof Error ? error.message : String(error) });
    }
});
exports.partialDeliverPO = partialDeliverPO;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Controller method type for consistent function signatures
const getNextPONumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const poNumber = yield generatePONumber();
        res.json({ po_number: poNumber });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to generate PO number' });
    }
});
exports.getNextPONumber = getNextPONumber;
const listPendingItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pendingPOs = yield prisma_1.default.purchase_orders.findMany({
            where: {
                payment_term: 'pending'
            },
            include: {
                purchase_order_items: {
                    include: {
                        items: true
                    }
                },
                suppliers: true
            }
        });
        const pendingItems = pendingPOs.flatMap((po) => po.purchase_order_items.map((item) => {
            var _a, _b;
            return ({
                po_number: po.po_number,
                model_name: ((_a = item.items) === null || _a === void 0 ? void 0 : _a.model) || '',
                color: item.color || '',
                quantity: item.quantity,
                unit_price: Number(item.unit_price),
                supplier_name: ((_b = po.suppliers) === null || _b === void 0 ? void 0 : _b.name) || po.contact_person || ''
            });
        }));
        res.json(pendingItems);
    }
    catch (error) {
        console.error('Error fetching pending items:', error);
        res.status(500).json({ error: 'Failed to fetch pending items' });
    }
});
exports.listPendingItems = listPendingItems;
const listPOs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const list = yield prisma_1.default.purchase_orders.findMany({
            include: {
                purchase_order_items: {
                    include: {
                        items: true
                    }
                },
                branches: true,
                suppliers: true
            }
        });
        res.json(list);
    }
    catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
});
exports.listPOs = listPOs;
function generatePONumber() {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const latestPO = yield prisma_1.default.purchase_orders.findFirst({
            where: {
                po_number: {
                    startsWith: `PO${year}${month}`
                }
            },
            orderBy: {
                po_number: 'desc'
            }
        });
        let sequence = 1;
        if (latestPO) {
            const lastSequence = parseInt(latestPO.po_number.slice(-4));
            sequence = lastSequence + 1;
        }
        return `PO${year}${month}${String(sequence).padStart(4, '0')}`;
    });
}
function getItemSRP(itemId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const item = yield prisma_1.default.items.findUnique({
            where: { id: itemId },
            select: { srp: true }
        });
        return (_b = (_a = item === null || item === void 0 ? void 0 : item.srp) === null || _a === void 0 ? void 0 : _a.toNumber()) !== null && _b !== void 0 ? _b : null;
    });
}
const completePO = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const po = yield prisma_1.default.purchase_orders.findUnique({
            where: { id: body.po_id },
            include: {
                purchase_order_items: true
            }
        });
        if (!po) {
            res.status(404).json({ error: 'Purchase Order not found' });
            return;
        }
        // Create inventory movements for each item, including color and units if provided
        const inventoryMovements = [];
        for (const item of po.purchase_order_items) {
            const srp = yield getItemSRP(item.item_id);
            // Support color and units from PO item if present
            const color = item.color || null;
            // If units are provided in the request body, use them, else empty array
            const units = (body.unitsByItemId && body.unitsByItemId[item.item_id]) ? body.unitsByItemId[item.item_id] : [];
            // Use rebate-adjusted unit cost for inventory
            const rebateAdjustedUnitCost = item.amount && item.quantity ? Number(item.amount) / Number(item.quantity) : Number(item.unit_price);
            const movement = yield prisma_1.default.inventory_movements.create({
                data: {
                    branch_id: po.branch_id,
                    item_id: item.item_id,
                    supplier_id: po.supplier_id,
                    date_received: new Date(body.date_received),
                    dr_no: body.dr_no,
                    si_no: body.si_no,
                    cost: rebateAdjustedUnitCost,
                    srp: srp,
                    purchased_qty: item.quantity,
                    ending_qty: item.quantity, // Initial ending quantity is same as purchased
                    color: color,
                    vehicle_units: units.length > 0 ? {
                        create: units.map((unit, idx) => ({
                            unit_number: idx + 1,
                            chassis_no: unit.chassis_no,
                            engine_no: unit.engine_no
                        }))
                    } : undefined
                }
            });
            inventoryMovements.push(movement);
        }
        // Update PO status to completed
        yield prisma_1.default.purchase_orders.update({
            where: { id: body.po_id },
            data: {
                payment_term: 'completed'
            }
        });
        res.json({ message: 'PO completed and inventory updated', inventoryMovements });
    }
    catch (error) {
        console.error('Error completing PO:', error);
        res.status(500).json({
            error: 'Failed to complete purchase order',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.completePO = completePO;
const createPO = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (!body.branch_id || !body.supplier_id || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
            res.status(400).json({
                error: 'Missing required fields',
                details: 'branch_id, supplier_id, and items are required'
            });
            return;
        }
        // Validate items
        for (const item of body.items) {
            const quantity = Number(item.quantity);
            const unit_price = Number(item.unit_price);
            if (!item.item_id || isNaN(quantity) || quantity <= 0 || isNaN(unit_price) || unit_price <= 0) {
                res.status(400).json({
                    error: 'Invalid item data',
                    details: 'Each item must have a valid item_id, quantity > 0, and unit_price > 0'
                });
                return;
            }
        }
        const poNumber = yield generatePONumber();
        // Require payment_mode from frontend
        if (!body.payment_mode) {
            res.status(400).json({ error: 'Missing payment_mode. Please select a payment mode from the dropdown.' });
            return;
        }
        const newPO = yield prisma_1.default.purchase_orders.create({
            data: {
                po_number: poNumber,
                branch_id: Number(body.branch_id),
                supplier_id: Number(body.supplier_id),
                payment_term: body.payment_term || 'pending',
                payment_mode: body.payment_mode,
                contact_person: body.contact_person || '',
                date_issued: body.date_issued ? new Date(body.date_issued) : new Date(),
                due_date: body.due_date ? new Date(body.due_date) : null,
                dealer_discount: body.dealer_discount ? Number(body.dealer_discount) : null,
                prepared_by: body.prepared_by || '',
                checked_by: body.checked_by || '',
                purchase_order_items: {
                    create: body.items.map(item => {
                        const quantity = Number(item.quantity);
                        const unit_price = Number(item.unit_price);
                        const rebatePct = item.rebate_percentage ? Number(item.rebate_percentage) : 0;
                        const baseAmount = quantity * unit_price;
                        const rebateAmount = baseAmount * (rebatePct / 100);
                        return {
                            item_id: Number(item.item_id),
                            quantity: quantity,
                            unit_price: unit_price,
                            amount: baseAmount - rebateAmount,
                            color: item.color || null,
                            rebate_percentage: rebatePct || null,
                            delivery_status: 'pending'
                        };
                    })
                }
            },
            include: {
                purchase_order_items: {
                    include: {
                        items: true
                    }
                },
                branches: true,
                suppliers: true
            }
        });
        res.status(201).json(newPO);
    }
    catch (error) {
        console.error('Error creating PO:', error);
        res.status(500).json({
            error: 'Failed to create purchase order',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.createPO = createPO;
const generatePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const po = yield prisma_1.default.purchase_orders.findUnique({
            where: { id: Number(id) },
            include: {
                purchase_order_items: {
                    include: {
                        items: true
                    }
                },
                branches: true,
                suppliers: true
            }
        });
        if (!po) {
            res.status(404).json({ error: 'Purchase Order not found.' });
            return;
        }
        const purchaseOrder = po;
        if (!po.payment_mode) {
            res.status(400).json({ error: 'Purchase Order is missing payment mode. Please update the PO record.' });
            return;
        }
        if (!po.purchase_order_items || po.purchase_order_items.length === 0) {
            res.status(400).json({ error: 'Purchase Order has no items. Cannot generate PDF.' });
            return;
        }
        // Check for missing item data
        for (const item of po.purchase_order_items) {
            if (!item.item_id || !item.unit_price || !item.quantity) {
                res.status(400).json({ error: 'One or more PO items are missing required fields.' });
                return;
            }
        }
        // Calculate totals with rebates
        const totalBeforeRebate = purchaseOrder.purchase_order_items.reduce((sum, item) => sum + (item.quantity * item.unit_price.toNumber()), 0);
        // Calculate rebates from individual items
        const totalRebates = purchaseOrder.purchase_order_items.reduce((sum, item) => {
            var _a;
            const itemTotal = item.quantity * item.unit_price.toNumber();
            const rebatePercentage = ((_a = item.rebate_percentage) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0;
            return sum + (itemTotal * rebatePercentage / 100);
        }, 0);
        // Apply dealer discount if present
        const dealerDiscount = ((_a = purchaseOrder.dealer_discount) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0;
        const dealerDiscountAmount = totalBeforeRebate * (dealerDiscount / 100);
        const netAmount = totalBeforeRebate - totalRebates - dealerDiscountAmount;
        const poData = {
            date_issued: purchaseOrder.date_issued,
            po_number: purchaseOrder.po_number,
            contact_person: purchaseOrder.contact_person || '',
            contact_number: purchaseOrder.contact_number || '',
            dealer_discount: ((_b = purchaseOrder.dealer_discount) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0,
            net_amount: netAmount,
            due_date: purchaseOrder.due_date || undefined,
            payment_term: purchaseOrder.payment_term || '',
            payment_mode: purchaseOrder.payment_mode || undefined,
            delivery_address: ((_c = purchaseOrder.branches) === null || _c === void 0 ? void 0 : _c.address) || '',
            prepared_by: purchaseOrder.prepared_by || '',
            checked_by: purchaseOrder.checked_by || '',
            items: po.purchase_order_items.map((item) => {
                var _a, _b, _c;
                const itemTotal = item.quantity * item.unit_price.toNumber();
                const itemRebatePercentage = ((_a = item.rebate_percentage) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0;
                const itemRebateAmount = itemTotal * (itemRebatePercentage / 100);
                return {
                    model_name: ((_b = item.items) === null || _b === void 0 ? void 0 : _b.model) || '',
                    model_code: ((_c = item.items) === null || _c === void 0 ? void 0 : _c.item_no) || '',
                    color: item.color || '',
                    quantity: item.quantity,
                    unit_price: item.unit_price.toNumber(),
                    rebate_percentage: itemRebatePercentage,
                    amount: itemTotal - itemRebateAmount
                };
            })
        };
        const { generatePOPDF } = yield Promise.resolve().then(() => __importStar(require('../utils/pdfGenerator')));
        generatePOPDF(res, poData);
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.generatePDF = generatePDF;
const getAvailableModels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const models = yield prisma_1.default.items.findMany({
            select: {
                id: true,
                item_no: true,
                brand: true,
                model: true,
                color: true,
                srp: true,
            }
        });
        res.json(models);
    }
    catch (error) {
        console.error('Error fetching available models:', error);
        res.status(500).json({ error: 'Failed to fetch available models' });
    }
});
exports.getAvailableModels = getAvailableModels;
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { check_number, check_date } = req.body;
        if (!id) {
            res.status(400).json({ error: 'PO ID is required' });
            return;
        }
        if (!check_number) {
            res.status(400).json({ error: 'Check number is required' });
            return;
        }
        // Optionally validate check_date
        if (check_date && isNaN(Date.parse(check_date))) {
            res.status(400).json({ error: 'Invalid check date format' });
            return;
        }
        console.log('🔍 Parsed values:', { id, check_number });
        if (!id) {
            console.log('❌ Error: Missing ID in params');
            res.status(400).json({ error: 'PO ID is required' });
            return;
        }
        if (!check_number) {
            console.log('❌ Error: Missing check number in body');
            res.status(400).json({ error: 'Check number is required' });
            return;
        }
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
            console.log('❌ Error: Invalid ID format');
            res.status(400).json({ error: 'Invalid PO ID format' });
            return;
        }
        // First check if PO exists
        console.log('🔍 Looking for PO with ID:', parsedId);
        const existingPO = yield prisma_1.default.purchase_orders.findUnique({
            where: { id: parsedId }
        });
        if (!existingPO) {
            console.log('❌ Error: PO not found');
            res.status(404).json({ error: `Purchase Order with ID ${id} not found` });
            return;
        }
        console.log('✅ Found existing PO:', existingPO);
        if (existingPO.payment_status === 'paid') {
            console.log('❌ Error: PO already paid');
            res.status(400).json({ error: 'This Purchase Order has already been paid' });
            return;
        }
        console.log('💫 Updating PO payment status...');
        const updatedPO = yield prisma_1.default.purchase_orders.update({
            where: { id: parsedId },
            data: {
                payment_status: 'paid',
                check_number,
                check_date: check_date ? new Date(check_date) : null
            }
        });
        console.log('✅ Successfully updated PO:', updatedPO);
        res.json(updatedPO);
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({
            error: 'Failed to update payment status',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
