const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// must match SEED_TAG used in the seeder
const SEED_TAG = 'seed_kamias_sales_2025_07_11';

async function undo() {
  console.log('Undoing seeded sales with tag:', SEED_TAG);

  // find sales created by the seeder
  const sales = await prisma.sales.findMany({ where: { fmo: SEED_TAG }, include: { sales_inventory: true, sales_items: true } });
  if (!sales || sales.length === 0) {
    console.log('No seeded sales found with tag', SEED_TAG);
    await prisma.$disconnect();
    return;
  }

  console.log('Found', sales.length, 'sales to undo');

  for (const s of sales) {
    try {
      await prisma.$transaction(async (tx) => {
        // revert inventory movements linked via sales_inventory
        for (const si of s.sales_inventory) {
          try {
            // decrement sold_qty and increment ending_qty
            await tx.inventory_movements.update({ where: { id: si.inventory_id }, data: { sold_qty: { decrement: si.qty }, ending_qty: { increment: si.qty } } });
          } catch (e) {
            console.warn('WARN: could not revert inventory id', si.inventory_id, e.message || e);
          }
        }

        // revert vehicle unit statuses referenced by sales_items
        for (const it of s.sales_items) {
          if (it.vehicle_unit_id) {
            try {
              // set status back to available if it's currently 'sold'
              await tx.vehicle_units.update({ where: { id: it.vehicle_unit_id }, data: { status: 'available' } });
            } catch (e) {
              console.warn('WARN: could not revert vehicle unit id', it.vehicle_unit_id, e.message || e);
            }
          }
        }

        // finally delete the sale (cascade will delete sales_items, sales_inventory, loan_payments, etc.)
        await tx.sales.delete({ where: { id: s.id } });
        console.log('Deleted sale id', s.id);
      });
    } catch (err) {
      console.error('Failed to undo sale id', s.id, err.message || err);
    }
  }

  console.log('Undo complete. Reviewed', sales.length, 'sales.');
  await prisma.$disconnect();
}

undo().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
