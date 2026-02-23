const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_tumauini_sales_2025_08_30';

function parseDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
  let m = s.match(/^([0-1]?\d)[/-]([0-3]?\d)[/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  m = s.match(/^([0-1]?\d)[/-]([0-3]?\d)[/-](\d{2})$/);
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
  if (/^p1\s*bolt\s*150$/i.test(m)) terms.add('BOLT 150');
  if (/^m1\s*lance\s*150$/i.test(m)) terms.add('LANCE 150');
  return Array.from(terms);
}

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Tumauini', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Tumauini" not found in branches table.');
  return b;
}

// Dataset: Aug–Oct 2025
const rows = [
  // AUGUST
  { date: '08/30/2025', closer: 'FREDDIE TAGUBA', source: 'AGENT', category: 'Financing', last: 'TANDAYU', first: 'ROSAMINDA', middle: 'SAN PEDRO', address: 'P2 FUGU ABAJO, TUMAUINI, ISABELA', contact: '', dr_no: '0022', brand: 'SKYGO', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158478', chassis: 'LX8TDK50XNE012651', total: '50,000.00' },

  // SEPTEMBER
  { date: '09/05/2025', closer: 'FREDDIE TAGUBA', source: 'WALK-IN', category: 'Financing', last: 'ANAMA', first: 'TOTOY', middle: 'LIGROS', address: 'P7 UNION CABAGAN ISABELA', contact: '', dr_no: '11491', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2R5123842', chassis: 'LX8PCJ502RE011116', total: '46,000.00' },
  { date: '09/18/2025', closer: 'FREDDIE TAGUBA', source: 'AGENT', category: 'Financing', last: 'ASUERO', first: 'ROCELO', middle: 'MAGGAY', address: 'STA. CATALINA, TUMAUINI, ISABELA', contact: '', dr_no: '11586', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121603', chassis: 'LX8TDK8GXSB001001', total: '115,000.00' },
  { date: '09/29/2025', closer: 'FREDDIE TAGUBA', source: 'SOCIAL MEDIA', category: 'Financing', last: 'LUGO', first: 'ARNEL', middle: 'ESPIRITU', address: 'P2, LINGALING, TUMAUINI, ISABELA', contact: '', dr_no: '11491', brand: 'SKYGO', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106359', chassis: 'LX8PCJ500SE003859', total: '46,000.00' },

  // OCTOBER
  { date: '10/06/2025', closer: 'FREDDIE TAGUBA', source: 'AGENT', category: 'Financing', last: 'GAMMAD', first: 'ARMANDO', middle: 'COLOMA', address: 'CAPELLAN, CITY OF ILAGAN, ISABELA', contact: '', dr_no: '11346', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158749', chassis: 'LX8PCL500NE012934', total: '50,000.00' },
  { date: '10/13/2025', closer: 'FREDDIE TAGUBA', source: 'AGENT', category: 'Financing', last: 'TARAYAO', first: 'JOSE', middle: 'MANALO', address: 'SAN MATEO, TUMAUINI, ISABELA', contact: '', dr_no: '11559', brand: 'SKYGO', model: 'MONARCH 125', color: 'RED', engine: '156FMI2S5106243', chassis: 'LX8PCJ503SE003743', total: '46,000.00' },
  { date: '10/20/2025', closer: 'JAKE MANAGUELOD', source: 'AGENT', category: 'Financing', last: 'IBARRA', first: 'MARCELINA', middle: 'FERNANDEZ', address: 'FERMELDY, TUMAUINI, ISABELA', contact: '', dr_no: '11559', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106732', chassis: 'LX8PCL507SE007953', total: '50,000.00' },
  { date: '10/21/2025', closer: 'EDWIN SALVADOR', source: 'WALK-IN', category: 'Financing', last: 'BARUT', first: 'CHARITO', middle: 'AGCAOLLI', address: 'SAN ANTONIO, DELFIN ALBANO, ISABELA', contact: '', dr_no: '11370', brand: 'SKYGO', model: 'OMNI 125', color: 'NIGHT GRAY', engine: '1P52QMIRTC01458', chassis: 'LWMTJV1C5RT001458', total: '72,000.00' },
  { date: '10/22/2025', closer: 'JAKE MANAGUELOD', source: 'AGENT', category: 'Financing', last: 'PELO', first: 'ROMEO', middle: 'MALAZZAB', address: 'P5, FERMELDY, TUMAUINI, ISABELA', contact: '', dr_no: '11559', brand: 'SKYGO', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106714', chassis: 'LX8PCL505SE007935', total: '50,000.00' },
  { date: '10/30/2025', closer: 'JAKE MANAGUELOD', source: 'AGENT', category: 'Financing', last: 'DOMINGO', first: 'GLYSSA MAE', middle: 'IGLESIA', address: 'P2, ANEG, DELFIN ALBANO, ISABELA', contact: '', dr_no: '012970', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJR1343579', chassis: 'LX8TDK8U5RB001486', total: '97,000.00' },

  // NOVEMBER
  { date: '11/12/2025', closer: 'JAKE MANAGUELOD', source: 'AGENT', category: 'Financing', last: 'ANAPI', first: 'TEODORO', middle: 'ANNAPI', address: 'P4, FUGU NORTE, TUMAUINI, ISABELA', contact: '', dr_no: '', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1227302', chassis: 'LX8TDK8G5SB001558', total: '115,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Tumauini sales for branch:', branch.name, 'id=', branch.id);

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

  console.log('\nTumauini seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
