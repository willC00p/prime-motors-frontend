import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { listSales, getSale, createSale, updateDelivery } from '../controllers/salesController';
import prisma from '../lib/prisma';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

// Debug: log that sales router is loaded and list key routes
console.log('[Sales Router] Loaded. Routes: GET /, GET /:id, POST /, PUT /:id, PUT /:id/delivery');

// Lightweight debug endpoint to verify router wiring
router.get('/_debug', (req, res) => {
	res.json({ ok: true, routes: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'PUT /:id/delivery'] });
});

// List all sales (optionally filter by branch)
router.get('/', catchAsync(listSales));

// Get a single sales report by ID
router.get('/:id', catchAsync(getSale));

// Create a new sales report
router.post('/', catchAsync(createSale));

// Update delivery status/date for a sale (place specific route before generic id)
router.put('/:id/delivery', (req, res, next) => { console.log('[Sales Router] PUT /:id/delivery hit', req.params); next(); }, catchAsync(updateDelivery));

// Update a sale by id (inline handler to bypass missing compiled export)
router.put('/:id', (req, res, next) => { console.log('[Sales Router] PUT /:id hit', req.params); next(); }, catchAsync(async (req, res) => {
	const { id } = req.params;
	if (!id || isNaN(Number(id))) {
		res.status(400).json({ error: 'Invalid id parameter' });
		return;
	}
	const body = req.body || {};
	const numeric = (v: any) => (v === undefined || v === null || v === '' ? null : Number(v));
	const dateOrNull = (v: any) => (v ? new Date(v) : null);
	try {
		const updated = await prisma.sales.update({
			where: { id: Number(id) },
			data: {
				branch_id: body.branch_id !== undefined ? Number(body.branch_id) : undefined,
				date_sold: body.date_sold ? new Date(body.date_sold) : undefined,
				category_of_sales: body.category_of_sales ?? undefined,
				last_name: body.last_name ?? undefined,
				first_name: body.first_name ?? undefined,
				middle_name: body.middle_name === '' ? null : body.middle_name,
				address: body.address === '' ? null : body.address,
				contact_no: body.contact_no === '' ? null : body.contact_no,
				dr_no: body.dr_no === '' ? null : body.dr_no,
				si_no: body.si_no === '' ? null : body.si_no,
				total_amount: body.total_amount !== undefined ? Number(body.total_amount) : undefined,
				payment_method: body.payment_method ?? undefined,
				loan_amount: numeric(body.loan_amount),
				date_granted: dateOrNull(body.date_granted),
				maturity_date: dateOrNull(body.maturity_date),
				terms: numeric(body.terms),
				downpayment_percentage: numeric(body.downpayment_percentage),
				rebates_commission: numeric(body.rebates_commission),
				monthly_amortization: numeric(body.monthly_amortization),
				ar_balance: numeric(body.ar_balance),
				age: numeric(body.age),
				agent: body.agent ?? undefined,
				fmo: body.fmo === '' ? null : body.fmo,
				bm: body.bm === '' ? null : body.bm,
				mechanic: body.mechanic === '' ? null : body.mechanic,
				bao: body.bao === '' ? null : body.bao,
			}
		});
		res.json(updated);
	} catch (err: any) {
		if (err?.code === 'P2025') {
			res.status(404).json({ error: 'Sale not found' });
			return;
		}
		console.error('[Sales Router] update inline error:', err);
		res.status(500).json({ error: 'Failed to update sale', details: err instanceof Error ? err.message : String(err) });
	}
}));


export default router;
