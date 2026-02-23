const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_aurora_sales_2025_10_01';

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
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Aurora', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Aurora" not found in branches table.');
  return b;
}

// Dataset: October 2025 (Aurora)
const rows = [
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'DOLOR',     first: 'ARIES',        middle: 'ANGALA',    address: 'LIBIS STREET SANTA ROSA  AURORA ISABELA', contact: '9538640931', dr_no: '45',   brand: 'SKYGO',   model: 'M1 LANCE 150', color: 'WHITE',        engine: '1P57MJR1297973', chassis: 'LX8TDK8U1RB001100', total: '97,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'UBAY',      first: 'EDIE',         middle: 'GONZALES', address: 'PUROK 7 SANTA ROSA AURORA ISABELA',        contact: '9772391294', dr_no: '46',   brand: 'MONARCH', model: 'OMNI 125',     color: 'SILVER/GRAY',  engine: '1P52QMISTC00293', chassis: 'LWMTJV1C3ST000296', total: '72,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'LADDIT',    first: 'FERDINAND',    middle: 'MIRANDA',  address: 'BANNA STREET SAN JOSE AURORA ISABELA',   contact: '9532839499', dr_no: '47',   brand: 'MONARCH', model: 'OMNI 125',     color: 'SILVER/GRAY',  engine: '1P52QMISTC00257', chassis: 'LWMTJV1C4ST000257', total: '72,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'LIGAD',     first: 'JOHNMERRICK',  middle: 'SARMIENTO',address: 'PUROK 2 SANTA RITA AURORA ISABELA',      contact: '9958836176', dr_no: '48',   brand: 'SKYGO',   model: 'M1 LANCE 150', color: 'WHITE',        engine: '1P57MJS1067190', chassis: 'LX8TD8U3SB000147',   total: '97,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'APELLIDO',  first: 'DIONICIO JR.', middle: 'GALINDO',  address: 'PUROK 1 KALABAZA AURORA ISABELA',        contact: '9756148162', dr_no: '49',   brand: 'MONARCH', model: 'MONARCH 175',  color: 'BLUE',         engine: '162FMKN5158583', chassis: 'LX8PCL504NE012760', total: '50,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'WALK-IN',category: 'Financing', last: 'MARCOS',    first: 'FROILAN',      middle: 'ENRIQUEZ', address: 'PUROK 4 KALABAZA AURORA ISABELA',        contact: '9526212747', dr_no: '50',   brand: 'MONARCH', model: 'OMNI 125',     color: 'SILVER/GRAY',  engine: '1P52QMISTC00246', chassis: 'LWMTJV1CX9T000246', total: '72,000.00' },
  { date: '10/01/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'BASLIO',    first: 'ELJON',        middle: 'SANTIAGO', address: 'PUROK 7 MALALINTA SAN MANUEL ISABELA',   contact: '9368395798', dr_no: '56',   brand: 'SKYGO',   model: 'P1 BOLT 150', color: 'SILVER/BLACK',  engine: '1P57MJS1227234', chassis: 'LX8TDK8G6SB001481', total: '115,000.00' },
  { date: '10/13/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'FRANCO',    first: 'ANTONIO JR.',  middle: 'MARTIN',   address: 'ZONE 3 BALLESTEROS AURORA ISABELA',     contact: '9068296746', dr_no: '77',   brand: 'SKYGO',   model: 'P1 BOLT 150', color: 'BLACK/SILVER',  engine: '1P57MJS1121643', chassis: 'LX8TDK8G8SB001031', total: '115,000.00' },
  { date: '10/14/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT',  category: 'Financing', last: 'ANCHETA',   first: 'MARIO',        middle: 'VALDEZ',    address: 'PUROK 5 SARANAY CABATUAN ISABELA',      contact: '9658204774', dr_no: '91',   brand: 'MONARCH', model: 'MONARCH 175',  color: 'RED',          engine: '162FMKN5158762', chassis: 'LX8PCL505NE012945', total: '50,000.00' },
  { date: '10/16/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT',  category: 'Financing', last: 'BAGARA',    first: 'SERIO',        middle: 'DOLAY',     address: 'PUROK 5 LUYAO LUNA ISABELA',            contact: '9755637261', dr_no: '93',   brand: 'MONARCH', model: 'OMNI 125',     color: 'WHITE',        engine: '1P52QMISTC00221', chassis: 'LWMTJV1C5ST000221', total: '72,000.00' },
  { date: '10/17/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'CASTILLO',  first: 'RANIEL',       middle: 'PARTIBLE',  address: '154 PUROK 1 BANGUI ST. SAN JUAN AURORA ISABELA', contact: '9750769768', dr_no: '96',   brand: 'MONARCH', model: 'MONARCH 175',  color: 'BLUE',         engine: '162FMKN5158601', chassis: 'LX8PCL503NE012779', total: '50,000.00' },
  { date: '10/18/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'BAUTISTA',  first: 'ARR JAY',      middle: 'PAGUIRIGAN',address: 'PUROK 3 BAGNOS AURORA ISABELA',         contact: '9613887957', dr_no: '432',  brand: 'SKYGO',   model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227322', chassis: 'LX8TDK8G1SB001565', total: '115,000.00' },
  { date: '10/18/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT',  category: 'Financing', last: 'BERGONIA',  first: 'WILSON JR.',   middle: 'BALDERAMOS', address: 'ZONE 7 PARANUM LAL-LO CAGAYAN',      contact: '9973076557', dr_no: '11649',brand: 'SKYGO',   model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227315', chassis: 'LX8TDK8G6SB001562', total: '115,000.00' },
  { date: '10/20/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT',  category: 'Financing', last: 'MANGADAP',  first: 'NANCY',        middle: 'BALIGOD',   address: 'PUROK 4 DEL PILAR CABATUAN ISABELA',   contact: '9752241547', dr_no: '450',  brand: 'MONARCH', model: 'OMNI 125',     color: 'SILVER/GRAY',  engine: '1P52QMIRTC01479', chassis: 'LWMTJV1C2RT001479', total: '72,000.00' },
  { date: '10/23/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'MIRANDA',   first: 'HEHERSON',     middle: 'SERRANO',   address: 'SAN FRANCISCO CAUAYAN CITY ISABELA',   contact: '9362918570', dr_no: '103',  brand: 'MONARCH', model: 'MONARCH 125',  color: 'RED',          engine: '156FMI-2S5106275', chassis: 'LX8PCJ505SE003775', total: '46,000.00' },
  { date: '10/24/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'ILARDE',    first: 'JONATHAN',     middle: 'NACIONALES',address: 'SAN RAFAEL AURORA ISABELA',             contact: '9213196622', dr_no: '104',  brand: 'SKYGO',   model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121620', chassis: 'LX8TDK8G1SB001050', total: '115,000.00' },
  { date: '10/27/2025', closer: 'MARK ANTHONY APOSTOL', source: 'AGENT', category: 'Financing', last: 'BERNARDINO', first: 'GLAIZA', middle: 'CORPUZ', address: 'PUROK 2 BANNAGAO AURORA ISABELA', contact: '9206034812', dr_no: '118', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106327', chassis: 'LX8PCJ509SE003827', total: '46,000.00' },
  { date: '10/28/2025', closer: 'LARA JOY JUNIO', source: 'AGENT',  category: 'Financing', last: 'ATIENZA',   first: 'LESTER',       middle: 'VISAYA',    address: 'PUROK 4 KALABAZA AURORA ISABELA',        contact: '9751120256', dr_no: '12969',brand: 'SKYGO',   model: 'M1 LANCE 150', color: 'WHITE/GOLD',   engine: '1P57MJR1297897', chassis: 'LX8TDK8U3RB001017', total: '97,000.00' },
  { date: '10/30/2025', closer: 'MARK ANTHONY APOSTOL', source: 'AGENT', category: 'Financing', last: 'MARTINEZ',  first: 'DARVIN',       middle: 'RODRIGUEZ', address: 'PAG-ASA ST. SAN PEDRO-SAN PABLO AURORA ISABELA', contact: '9531409967', dr_no: '127',  brand: 'MONARCH', model: 'MONARCH 175',  color: 'BLUE',         engine: '162FMKN5158608', chassis: 'LX8PCL50XNE012780', total: '50,000.00' },
  { date: '10/31/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT', category: 'Financing', last: 'DELA PAZ', first: 'FERNANDO JR.', middle: 'LABASTIDA', address: 'DISTRICT 1 CAUAYAN ISABELA', contact: '9977253617', dr_no: '88', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLUE', engine: '162FMKS5106974', chassis: 'LX8PCL507SE008195', total: '50,000.00' },
  
  // NOVEMBER
  { date: '11/06/2025', closer: 'LARA JOY M. JUNIO', source: 'AGENT', category: 'Financing', last: 'HIPOLITO', first: 'NENITA', middle: 'CABATIN', address: 'PUROK 1 SAN JUAN AURORA ISABELA', contact: '9539988298', dr_no: '143', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLUE', engine: '162FMKS5106990', chassis: 'LX8PCL501SE008211', total: '50,000.00' },
  { date: '11/07/2025', closer: 'MARK ANTHONY APOSTOL', source: 'AGENT', category: 'Financing', last: 'GANELA', first: 'PRIJAY', middle: 'DELA ROSA', address: 'SAN PEDRO SAN PABLO AURORA ISABELA', contact: '9268048015', dr_no: '146', brand: 'MONARCH', model: 'MONARCH 150', color: 'BLACK/GREEN', engine: '161FMJS5105986', chassis: 'LX8PCK504SE011856', total: '48,000.00' },
  { date: '11/08/2025', closer: 'ARVIN JAMES CUBANGBANG', source: 'AGENT', category: 'Financing', last: 'BOADO', first: 'CRISIEL', middle: 'CARABALLE', address: 'PUROK 4 KALABAZA AURORA ISABELA', contact: '9670370871', dr_no: '149', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1227011', chassis: 'LX8TDK8G2SB001428', total: '115,000.00' },
  { date: '11/08/2025', closer: 'LARA JOY JUNIO', source: 'AGENT', category: 'Financing', last: 'GALLO', first: 'JAYSON', middle: 'SORIANO', address: 'PUROK 1 BALLESTEROS AURORA ISABELA', contact: '9530846313', dr_no: '151', brand: 'MONARCH', model: 'OMNI 125', color: 'DARK BLUE', engine: '1P52QMISTC00499', chassis: 'LWMTJV1C6ST000499', total: '72,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Aurora sales for branch:', branch.name, 'id=', branch.id);

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

      const totalAmount = parseAmount(r.total);
      const category = r.category || 'Financing';

      // Enforce: unit must be present and available in inventory; else auto-add into inventory for this branch
      if (!item) { console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no); continue; }
      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, r.engine, r.chassis);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) { console.warn('SKIP: No available unit (and could not auto-add) for', r.engine || r.chassis, 'model', item && item.model, 'dr_no', r.dr_no); continue; }
      }

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

  console.log('\nAurora seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
