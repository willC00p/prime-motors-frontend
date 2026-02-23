"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const poController_1 = require("../controllers/poController");
const poController_2 = require("../controllers/poController");
const router = (0, express_1.Router)();
// Route definitions
router.get('/', poController_1.listPOs);
router.get('/pending-items', poController_1.listPendingItems);
router.get('/available-models', poController_1.getAvailableModels);
router.get('/next-po-number', poController_1.getNextPONumber);
router.post('/', poController_1.createPO);
router.post('/:id/payment', poController_1.updatePaymentStatus);
router.post('/:id/deliver', poController_1.partialDeliverPO);
router.post('/:id/complete', poController_1.completePO);
router.get('/:id/pdf', poController_1.generatePDF);
router.get('/:id/items', poController_2.getPOItems);
exports.default = router;
