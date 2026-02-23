"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const importController_1 = require("../controllers/importController");
const router = (0, express_1.Router)();
router.use((0, express_fileupload_1.default)({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: true
}));
router.post('/inventory', importController_1.importInventory);
exports.default = router;
