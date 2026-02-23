"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const router = (0, express_1.Router)();
// GET /api/dashboard - returns analytics for dashboard
router.get('/', dashboardController_1.getDashboardAnalytics);
exports.default = router;
