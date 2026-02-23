import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
// Ensure updateSale exported (debug line)
console.log('[salesController.ts] module loaded');

type TypedRequest = Request<ParamsDictionary, any, any, ParsedQs>;
type TypedResponse = Response;

interface LoanPayment {
  payment_no: number;
  amount: number;
  paid_amount: number;
  status: string;
  paid_date?: Date;
}

interface SaleWithPayments extends Prisma.salesGetPayload<{
  include: {
    branches: {
      include: {
        inventory_movements: {
          include: {
            items: true;
            vehicle_units: true;
          };
        };
      };
    };
    sales_items: {
      include: {
        items: true;
        vehicle_unit: {
          include: {
            inventory: {
              include: {
                items: true;
                branches: true;
                vehicle_units: true;
              };
            };
          };
        };
      };
    };
    lto_registrations: true;
  };
}> {
  loan_payments?: LoanPayment[];
  paid_payments?: number;
  total_paid?: number;
  remaining_balance?: number;
}

// Helper function to log errors
const logError = (context: string, error: any) => {
  console.error(`[Sales Controller] ${context}:`, error);
  if (error instanceof Error) {
    console.error('Stack trace:', error.stack);
  }
};

// List all sales (optionally filter by branch, date range, and payment type)
export async function listSales(req: TypedRequest, res: TypedResponse): Promise<void> {
  try {
    console.log('[Sales Controller] Listing sales with query:', req.query);
    const { branch_id, start_date, end_date, payment_method } = req.query;
    const where = {} as any;
    
    if (payment_method) {
      console.log(`[Sales Controller] Filtering by payment_method:`, payment_method);
      
      where.payment_method = payment_method;
      
      if (payment_method === 'loan') {
        // Simple approach - just get sales with non-null loan fields
        where.AND = [
          { loan_amount: { not: null } },
          { terms: { not: null } }
        ];
        console.log('[Sales Controller] Loan-specific filters:', JSON.stringify(where, null, 2));
      }
    }

    if (branch_id) {
      where.branch_id = Number(branch_id);
      // Verify branch exists
      const branch = await prisma.branches.findUnique({
        where: { id: Number(branch_id) },
        include: { inventory_movements: true }
      });
      if (!branch) {
        console.warn(`[Sales Controller] Branch not found with id:`, branch_id);
        res.status(404).json({ error: `Branch not found with id: ${branch_id}` });
        return;
      }
      console.log(`[Sales Controller] Found branch:`, branch.name);
    }

    if (start_date && end_date) {
      where.date_sold = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
      console.log(`[Sales Controller] Filtering by date range:`, { start_date, end_date });
    }

    console.log('[Sales Controller] Executing sales query with where clause:', where);
    const sales = await prisma.sales.findMany({
      where,
      include: {
        branches: {
          include: {
            inventory_movements: {
              include: {
                items: true,
                vehicle_units: true
              }
            }
          }
        },
        loan_payments: {
          select: {
            payment_no: true,
            amount: true,
            paid_amount: true,
            status: true,
            paid_date: true
          }
        },
        sales_items: {
          include: {
            items: true,
            vehicle_unit: {
              include: {
                inventory: {
                  include: {
                    items: true,
                    branches: true,
                    vehicle_units: {
                      where: { status: 'sold' }
                    }
                  }
                }
              }
            }
          }
        },
        lto_registrations: {
          select: {
            id: true,
            plate_number: true,
            engine_number: true,
            chassis_number: true,
            mv_file_number: true,
            cr_number: true,
            or_number: true,
            registration_date: true,
            expiration_date: true,
            status: true,
            csr_number: true,
            sdr_number: true,
            insurance_number: true,
            insurance_provider: true,
            insurance_policy_number: true,
            insurance_expiry: true,
            registration_fee: true,
            insurance_fee: true,
            remarks: true,
            vehicle_unit: true
          }
        }
      },
      orderBy: { date_sold: 'desc' }
    });

    // Add loan payment calculations
    const salesWithPayments = sales.map(sale => {
      const payments = (sale as any).loan_payments || [];
      const loan_payments: LoanPayment[] = payments.map((p: LoanPayment) => ({
        ...p,
        paid_date: p.paid_date ? new Date(p.paid_date) : undefined
      }));
      const paidPayments = loan_payments.filter(p => p.status === 'paid').length;
      const totalPaid = loan_payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
      const remainingBalance = Number(sale.loan_amount || 0) - totalPaid;
      return {
        ...sale,
        loan_payments,
        paid_payments: paidPayments,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      };
    });

    console.log(`[Sales Controller] Successfully fetched ${sales.length} sales`);
    if (Array.isArray(salesWithPayments)) {
      salesWithPayments.forEach((sale, idx) => {
        console.log(`[Sales Controller] Sale #${idx}:`, {
          id: sale.id,
          first_name: sale.first_name,
          last_name: sale.last_name,
          payment_method: sale.payment_method,
          date_granted: sale.date_granted,
          loan_amount: sale.loan_amount,
          terms: sale.terms
        });

        // Additional loan-specific debug info
        if (sale.payment_method === 'loan') {
          console.log(`[Sales Controller] Loan details for sale #${sale.id}:`, {
            has_date_granted: !!sale.date_granted,
            date_granted_year: sale.date_granted ? new Date(sale.date_granted).getFullYear() : null,
            loan_payments_count: sale.loan_payments?.length || 0,
            loan_amount_valid: sale.loan_amount ? Number(sale.loan_amount) > 0 : false,
            terms_valid: sale.terms ? sale.terms > 0 : false
          });
        }
      });
    }

    res.json(salesWithPayments);
  } catch (error) {
    logError('Failed to fetch sales', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Get a single sales report by ID
export async function getSale(req: TypedRequest, res: TypedResponse): Promise<void> {
  try {
    const { id } = req.params;
    console.log(`[Sales Controller] Fetching sale with id:`, id);

    const sale = await prisma.sales.findUnique({
      where: { id: Number(id) },
      include: {
        branches: true,
        sales_items: {
          include: {
            items: true,
            vehicle_unit: {
              include: {
                inventory: {
                  include: {
                    items: true,
                    branches: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!sale) {
      console.warn(`[Sales Controller] Sale not found with id:`, id);
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    console.log(`[Sales Controller] Successfully fetched sale:`, {
      id: sale.id,
      branch_id: sale.branch_id,
      date_sold: sale.date_sold,
      items_count: sale.sales_items.length
    });

    res.json(sale);
  } catch (error) {
    logError('Failed to fetch sale', error);
    res.status(500).json({ 
      error: 'Failed to fetch sale',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Create a new sales report
export async function createSale(req: TypedRequest, res: TypedResponse): Promise<void> {
  try {
    const { 
      branch_id,
      date_sold,
      category_of_sales,
      last_name,
      first_name,
      middle_name,
      address,
      contact_no,
      dr_no,
      si_no,
      total_amount,
      payment_method,
      source_of_sales,
      loan_amount,
      date_granted,
      maturity_date,
      terms,
      downpayment_percentage,
      rebates_commission,
      monthly_amortization,
      ar_balance,
      items 
    } = req.body;

    // Validate age if provided
    if (req.body.age !== undefined && req.body.age !== null) {
      const age = Number(req.body.age);
      if (isNaN(age) || age < 18 || age > 120) {
        res.status(400).json({ 
          error: 'Invalid age value', 
          details: 'Age must be between 18 and 120 years old'
        });
        return;
      }
    }

    // Start transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale record
      const newSale = await tx.sales.create({
        data: {
          branch_id: Number(branch_id),
          date_sold: new Date(date_sold),
          category_of_sales: category_of_sales || '',
          last_name,
          first_name,
          middle_name,
          address,
          contact_no,
          dr_no,
          si_no,
          total_amount: Number(total_amount),
          payment_method,
          source_of_sales: source_of_sales || null,
          loan_amount: (payment_method === 'inhouse' || payment_method === 'financing') && monthly_amortization && terms ? 
            (Number(monthly_amortization) * Number(terms)) - 
            ((Number(downpayment_percentage) || 0) / 100 * Number(total_amount)) : null,
          date_granted: date_granted ? new Date(date_granted) : null,
          maturity_date: maturity_date ? new Date(maturity_date) : null,
          terms: terms ? Number(terms) : null,
          downpayment_percentage: downpayment_percentage ? Number(downpayment_percentage) : null,
          rebates_commission: rebates_commission ? Number(rebates_commission) : null,
          monthly_amortization: monthly_amortization ? Number(monthly_amortization) : null,
          ar_balance: ar_balance ? Number(ar_balance) : null,
          age: req.body.age ? Number(req.body.age) : null,
          agent: req.body.agent,
          fmo: req.body.fmo,
          bm: req.body.bm,
          mechanic: req.body.mechanic,
          bao: req.body.bao
        }
      });

      // Create sales items
      if (Array.isArray(items)) {
        await Promise.all(items.map(item => 
          tx.sales_items.create({
            data: {
              sale_id: newSale.id,
              item_id: item.item_id,
              vehicle_unit_id: item.vehicle_unit_id,
              qty: Number(item.qty),
              unit_price: Number(item.unit_price),
              amount: Number(item.amount)
            }
          })
        ));

        // Update inventory movements and vehicle units
        for (const item of items) {
          // Update inventory movement quantities
          await tx.inventory_movements.update({
            where: { id: item.inventory_id },
            data: {
              sold_qty: { increment: Number(item.qty) },
              ending_qty: { decrement: Number(item.qty) }
            }
          });

          // Mark vehicle unit as sold
          if (item.vehicle_unit_id) {
            await tx.$executeRaw`
              UPDATE vehicle_units 
              SET status = 'sold' 
              WHERE id = ${item.vehicle_unit_id}
            `;
          }
        }
      }

      return newSale;
    });

    // If this is a loan sale (inhouse or financing), generate loan payments
    if (
      sale &&
      (payment_method === 'inhouse' || payment_method === 'financing') &&
      loan_amount &&
      terms &&
      monthly_amortization &&
      date_granted
    ) {
      // Start from the next month after sale date
      const saleDate = new Date(date_granted);
      let baseYear = saleDate.getFullYear();
      let baseMonth = saleDate.getMonth() + 1; // Next month after sale
      
      // Adjust if baseMonth goes beyond 11 (December)
      if (baseMonth > 11) {
        baseYear += 1;
        baseMonth = 0;
      }

      const paymentRecords = Array.from({ length: Number(terms) }, (_, i) => {
        // Calculate the payment date for each month
        let dueYear = baseYear;
        let dueMonth = baseMonth + i;
        
        // Adjust year if months roll over
        if (dueMonth > 11) {
          dueYear += Math.floor(dueMonth / 12);
          dueMonth = dueMonth % 12;
        }

        const dueDate = new Date(dueYear, dueMonth, 1);
        return {
          sale_id: sale.id,
          payment_no: i + 1,
          due_date: dueDate,
          amount: Number(monthly_amortization),
          status: 'pending',
          paid_amount: 0
        };
      });
      await prisma.loan_payments.createMany({ data: paymentRecords });
    }

    res.status(201).json(sale);
  } catch (error) {
    logError('Failed to create sale', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to create sale', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}

// Update an existing sale (basic fields only; does not modify sales_items)
export async function updateSale(req: TypedRequest, res: TypedResponse): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Missing id param' });
      return;
    }
    const body = req.body || {};

    // Validate age if provided
    if (body.age !== undefined && body.age !== null && body.age !== '') {
      const age = Number(body.age);
      if (isNaN(age) || age < 18 || age > 120) {
        res.status(400).json({ 
          error: 'Invalid age value', 
          details: 'Age must be between 18 and 120 years old' 
        });
        return;
      }
    }

    const toNull = (v: any) => (v === undefined || v === '' ? null : v);
    const toNumOrNull = (v: any) => {
      if (v === undefined || v === '' || v === null) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    };
    const toDateOrNull = (v: any) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const data: any = {
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
      source_of_sales: body.source_of_sales === '' ? null : body.source_of_sales,
      loan_amount: toNumOrNull(body.loan_amount),
      date_granted: toDateOrNull(body.date_granted),
      maturity_date: toDateOrNull(body.maturity_date),
      terms: toNumOrNull(body.terms),
      downpayment_percentage: toNumOrNull(body.downpayment_percentage),
      rebates_commission: toNumOrNull(body.rebates_commission),
      monthly_amortization: toNumOrNull(body.monthly_amortization),
      ar_balance: toNumOrNull(body.ar_balance),
      age: toNumOrNull(body.age),
      agent: body.agent ?? undefined,
      fmo: toNull(body.fmo),
      bm: toNull(body.bm),
      mechanic: toNull(body.mechanic),
      bao: toNull(body.bao)
    };

    // Remove undefined keys so Prisma doesn't overwrite unintentionally
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const updated = await prisma.sales.update({
      where: { id: Number(id) },
      data,
      include: {
        branches: true,
        sales_items: {
          include: {
            items: true,
            vehicle_unit: {
              include: {
                inventory: { include: { items: true, branches: true } }
              }
            }
          }
        },
        lto_registrations: true
      }
    });

    res.json(updated);
  } catch (error) {
    // Handle not found
    if ((error as any)?.code === 'P2025') {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }
    logError('Failed to update sale', error);
    res.status(500).json({ 
      error: 'Failed to update sale', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

// Update delivery status and delivery date for a sale
export async function updateDelivery(req: TypedRequest, res: TypedResponse): Promise<void> {
  try {
    const { id } = req.params;
    const { delivery_status, delivery_date } = req.body;

    if (!delivery_status && !delivery_date) {
      res.status(400).json({ error: 'delivery_status or delivery_date must be provided' });
      return;
    }

    const updateData: any = {};
    if (delivery_status !== undefined) updateData.delivery_status = String(delivery_status);
    if (delivery_date !== undefined && delivery_date !== null && delivery_date !== '') updateData.delivery_date = new Date(delivery_date);
    if (delivery_date === null) updateData.delivery_date = null;

    const sale = await prisma.sales.update({
      where: { id: Number(id) },
      data: updateData
    });

    res.json(sale);
  } catch (error) {
    logError('Failed to update delivery', error);
    res.status(500).json({ error: 'Failed to update delivery', details: error instanceof Error ? error.message : String(error) });
  }
}
