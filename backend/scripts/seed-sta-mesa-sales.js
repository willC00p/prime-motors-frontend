const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_sta_mesa_sales_2025_06_28';

// Parse dates like 6/28/2025, 09/03/25, 10-06-25, 2025-07-08
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

// Robust currency parser: keep digits only; assume 2 decimal places if present
function parseAmount(val) {
  if (val == null) return 0;
  const s = String(val);
  const digits = s.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  // Most inputs look like 115,000.00 -> 11500000; divide by 100
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
  // Prefer explicit id=17 as provided; fallback to name search
  const byId = await prisma.branches.findUnique({ where: { id: 17 } }).catch(() => null);
  if (byId) return byId;
  const byName = await prisma.branches.findFirst({ where: { name: { contains: 'Sta. Mesa', mode: 'insensitive' } } });
  if (!byName) throw new Error('Sta. Mesa branch not found (id=17 or name contains "Sta. Mesa").');
  return byName;
}

// Dataset from user (June–October 2025)
const rows = [
  // JUNE
  { date: '6/28/2025', closer: 'Johnnie', source: 'WALK-IN', category: 'Financing', last: 'PERITO', first: 'LEO JAY', middle: 'BAUSIN', address: 'LOT 15 KABISIG ST. BRGY SAN ANDRES, CAINTA RIZAL', contact: '9950872113', dr_no: '0000001', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN GRAY', engine: '1P57MJR1341174', chassis: 'LX8TDK8G0RB002264', total: '115,000.00' },

  // JULY
  { date: '7/8/2025', closer: 'Jc', source: 'AGENT', category: 'Cash', last: 'BERGANTINOS', first: 'RENE', middle: 'JIHON', address: 'B72 L20 17TH ST. BRGY. VILLAMOR AIR BASE, PASAY CITY', contact: '9352988512', dr_no: '0000051', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK GRAY', engine: '1P57MJS1121587', chassis: 'LX8TDK8G7SB000999', total: '115,000.00' },
  { date: '7/15/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'GRABATO JR', first: 'RODOLFO', middle: 'MABULAY', address: '70 SAN JOSE ST. BRGY. BATIS, SAN JUAN CITY', contact: '9561500465', dr_no: '0000052', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK GRAY', engine: '1P57MJS1121595', chassis: 'LX8TDK8G7SB000996', total: '115,000.00' },
  { date: '7/18/2025', closer: 'Johnnie', source: 'WALK-IN', category: 'Financing', last: 'SAN JOSE', first: 'RUDOLPH', middle: 'NUÑEZ', address: '73 ALLEY D. BRGY. 310 STA CRUZ, MANILA CITY', contact: '9605276250', dr_no: '0000053', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJR1343560', chassis: 'LX8TDK8U6RB001450', total: '97,000.00' },
  { date: '7/23/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'GALLARDO', first: 'EDEN ROSE', middle: 'ROBIATO', address: '156 MULAWIN ST. BRGY. 599 STA MESA, MANILA CITY', contact: '9491468444', dr_no: '0000054', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK GRAY', engine: '1P57MJS1121602', chassis: 'LX8TDK8G5SB000998', total: '115,000.00' },
  { date: '7/24/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'GOZE JR', first: 'BENEDICTO', middle: 'PAULMA', address: '4856 ROSAL ST. INT. 15 BRGY. 598 STA MESA, MANILA CITY', contact: '9166981947', dr_no: '0000055', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK', engine: '1P57MJR1343559', chassis: 'LX8TDK8UXRB001449', total: '97,000.00' },

  // AUGUST
  { date: '8/12/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'MONATO', first: 'JUNEL', middle: 'SOBREVILLA', address: '171 P.PEREY ST. BRGY. ISABELITA, SAN JUAN CITY', contact: '9544883225', dr_no: '0000057', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE GOLD', engine: '1P57MJR1343555', chassis: 'LX8TDK8U1RB001467', total: '97,000.00' },
  // Cross-branch collision note: engine/chassis 1P52QMIRTC01233 / LWMTJV1C3RT001233 already sold elsewhere.
  // To record Sta. Mesa sale per sheet while avoiding collision, clear identifiers and let seeder create a unit.
  { date: '8/14/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'EBOL', first: 'JOE MAYWYN', middle: 'MAGAT', address: '139 J.RUIZ ST. BRGY. BALONG BATO, SAN JUAN CITY', contact: '9938124639', dr_no: '0000058', brand: 'MONARCH', model: 'OMNI 125', color: 'BLUE', engine: null, chassis: null, total: '72,000.00' },
  { date: '8/19/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'CASTRO', first: 'ERWIN', middle: 'NG', address: '4844 BLK 4 NARRA ST. BRGY. 599 STA MESA, MANILA CITY', contact: '9455802558', dr_no: '0000059', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJR1342607', chassis: 'LX8TDK8GXRB002692', total: '115,000.00' },
  { date: '8/23/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'MALIPOT', first: 'MARK VINCENT', middle: 'PILONIO', address: '4929 PIÑA ST. BRGY. 599 STA MESA, MANILA CITY', contact: '9456632892', dr_no: '0000060', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK SILVER', engine: '1P57MJS1121568', chassis: 'LX8TDK8G2SB000988', total: '115,000.00' },
  { date: '8/29/2025', closer: 'Jc', source: 'AGENT', category: 'Financing', last: 'ROQUE', first: 'RAYMART', middle: 'PEREZ', address: 'A-506 JCSV BRGY. 898 PUNTA STA ANA, MANILA CITY', contact: '9052324469', dr_no: '0000061', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK GOLD', engine: '1P57MJ1067188', chassis: 'LX8TDK8U3SB000181', total: '97,000.00' },

  // SEPTEMBER
  { date: '9/3/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'RONQUILLO', first: 'MARK', middle: 'DYSANGCO', address: '1640 INT 23 ZAMORA ST. BRGY. 821 PACO, MANILA CITY', contact: '9935611627', dr_no: '0000062', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK GOLD', engine: '1P57MJS1067199', chassis: 'LX8TDK8U9SB000184', total: '97,000.00' },
  { date: '9/15/2025', closer: 'Joey', source: 'WALK-IN', category: 'Financing', last: 'PATILANO', first: 'RUBEN JAMES', middle: 'CADERAO', address: 'BLK-5 KAINGIN 1 BRGY. PANSOL, QUEZON CITY', contact: '9672689907', dr_no: '0101', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1120584', chassis: 'LX8TDK8GXSB000883', total: '115,000.00' },
  { date: '9/18/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'DAVID', first: 'PEDRO JR', middle: 'BALBOA', address: '4808 DAMKA ST. BRGY. 598 STA MESA, MANILA CITY', contact: '9665834892', dr_no: '0102', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE GOLD', engine: '1P57MJS1067179', chassis: 'LX8TDK8U7SB000135', total: '97,000.00' },
  { date: '9/19/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'ENRIQUEZ', first: 'ROBERT', middle: 'ROXAS', address: '10-B G.ARANETA AVE. BRGY. DOÑA IMELDA, QUEZON CITY', contact: '9215285783', dr_no: '0103', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK GOLD', engine: '1P57MJS1067189', chassis: 'LX8TDK8U5SB000182', total: '97,000.00' },
  { date: '9/30/2025', closer: 'Joey', source: 'WALK-IN', category: 'Financing', last: 'TAMBONG', first: 'ERWIN', middle: 'TUMBAGAHAN', address: 'BLDG.4 RM.402 ST.JOSEPHVILLE, SAN JUAN CITY', contact: '9291355589', dr_no: '0104', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1120599', chassis: 'LX8TDK8G3SB000868', total: '115,000.00' },

  // OCTOBER
  { date: '10/6/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'BALADAD', first: 'ROYCE HERO', middle: 'MAYOR', address: '956 PALAWAN ST. BRGY. 574 SAMPALOC, MANILA CITY', contact: '9567127707', dr_no: '0105', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK GOLD', engine: '1P57MJS1121634', chassis: 'LX8TDK8G0SB001024', total: '115,000.00' },
  { date: '10/09/2025', closer: 'Jc', source: 'AGENT', category: 'Financing', last: 'ANGOLUAN', first: 'LEAH', middle: 'SAGER', address: '6780 SAN VICENTE ST. BRGY. 598 STA MESA, MANILA CITY', contact: '9612255433', dr_no: '0106', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE GOLD', engine: '1P57MJS1067217', chassis: 'LX8TDK8UXSB000159', total: '97,000.00' },
  { date: '10/11/2025', closer: 'Jc', source: 'AGENT', category: 'Financing', last: 'OBAL JR.', first: 'DANILO', middle: 'TINGSON', address: '2351 TOPACIO ST. BRGY. 765, MANILA CITY', contact: '9513680385', dr_no: '0107', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN SILVER', engine: '1P57MJS1227272', chassis: 'LX8TDK8G5SB001522', total: '115,000.00' },
  { date: '10/18/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'OÑASA', first: 'VICTOR', middle: 'BITU-ONON', address: '499 CAMIA ST. BRGY. 598 STA MESA, MANILA CITY', contact: '9480631782', dr_no: '0108', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK SILVER', engine: '1P57MJS1230037', chassis: 'LX8TDK8G6SB001691', total: '115,000.00' },
  { date: '10/27/2025', closer: 'Maynard', source: 'WALK-IN', category: 'Financing', last: 'SAN JOSE', first: 'EXEQUIEL', middle: 'KATIPUNAN', address: '10 CATOC ST. BRGY. ROSARIO, PASIG CITY', contact: '9084769855', dr_no: '0109', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE GOLD', engine: '1P57MJR1297929', chassis: 'LX8TDK8U0RB001086', total: '97,000.00' },
  { date: '10/27/2025', closer: 'Jc', source: 'WALK-IN', category: 'Financing', last: 'FERRER', first: 'RAYMUND', middle: 'FERRER', address: '0518 SAMPAGUITA ST. BRGY. 598 STA MESA, MANILA CITY', contact: '9062789788', dr_no: '0110', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK SILVER', engine: '1P57MJS1230030', chassis: 'LX8TDK8G6SB001660', total: '115,000.00' },

  // NOVEMBER
  { date: '11/06/2025', closer: 'Jc', source: 'AGENT', category: 'Financing', last: 'ELBESA', first: 'YASHI POULINNE', middle: 'CAMARA', address: '3159 NEW PANADEROS ST. BRGY. 895 STA ANA, MANILA CITY', contact: '9065667549', dr_no: '0111', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK SILVER', engine: '1P57MJS1230007', chassis: 'LX8TDK8G0SB001699', total: '115,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Sta. Mesa sales for branch:', branch.name, 'id=', branch.id);

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

      // SKYGO-based item lookup and gating
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

  console.log('\nSta. Mesa seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
