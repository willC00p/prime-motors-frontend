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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const po_1 = __importDefault(require("./routes/po"));
// Force TS import by adding explicit .js removal: ensure no stale sales.js present
const sales_1 = __importDefault(require("./routes/sales"));
const branches_1 = __importDefault(require("./routes/branches"));
const items_1 = __importDefault(require("./routes/items"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const modelLoanTemplates_1 = __importDefault(require("./routes/modelLoanTemplates"));
const models_1 = __importDefault(require("./routes/models"));
const import_1 = __importDefault(require("./routes/import"));
const salesImport_1 = __importDefault(require("./routes/salesImport"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const loanPayments_1 = __importDefault(require("./routes/loanPayments"));
const ltoRegistration_1 = __importDefault(require("./routes/ltoRegistration"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const reports_1 = __importDefault(require("./routes/reports"));
const salesController_1 = require("./controllers/salesController");
console.log('[Bootstrap] typeof salesRouter:', typeof sales_1.default);
console.log('[Bootstrap] typeof updateSale:', typeof salesController_1.updateSale);
const catchAsync_1 = require("./utils/catchAsync");
// Load environment variables
dotenv_1.default.config();
// Create Express app
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic route for testing
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.post('/api/echo', (req, res) => {
    console.log('Request body:', req.body);
    res.json(req.body);
});
// Test routes
app.get('/test', (req, res) => {
    res.json({ message: 'Test GET successful' });
});
app.post('/test', (req, res) => {
    console.log('Test POST received:', req.body);
    res.json({
        message: 'Test POST successful',
        received: req.body
    });
});
// Request logging middleware
app.use((req, res, next) => {
    console.log('🔍 Incoming request:', {
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params,
        body: req.body,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl
    });
    next();
});
// API routes
const apiRouter = express_1.default.Router();
// Auth routes
apiRouter.use('/auth', authRoutes_1.default);
// Core routes
apiRouter.use('/inventory', inventory_1.default);
apiRouter.use('/po', po_1.default);
apiRouter.use('/sales', sales_1.default);
apiRouter.use('/loan-payments', loanPayments_1.default);
apiRouter.use('/branches', branches_1.default);
apiRouter.use('/items', items_1.default);
apiRouter.use('/suppliers', suppliers_1.default);
apiRouter.use('/lto-registration', ltoRegistration_1.default);
apiRouter.use('/reports', reports_1.default);
// Analytics and features
apiRouter.use('/dashboard', dashboard_1.default);
apiRouter.use('/model-loan-templates', modelLoanTemplates_1.default);
apiRouter.use('/models', models_1.default);
// Import routes (order matters)
apiRouter.use('/import/sales', salesImport_1.default); // Must come before general /import
apiRouter.use('/import', import_1.default);
// Mount all routes under /api
app.use('/api', apiRouter);
// Hotfix: ensure PUT /api/sales/:id is always handled even if router ordering changes
app.put('/api/sales/:id', (req, res, next) => {
    console.log('[Hotfix] PUT /api/sales/:id hit', { params: req.params });
    next();
}, (0, catchAsync_1.catchAsync)(salesController_1.updateSale));
// Add this to debug route matching
app.use('*', (req, res, next) => {
    console.log('❌ No route matched:', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl
    });
    next();
});
app.get('/', (_, res) => res.send('Prime Motors API is live 🚀'));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
// Catch-all 404 handler (must be last)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});
const server = app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
// Graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGTERM signal received: closing HTTP server');
    yield prisma_1.default.$disconnect();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
}));
