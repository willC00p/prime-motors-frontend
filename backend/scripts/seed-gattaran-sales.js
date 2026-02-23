const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_gattaran_sales_2025_10_18';

function parseDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  let m = s.match(/^([0-1]?\d)[\/-]([0-3]?\d)[\/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  m = s.match(/^([0-1]?\d)[\/-]([0-3]?\d)[\/-](\d{2})$/);
  if (m) {
    const yy = Number(m[3]);
    const year = yy < 50 ? 2000 + yy : 1900 + yy;
    return new Date(year, Number(m[1]) - 1, Number(m[2]));
  }
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? new Date() : d2;
}

function parseAmount(val) {
  if (val == null) return 0;
  const s = String(val);
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  if (Number.isNaN(n)) return 0;
  return Math.round(n / 100);
}

function normalizeModel(s) { return utils.normalizeSkygoModel(s); }
function modelSearchTerms(model) {
  const m = normalizeModel(model);
  const terms = new Set();
  if (m) terms.add(m);
  if (/^omni\s*125$/i.test(m)) { terms.add('VM125'); terms.add('WM125'); }
  if (/^monarch\s*175$/i.test(m)) terms.add('TM175');
  if (/^monarch\s*125$/i.test(m)) terms.add('TM125');
  if (/^monarch\s*150$/i.test(m)) terms.add('TM150');
  if (/^p1\s*bolt\s*150$/i.test(m)) terms.add('BOLT 150');
  if (/^m1\s*lance\s*150$/i.test(m)) terms.add('LANCE 150');
  return Array.from(terms);
}

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Gattaran', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Gattaran" not found in branches table.');
  return b;
}

// Dataset: October 2025 (Gattaran)
const rows = [
  { date: '10-18-2025', closer: 'RAFFY',  source: 'AGENT', category: 'Financing', last: 'RAMOS',   first: 'EDVIL',   middle: 'PINTO',   address: 'ZONE 6  CALAOGAN BASSIT GATTARAN CAGAYAN', contact: '9773926884', dr_no: '446', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226937', chassis: 'LX8TDK8G9SB0001359', total: '115,000.00' },
  { date: '10-24-2025', closer: 'JERICO', source: 'AGENT', category: 'Financing', last: 'MATERUM', first: 'MARIEL', middle: 'BALANZA', address: 'ZONE 2 2 GUISING GATTARAN CAGAYAN',        contact: '',           dr_no: '111', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226928', chassis: 'LX8TDK8G7SB001358', total: '115,000.00' },
  { date: '10-25-2025', closer: 'JERICO', source: 'AGENT', category: 'Financing', last: 'PERALTA', first: 'CHRIS',  middle: 'MACASIAB',address: 'SAN  MARIANO LALLO-CAGAYAN',              contact: '',           dr_no: '114', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1226930', chassis: 'LX8TDK8GXSB001385', total: '115,000.00' },
  // November 2025 entries
  { date: '11/01/2025', closer: 'JERICHO', source: 'AGENT', category: 'Financing', last: 'MATERUM', first: 'JOIE', middle: 'BALANZA', address: 'ZONE 7 TAGUMAY GATTARAN CAGAYAN', contact: '9971051108', dr_no: '141', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACKGREEN', engine: '162FMKS5106933', chassis: 'LX8PCL504SE008154', total: '50,000.00' },
  { date: '11/01/2025', closer: 'RAFFY', source: 'AGENT', category: 'Financing', last: 'TAGANILE', first: 'MARK ANTHONY', middle: 'ANOG', address: 'DUMMUN GATTARAN CAGAYAN', contact: '9692060312', dr_no: '154', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK GREEN', engine: '162FMKS5106919', chassis: 'LX8PCL504SE008140', total: '50,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Gattaran sales for branch:', branch.name, 'id=', branch.id);

  const created = [];
  const skipped = [];
  for (const r of rows) {
    try {
      const dateSold = parseDate(r.date);

      // Idempotency: allow duplicate DR; skip only if engine/chassis unit already sold
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

      const item = await utils.findSkygoItemForModel(prisma, normalizeModel(r.model));
      if (!item) { console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no); continue; }
      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, r.engine, r.chassis);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) { console.warn('SKIP: No available unit (and could not auto-add) for', r.engine || r.chassis, 'model', item.model, 'dr_no', r.dr_no); continue; }
      }

      const totalAmount = parseAmount(r.total);
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
            agent: r.closer || null,
            fmo: SEED_TAG
          }
        });

        await tx.vehicle_units.update({ where: { id: vehicle.id }, data: { status: 'sold' } });
        await tx.inventory_movements.update({ where: { id: vehicle.inventory_id }, data: { sold_qty: { increment: 1 }, ending_qty: { decrement: 1 } } });
        await tx.sales_items.create({ data: { sale_id: sale.id, item_id: item.id, qty: 1, unit_price: totalAmount, amount: totalAmount, vehicle_unit_id: vehicle.id } });
        await tx.sales_inventory.create({ data: { sale_id: sale.id, inventory_id: vehicle.inventory_id, qty: 1 } });

        return sale;
      });

      created.push(result.id);
      console.log('Created sale id', result.id, 'dr_no', r.dr_no || null);
    } catch (err) {
      console.error('Failed to insert sale for dr_no', r.dr_no, err.message || err);
    }
  }

  console.log('\nGattaran seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
