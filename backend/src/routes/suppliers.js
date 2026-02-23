"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplierController_1 = require("../controllers/supplierController");
const router = (0, express_1.Router)();
// List all suppliers
router.get('/', supplierController_1.listSuppliers);
// Get supplier payment monitoring data
router.get('/payments/monitor', supplierController_1.getSupplierPayments);
// Get a single supplier by id
router.get('/:id', supplierController_1.getSupplier);
// Create a new supplier
router.post('/', supplierController_1.createSupplier);
// Update a supplier by id
router.put('/:id', supplierController_1.updateSupplier);
// Delete a supplier by id
router.delete('/:id', supplierController_1.deleteSupplier);
exports.default = router;
