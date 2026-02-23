"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsController_1 = require("../controllers/reportsController");
const router = (0, express_1.Router)();
// Health checks for debugging router mounting
router.get('/', (_, res) => res.json({ ok: true, message: 'Reports router mounted' }));
router.get('/ping', (_, res) => res.json({ pong: true }));
// GET /api/reports/sales/export?period=daily|weekly|monthly|yearly|custom|all&branch_id=&start=&end=
router.get('/sales/export', reportsController_1.exportSalesReport);
exports.default = router;
