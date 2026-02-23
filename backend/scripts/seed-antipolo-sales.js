const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_antipolo_sales_2025_10_11';

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
  if (typeof val === 'number') return val;
  const s = String(val);
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  if (Number.isNaN(n)) return 0;
  // If input was already a plain string number, return as-is
  // Otherwise divide by 100 (for comma-formatted strings like "115,000.00")
  return s.includes(',') || s.includes('.') ? Math.round(n / 100) : n;
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
  if (/^kpv\s*150(\s*keyless)?$/i.test(m)) { terms.add('KPV 150 KEYLESS'); terms.add('KPV 150'); }
  if (/^m1\s*arrow\s*150$/i.test(m)) terms.add('ARROW 150');
  if (/^(m1\s*)?spear\s*180(\s*fi)?$/i.test(m)) terms.add('SPEAR 180');
  if (/^m1\s*lance\s*150$/i.test(m)) terms.add('LANCE 150');
  return Array.from(terms);
}

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Antipolo', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Antipolo" not found in branches table.');
  return b;
}

// Dataset: October 2025 (Antipolo)
const rows = [
  { date: '10/11/2025', closer: 'JOEY',   source: 'AGENT',  category: 'Financing', last: 'KANEKO',    first: 'KOUKI',    middle: 'E', address: 'PUROK DOS STA FRANCESCA ST PENAFRANCIA MAYAMOT ANTIPOLO CITY', contact: '9165620207', dr_no: '351', brand: 'MONARCH', model: 'P1 BOLT 150',       color: 'BLACK/SILVER', engine: '1P57MJS1230049', chassis: 'LX8TDK8G1SB001677', total: 115000 },
  { date: '10/20/2025', closer: 'JOEY',   source: 'AGENT',  category: 'Financing', last: 'BARTOLOME', first: 'RICHARD JR', middle: 'DC', address: 'BLK 57 PIPINO ST TUMANA MARIKINA CITY',                                contact: '9165826923', dr_no: '352', brand: 'MONARCH', model: 'P1 BOLT 150',       color: 'BLACK/SILVER', engine: '1P57MJS1230050', chassis: 'LX8TDK8G3SB001678', total: 115000 },
  { date: '10/30/2025', closer: 'GERUEL', source: 'WALK-IN',category: 'Financing', last: 'COLLERA JR', first: 'CARLOS',    middle: 'D',  address: 'LOT 24 BLK 8 LUZVILLE ST PHASEI DELA PAZ ANTIPOLO CITY',                  contact: '9531831321', dr_no: '353', brand: 'SKYGO',   model: 'KPV 150 KEYLESS', color: 'GRAY',         engine: '1P57MJP1133435', chassis: 'LX8TDK80XPA001063', total: 118000 },
  { date: '10/30/2025', closer: 'JOEY',   source: 'AGENT',  category: 'Financing', last: 'ESPINOSA',   first: 'JAPHET',    middle: 'N',  address: 'BLK 78 LOT 7 PHASE 1 SOUTHVILLE 9 PINUGAY BARAS RIZAL',                 contact: '9912793166', dr_no: '354', brand: 'MONARCH', model: 'M1 ARROW 150',      color: 'GRAY',         engine: 'JN1P57QMJ24045995', chassis: 'LRPRTJ509RA000298', total: 79000 },
  { date: '10/31/2025', closer: 'JOEY',   source: 'AGENT',  category: 'Financing', last: 'SEJERA',     first: 'JOEL',      middle: 'MALIJON', address: 'SITIO PINAGMISAHAN SAN LUIS ANTIPOLO CITY',                       contact: '9674617478', dr_no: '355', brand: 'MONARCH', model: 'M1 SPEAR 180 FI',    color: 'BLACK',        engine: 'RW162FMK24000310', chassis: 'LRPRPK800RA000342', total: 110000 }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Antipolo sales for branch:', branch.name, 'id=', branch.id);

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

  console.log('\nAntipolo seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
