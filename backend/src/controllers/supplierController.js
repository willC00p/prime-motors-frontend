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
exports.getSupplierPayments = getSupplierPayments;
exports.listSuppliers = listSuppliers;
exports.getSupplier = getSupplier;
exports.createSupplier = createSupplier;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Get payment monitoring data for all suppliers
function getSupplierPayments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const suppliers = yield prisma_1.default.suppliers.findMany({
                include: {
                    purchase_orders: {
                        select: {
                            id: true,
                            po_number: true,
                            date_issued: true,
                            due_date: true,
                            payment_status: true,
                            check_number: true,
                            dealer_discount: true,
                            purchase_order_items: {
                                select: {
                                    amount: true
                                }
                            },
                            // fallback: use dealer_discount as a numeric field for now
                            payment_term: true,
                            payment_mode: true,
                            // Only select fields that exist in the schema
                        }
                    }
                }
            });
            // Aggregate payment totals per supplier
            const result = suppliers.map((supplier) => {
                const purchaseOrders = supplier.purchase_orders || [];
                // Sum PO item amounts for more accurate totals
                const sumPOAmount = (po) => {
                    if (po.purchase_order_items && po.purchase_order_items.length > 0) {
                        return po.purchase_order_items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
                    }
                    return Number(po.dealer_discount) || 0;
                };
                const totalPaid = purchaseOrders
                    .filter((po) => po.payment_status === 'paid')
                    .reduce((sum, po) => sum + sumPOAmount(po), 0);
                const totalDue = purchaseOrders
                    .filter((po) => po.payment_status !== 'paid')
                    .reduce((sum, po) => sum + sumPOAmount(po), 0);
                return Object.assign(Object.assign({}, supplier), { totalPaid,
                    totalDue, purchase_orders: purchaseOrders });
            });
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error fetching supplier payments:', error);
            res.status(500).json({ error: 'Failed to fetch supplier payments' });
        }
    });
}
// (imports already present at top of file)
function listSuppliers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const suppliers = yield prisma_1.default.suppliers.findMany();
            res.status(200).json(suppliers);
        }
        catch (error) {
            console.error('Error fetching suppliers:', error);
            res.status(500).json({ error: 'Failed to fetch suppliers' });
        }
    });
}
function getSupplier(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const supplier = yield prisma_1.default.suppliers.findUnique({
                where: { id: Number(id) }
            });
            if (!supplier) {
                res.status(404).json({ error: 'Supplier not found' });
                return;
            }
            res.status(200).json(supplier);
        }
        catch (error) {
            console.error('Error fetching supplier:', error);
            res.status(500).json({ error: 'Failed to fetch supplier' });
        }
    });
}
function createSupplier(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            console.log('Creating supplier with data:', req.body);
            const supplier = yield prisma_1.default.suppliers.create({
                data: {
                    name: (_a = req.body) === null || _a === void 0 ? void 0 : _a.name,
                    contact_person: (_b = req.body) === null || _b === void 0 ? void 0 : _b.contact_person,
                    contact_number: (_c = req.body) === null || _c === void 0 ? void 0 : _c.contact_number,
                    tin_number: (_d = req.body) === null || _d === void 0 ? void 0 : _d.tin_number,
                    address: (_e = req.body) === null || _e === void 0 ? void 0 : _e.address,
                }
            });
            console.log('Created supplier:', supplier);
            res.status(201).json(supplier);
        }
        catch (error) {
            console.error('Error creating supplier:', error);
            res.status(500).json({ error: 'Failed to create supplier', details: error instanceof Error ? error.message : String(error) });
        }
    });
}
function updateSupplier(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const { id } = req.params;
            const supplier = yield prisma_1.default.suppliers.update({
                where: { id: Number(id) },
                data: {
                    name: (_a = req.body) === null || _a === void 0 ? void 0 : _a.name,
                    contact_person: (_b = req.body) === null || _b === void 0 ? void 0 : _b.contact_person,
                    contact_number: (_c = req.body) === null || _c === void 0 ? void 0 : _c.contact_number,
                    tin_number: (_d = req.body) === null || _d === void 0 ? void 0 : _d.tin_number,
                    address: (_e = req.body) === null || _e === void 0 ? void 0 : _e.address,
                }
            });
            res.status(200).json(supplier);
        }
        catch (error) {
            console.error('Error updating supplier:', error);
            res.status(500).json({ error: 'Failed to update supplier' });
        }
    });
}
function deleteSupplier(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            yield prisma_1.default.suppliers.delete({
                where: { id: Number(id) }
            });
            res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting supplier:', error);
            res.status(500).json({ error: 'Failed to delete supplier' });
        }
    });
}
