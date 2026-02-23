"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 4001; // Different port
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Test routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'GET test successful' });
});
app.post('/api/test', (req, res) => {
    console.log('Received POST data:', req.body);
    res.json({
        message: 'POST test successful',
        received: req.body
    });
});
app.listen(port, () => {
    console.log(`Test server running on http://localhost:${port}`);
});
