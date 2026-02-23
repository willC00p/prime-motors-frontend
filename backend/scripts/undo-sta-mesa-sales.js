const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEED_TAG = 'seed_sta_mesa_sales_2025_06_28';

async function undo() {
  console.log('Undoing seeded Sta. Mesa sales with tag:', SEED_TAG);
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
        for (const si of s.sales_inventory) {
          try {
            await tx.inventory_movements.update({ where: { id: si.inventory_id }, data: { sold_qty: { decrement: si.qty }, ending_qty: { increment: si.qty } } });
          } catch (e) {
            console.warn('WARN: could not revert inventory id', si.inventory_id, e.message || e);
          }
        }

        for (const it of s.sales_items) {
          if (it.vehicle_unit_id) {
            try {
              await tx.vehicle_units.update({ where: { id: it.vehicle_unit_id }, data: { status: 'available' } });
            } catch (e) {
              console.warn('WARN: could not revert vehicle unit id', it.vehicle_unit_id, e.message || e);
            }
          }
        }

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
