"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const modelController_1 = require("../controllers/modelController");
const router = (0, express_1.Router)();
// GET /api/models - list all models with loan templates
router.get('/', modelController_1.listModels);
exports.default = router;
