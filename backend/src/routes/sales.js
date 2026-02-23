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
const salesController_1 = require("../controllers/salesController");
const prisma_1 = __importDefault(require("../lib/prisma"));
const catchAsync_1 = require("../utils/catchAsync");
const router = (0, express_1.Router)();
// Debug: log that sales router is loaded and list key routes
console.log('[Sales Router] Loaded. Routes: GET /, GET /:id, POST /, PUT /:id, PUT /:id/delivery');
// Lightweight debug endpoint to verify router wiring
router.get('/_debug', (req, res) => {
    res.json({ ok: true, routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'PUT /:id/delivery'] });
});
// List all sales (optionally filter by branch)
router.get('/', (0, catchAsync_1.catchAsync)(salesController_1.listSales));
// Get a single sales report by ID
router.get('/:id', (0, catchAsync_1.catchAsync)(salesController_1.getSale));
// Create a new sales report
router.post('/', (0, catchAsync_1.catchAsync)(salesController_1.createSale));
// Update delivery status/date for a sale (place specific route before generic id)
router.put('/:id/delivery', (req, res, next) => { console.log('[Sales Router] PUT /:id/delivery hit', req.params); next(); }, (0, catchAsync_1.catchAsync)(salesController_1.updateDelivery));
// Update a sale by id (inline handler to bypass missing compiled export)
router.put('/:id', (req, res, next) => { console.log('[Sales Router] PUT /:id hit', req.params); next(); }, (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: 'Invalid id parameter' });
        return;
    }
    const body = req.body || {};
    const numeric = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
    const dateOrNull = (v) => (v ? new Date(v) : null);
    try {
        const updated = yield prisma_1.default.sales.update({
            where: { id: Number(id) },
            data: {
                branch_id: body.branch_id !== undefined ? Number(body.branch_id) : undefined,
                date_sold: body.date_sold ? new Date(body.date_sold) : undefined,
                category_of_sales: (_a = body.category_of_sales) !== null && _a !== void 0 ? _a : undefined,
                last_name: (_b = body.last_name) !== null && _b !== void 0 ? _b : undefined,
                first_name: (_c = body.first_name) !== null && _c !== void 0 ? _c : undefined,
                middle_name: body.middle_name === '' ? null : body.middle_name,
                address: body.address === '' ? null : body.address,
                contact_no: body.contact_no === '' ? null : body.contact_no,
                dr_no: body.dr_no === '' ? null : body.dr_no,
                si_no: body.si_no === '' ? null : body.si_no,
                total_amount: body.total_amount !== undefined ? Number(body.total_amount) : undefined,
                payment_method: (_d = body.payment_method) !== null && _d !== void 0 ? _d : undefined,
                loan_amount: numeric(body.loan_amount),
                date_granted: dateOrNull(body.date_granted),
                maturity_date: dateOrNull(body.maturity_date),
                terms: numeric(body.terms),
                downpayment_percentage: numeric(body.downpayment_percentage),
                rebates_commission: numeric(body.rebates_commission),
                monthly_amortization: numeric(body.monthly_amortization),
                ar_balance: numeric(body.ar_balance),
                age: numeric(body.age),
                agent: (_e = body.agent) !== null && _e !== void 0 ? _e : undefined,
                fmo: body.fmo === '' ? null : body.fmo,
                bm: body.bm === '' ? null : body.bm,
                mechanic: body.mechanic === '' ? null : body.mechanic,
                bao: body.bao === '' ? null : body.bao,
            }
        });
        res.json(updated);
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.code) === 'P2025') {
            res.status(404).json({ error: 'Sale not found' });
            return;
        }
        console.error('[Sales Router] update inline error:', err);
        res.status(500).json({ error: 'Failed to update sale', details: err instanceof Error ? err.message : String(err) });
    }
})));
exports.default = router;
