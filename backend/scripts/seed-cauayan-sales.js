const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

const SEED_TAG = 'seed_cauayan_sales_2025_11_08';

// Single Cauayan sale row from user-provided data (2025-11-08)
const rows = [
  {
    date: '2025-11-08',
    dr_no: '89',
    source: 'AGENT',
    category: 'Financing',
    brand: 'MONARCH',
    model: 'MONARCH 175',
    color: 'RED',
    engine: '162FMKS5106898',
    chassis: 'LX8PCL502SE008119',
    total: 50000,
    last: 'LUBO',
    first: 'BOBBY',
    middle: 'CANCERAN',
    address: 'P1 CENTRO CABATUAN ISABELA',
    contact: '',
    sales_closer: 'ALFRED'
  }
];

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Cauayan', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Cauayan" not found in branches table.');
  return b;
}

function normalizeModel(s) { return utils.normalizeSkygoModel(s); }

async function seed() {
  const branch = await findBranch();
  console.log('Seeding sales for branch:', branch.name, 'id=', branch.id);

  const created = [];
  const skipped = [];
  for (const r of rows) {
    try {
      const dateSold = r.date ? new Date(r.date) : new Date();

      const engKey = (r.engine || '').trim();
      const chsKey = (r.chassis || '').trim();
      if (engKey || chsKey) {
        const alreadySold = await utils.isVehicleAlreadySold(prisma, engKey, chsKey);
        if (alreadySold) {
          console.log('Skip existing sale for unit', engKey || chsKey, '(already sold)');
          skipped.push(engKey || chsKey);
          continue;
        }
      }

      const modelNorm = normalizeModel(r.model || '');
      const item = await utils.findSkygoItemForModel(prisma, modelNorm);
      if (!item) { console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no); continue; }

      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, r.engine, r.chassis);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) { console.warn('SKIP: No available unit (and could not auto-add) for', r.engine || r.chassis, 'model', item.model, 'dr_no', r.dr_no); continue; }
      }

      const totalAmount = r.total != null ? Number(r.total) : 0;
      const category = r.category || 'Financing';

      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sales.create({
          data: {
            branch_id: branch.id,
            date_sold: dateSold,
            dr_no: r.dr_no || null,
            si_no: r.dr_no || null,
            total_amount: totalAmount,
            payment_method: category,
            category_of_sales: category,
            source_of_sales: r.source || null,
            last_name: r.last || '',
            first_name: r.first || '',
            middle_name: r.middle || null,
            address: r.address || null,
            contact_no: r.contact || null,
            agent: r.sales_closer || null,
            fmo: SEED_TAG
          }
        });

        await tx.vehicle_units.update({ where: { id: vehicle.id }, data: { status: 'sold' } });
        await tx.inventory_movements.update({ where: { id: vehicle.inventory_id }, data: { sold_qty: { increment: 1 }, ending_qty: { decrement: 1 } } });
        await tx.sales_items.create({ data: { sale_id: sale.id, item_id: item.id, qty: 1, unit_price: totalAmount || 0, amount: totalAmount || 0, vehicle_unit_id: vehicle.id } });
        await tx.sales_inventory.create({ data: { sale_id: sale.id, inventory_id: vehicle.inventory_id, qty: 1 } });

        return sale;
      });

      created.push(result.id);
      console.log('Created sale id', result.id, 'dr_no', r.dr_no || null);
    } catch (err) {
      console.error('Failed to insert sale for dr_no', r.dr_no, err.message || err);
    }
  }

  console.log('\nSeeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
