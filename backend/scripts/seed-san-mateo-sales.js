const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo/tracking
const SEED_TAG = 'seed_san_mateo_sales_2025_10_12_27';

// Parse dates in multiple formats: MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, YYYY-MM-DD, and 2-digit year variants
function parseDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);

  // Try M/D/YYYY or M-D-YYYY
  let m = s.match(/^([0-3]?\d)[\/\-]([0-3]?\d)[\/\-](\d{4})$/);
  if (m) {
    let a = Number(m[1]);
    let b = Number(m[2]);
    // If first part > 12, treat as DD/MM
    const month = a > 12 ? b : a;
    const day = a > 12 ? a : b;
    return new Date(Number(m[3]), month - 1, day);
  }
  // Try M/D/YY or D/M/YY (assume <50 -> 2000s)
  m = s.match(/^([0-3]?\d)[\/\-]([0-3]?\d)[\/\-](\d{2})$/);
  if (m) {
    let a = Number(m[1]);
    let b = Number(m[2]);
    const yy = Number(m[3]);
    const year = yy < 50 ? 2000 + yy : 1900 + yy;
    const month = a > 12 ? b : a;
    const day = a > 12 ? a : b;
    return new Date(year, month - 1, day);
  }

  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? new Date() : d2;
}

// Robust currency parser: keep digits only; assume 2 decimal places
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

async function findBranch() {
  // Prefer name contains 'San Mateo'
  const byName = await prisma.branches.findFirst({ where: { name: { contains: 'San Mateo', mode: 'insensitive' } } });
  if (!byName) throw new Error('San Mateo branch not found (name contains "San Mateo"). Run seed_branches if needed.');
  return byName;
}

// Dataset: October 2025 - San Mateo (5 rows)
// Note: Input brand listed as MONARCH; we normalize to SKYGO canonical item by model using seed-utils.
const rows = [
  { date: '10/12/2025', closer: '', source: 'WALK-IN', category: 'In house', last: 'Angeles', first: 'Edgardo', middle: '', address: '16 manahan, malanday, san mateo, rizal', contact: '9628285214', dr_no: '76', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'Black', engine: '1P57MJS1227282', chassis: 'LX8TDK8G6SB001528', total: '115,000.00' },
  { date: '10/20/2025', closer: '', source: 'WALK-IN', category: 'Financing', last: 'Rivas', first: 'Jonathan', middle: '', address: 'Phase 5 Sunnyside Guinayang San mateo Rizal', contact: '9079745422', dr_no: '301', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'Black', engine: '1P57MJS1230053', chassis: 'LX8TDK8G5SB001679', total: '115,000.00' },
  { date: '10/25/2025', closer: '', source: 'WALK-IN', category: 'Financing', last: 'Olivo', first: 'Mary Joy', middle: '', address: 'BLK 34 LOT 5 PHASE 1B KASIGLAHAN VILLAGE SAN JOSE RODRIGUEZ RIZAL', contact: '9603198882', dr_no: '302', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'Black', engine: '1P57MJ1230019', chassis: 'LX8TDK8G3SB001700', total: '115,000.00' },
  { date: '10/27/2025', closer: '', source: 'WALK-IN', category: 'Financing', last: 'Labramonte', first: 'Arnold', middle: '', address: '4A B11 lot 5 Maly San Mateo Rizal', contact: '9351041540', dr_no: '303', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'Black', engine: '1P57MJS1227279', chassis: 'LX8TDK8G2SB001526', total: '115,000.00' },
  // Day-first date was provided as 27/10/2025 in the source; parser handles DD/MM fallback.
  { date: '27/10/2025', closer: 'AGENT', source: 'AGENT', category: 'Financing', last: 'San Jose', first: 'Lyra Amielle', middle: '', address: '5 Manahan Malanday San mateo rIZAL', contact: '9165408891', dr_no: '304', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'Black', engine: '1P57MJS1227206', chassis: 'LX8TDK8G1SB001470', total: '115,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding San Mateo sales for branch:', branch.name, 'id=', branch.id);

  const created = [];
  const skipped = [];
  for (const r of rows) {
    try {
      const dateSold = parseDate(r.date);

      // Idempotency: skip if engine/chassis unit already sold anywhere
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

      // SKYGO-based item lookup and gating via canonical model
      const item = await utils.findSkygoItemForModel(prisma, normalizeModel(r.model));
      if (!item) { console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no); continue; }

      // Find available vehicle unit in-branch for the item and identifiers; else auto-add inventory/unit
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

  console.log('\nSan Mateo seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
