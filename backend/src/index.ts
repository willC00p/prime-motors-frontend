import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './lib/prisma';

import inventoryRouter from './routes/inventory';
import poRouter from './routes/po';
// Force TS import by adding explicit .js removal: ensure no stale sales.js present
import salesRouter from './routes/sales';
import branchesRouter from './routes/branches';
import itemsRouter from './routes/items';
import suppliersRouter from './routes/suppliers';

import modelLoanTemplatesRouter from './routes/modelLoanTemplates';
import modelsRouter from './routes/models';
import importRouter from './routes/import';
import salesImportRouter from './routes/salesImport';
import dashboardRouter from './routes/dashboard';
import loanPaymentsRouter from './routes/loanPayments';
import ltoRegistrationRouter from './routes/ltoRegistration';
import authRouter from './routes/authRoutes';
import reportsRouter from './routes/reports';
import accountsRouter from './routes/accounts';
import { updateSale } from './controllers/salesController';
console.log('[Bootstrap] typeof salesRouter:', typeof salesRouter);
console.log('[Bootstrap] typeof updateSale:', typeof updateSale);
import { catchAsync } from './utils/catchAsync';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
app.post('/api/echo', (req: Request, res: Response) => {
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
const apiRouter = express.Router();

// Auth routes
apiRouter.use('/auth', authRouter);

// Account routes (HR management)
apiRouter.use('/accounts', accountsRouter);

// Core routes
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/po', poRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/loan-payments', loanPaymentsRouter);
apiRouter.use('/branches', branchesRouter);
apiRouter.use('/items', itemsRouter);
apiRouter.use('/suppliers', suppliersRouter);
apiRouter.use('/lto-registration', ltoRegistrationRouter);
apiRouter.use('/reports', reportsRouter);

// Analytics and features
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/model-loan-templates', modelLoanTemplatesRouter);
apiRouter.use('/models', modelsRouter);

// Import routes (order matters)
apiRouter.use('/import/sales', salesImportRouter);  // Must come before general /import
apiRouter.use('/import', importRouter);

// Mount all routes under /api
app.use('/api', apiRouter);

// Hotfix: ensure PUT /api/sales/:id is always handled even if router ordering changes
app.put('/api/sales/:id', (req, res, next) => { 
  console.log('[Hotfix] PUT /api/sales/:id hit', { params: req.params }); 
  next(); 
}, catchAsync(updateSale));

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
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
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
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
