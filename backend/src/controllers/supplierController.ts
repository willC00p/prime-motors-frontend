

// Get payment monitoring data for all suppliers
import express from 'express';
import prisma from '../lib/prisma';

// Get payment monitoring data for all suppliers
export async function getSupplierPayments(req: express.Request, res: express.Response) {
  try {
    const suppliers = await prisma.suppliers.findMany({
      include: {
        purchase_orders: {
          select: {
            id: true,
            po_number: true,
            date_issued: true,
            due_date: true,
            payment_status: true,
            check_number: true,
            dealer_discount: true,
            purchase_order_items: {
              select: {
                amount: true
              }
            },
            // fallback: use dealer_discount as a numeric field for now
            payment_term: true,
            payment_mode: true,
            // Only select fields that exist in the schema
          }
        }
      }
    }) as any[];

    // Aggregate payment totals per supplier
    const result = suppliers.map((supplier: any) => {
      const purchaseOrders = supplier.purchase_orders || [];
      // Sum PO item amounts for more accurate totals
      const sumPOAmount = (po: any) => {
        if (po.purchase_order_items && po.purchase_order_items.length > 0) {
          return po.purchase_order_items.reduce((s: number, item: any) => s + (Number(item.amount) || 0), 0);
        }
        return Number(po.dealer_discount) || 0;
      };
      const totalPaid = purchaseOrders
        .filter((po: any) => po.payment_status === 'paid')
        .reduce((sum: number, po: any) => sum + sumPOAmount(po), 0);
      const totalDue = purchaseOrders
        .filter((po: any) => po.payment_status !== 'paid')
        .reduce((sum: number, po: any) => sum + sumPOAmount(po), 0);
      return {
        ...supplier,
        totalPaid,
        totalDue,
        purchase_orders: purchaseOrders
      };
    });
  res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
  res.status(500).json({ error: 'Failed to fetch supplier payments' });
  }
}
// (imports already present at top of file)

export async function listSuppliers(req: express.Request, res: express.Response) {
  try {
    const suppliers = await prisma.suppliers.findMany();
  res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
  res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
}

export async function getSupplier(req: express.Request, res: express.Response) {
  try {
  const { id } = req.params as { id: string };
    const supplier = await prisma.suppliers.findUnique({
      where: { id: Number(id) }
    });
    if (!supplier) {
  res.status(404).json({ error: 'Supplier not found' });
      return;
    }
  res.status(200).json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
  res.status(500).json({ error: 'Failed to fetch supplier' });
  }
}

export async function createSupplier(req: express.Request, res: express.Response) {
  try {
    console.log('Creating supplier with data:', req.body);
    const supplier = await prisma.suppliers.create({
      data: {
  name: req.body?.name,
  contact_person: req.body?.contact_person,
  contact_number: req.body?.contact_number,
  tin_number: req.body?.tin_number,
  address: req.body?.address,
      }
    });
    console.log('Created supplier:', supplier);
  res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
  res.status(500).json({ error: 'Failed to create supplier', details: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateSupplier(req: express.Request, res: express.Response) {
  try {
  const { id } = req.params as { id: string };
    const supplier = await prisma.suppliers.update({
      where: { id: Number(id) },
      data: {
  name: req.body?.name,
  contact_person: req.body?.contact_person,
  contact_number: req.body?.contact_number,
  tin_number: req.body?.tin_number,
  address: req.body?.address,
      }
    });
  res.status(200).json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
  res.status(500).json({ error: 'Failed to update supplier' });
  }
}

export async function deleteSupplier(req: express.Request, res: express.Response) {
  try {
  const { id } = req.params as { id: string };
    await prisma.suppliers.delete({
      where: { id: Number(id) }
    });
  res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
  res.status(500).json({ error: 'Failed to delete supplier' });
  }
}
