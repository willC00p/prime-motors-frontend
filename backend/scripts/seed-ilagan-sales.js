const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_ilagan_sales_2025_10_20';

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

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Ilagan', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Ilagan" not found in branches table.');
  return b;
}

// Dataset: October 2025 (Ilagan)
const rows = [
  { date: '10/20/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'DABO', first: 'RODA', middle: '', address: 'Camunatan, City of Ilagan, Isabela', contact: '', dr_no: '11559', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106374', chassis: 'LX8PCJ507SE003874', total: '46,000.00' },
  { date: '10/23/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'Cabauatan', first: 'Darnell Rad', middle: 'Abad', address: 'Alibagu, City of Ilagan, Isabela', contact: '', dr_no: '11640', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1227329', chassis: 'LX8TDK8G0SB001573', total: '115,000.00' },
  { date: '10/27/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'Maramag', first: 'Mary Jane', middle: 'Camunayan', address: 'Blk 22, City Home, City of Ilagan, Isabela', contact: '', dr_no: '12970', brand: 'MONARCH', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJS1067228', chassis: 'LX8TDK8U8SB000192', total: '97,000.00' },
  { date: '10/31/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'ADAN', first: 'MICHEAL', middle: 'Verzo', address: 'P2 SAN ANTONIO CITY OF ILAGAN', contact: '', dr_no: '11640', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1227340', chassis: 'LX8TDK8G1SB001582', total: '115,000.00' },
  // November 2025 entries
  { date: '11/03/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'PATALINGHUG', first: 'EDISHA MAY', middle: 'ARZADON', address: 'P3, CABANNUNGAN 2ND, ILAGAN CITY, ISABELA', contact: '', dr_no: '', brand: 'SKYGO', model: 'OMNI 125', color: 'Silver Gray', engine: '1P52QMISTC00254', chassis: 'LWMTJV1C9ST000254', total: '72,000.00' },
  { date: '11/06/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'DELA TORRE', first: 'SAMUEL', middle: 'CURUBANGA', address: 'P4, FUGU, CITY OF ILAGAN, ISABELA', contact: '', dr_no: '', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106702', chassis: 'LX8PCL509SE007923', total: '50,000.00' },
  { date: '11/07/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'ALINGOD', first: 'RAFFY', middle: 'CONCEPCION', address: 'P1, NAGUILIAN SUR, ILAGAN CITY, ISABELA', contact: '', dr_no: '', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106848', chassis: 'LX8PCL502SE008069', total: '50,000.00' },
  { date: '11/12/2025', closer: '', source: 'AGENT', category: 'Financing', last: 'Hairulla', first: 'Nena', middle: 'Abrinella', address: 'P6, Cabeseria 17/21, City of Ilagan, Isabela', contact: '', dr_no: '', brand: 'MONARCH', model: 'M1 LANCE 150', color: 'WHITE', engine: '1P57MJS1067127', chassis: 'LX8TDK8U7SB000071', total: '97,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Ilagan sales for branch:', branch.name, 'id=', branch.id);

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

  console.log('\nIlagan seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
