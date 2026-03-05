import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Clear all data from models, inventory, and sales tables
 * WARNING: This is a destructive operation and should only be available to admins
 */
export const clearData = async (req: Request, res: Response) => {
  try {
    // Temporary dev feature - no auth required for now
    console.log(`[ADMIN] Data clear operation initiated`);

    // Delete data in order of dependencies
    const results = {
      vehicle_units_deleted: 0,
      inventory_deleted: 0,
      sales_items_deleted: 0,
      sales_deleted: 0,
      purchase_order_items_deleted: 0,
      purchase_orders_deleted: 0
    };

    // 1. Delete vehicle units (depends on inventory)
    const vehicleUnitsResult = await prisma.vehicle_units.deleteMany({});
    results.vehicle_units_deleted = vehicleUnitsResult.count;
    console.log(`Deleted ${results.vehicle_units_deleted} vehicle units`);

    // 2. Delete inventory
    const inventoryResult = await prisma.inventory_movements.deleteMany({});
    results.inventory_deleted = inventoryResult.count;
    console.log(`Deleted ${results.inventory_deleted} inventory records`);

    // 3. Delete sales items first
    const salesItemsResult = await prisma.sales_items.deleteMany({});
    results.sales_items_deleted = salesItemsResult.count;
    console.log(`Deleted ${results.sales_items_deleted} sales items`);

    // 4. Delete sales
    const salesResult = await prisma.sales.deleteMany({});
    results.sales_deleted = salesResult.count;
    console.log(`Deleted ${results.sales_deleted} sales records`);

    // 5. Delete purchase order items
    const poItemsResult = await prisma.purchase_order_items.deleteMany({});
    results.purchase_order_items_deleted = poItemsResult.count;
    console.log(`Deleted ${results.purchase_order_items_deleted} PO items`);

    // 6. Delete purchase orders
    const poResult = await prisma.purchase_orders.deleteMany({});
    results.purchase_orders_deleted = poResult.count;
    console.log(`Deleted ${results.purchase_orders_deleted} purchase orders`);

    res.json({
      message: 'Data cleared successfully',
      ...results
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ 
      error: 'Failed to clear data',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
