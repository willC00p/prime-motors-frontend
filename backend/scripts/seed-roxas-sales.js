const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_roxas_sales_2025_08_13';

// Parse dates like 08/13/2025, 09/03/25, 10-06-25, 2025-10-01
function parseDate(d) {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  let s = String(d).trim();
  // Correct a likely typo year '2005' -> '2025'
  s = s.replace(/(\b|\D)2005(\b|\D)/, (m) => m.replace('2005', '2025'));
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
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Roxas', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Roxas" not found in branches table.');
  return b;
}

// Dataset from user (Aug–Oct 2025)
const rows = [
  // AUGUST
  { date: '08/13/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'TOLEDO', first: 'ALVIN', middle: 'DELA CRUZ', address: 'RIZAL ST ROXAS ISABELA', contact: '9288492684', dr_no: '0003', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1120625', chassis: 'LX8TDK8G2SB000893', total: '115,000.00' },
  { date: '08/19/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'CARIAGA', first: 'ROGIE', middle: 'GATUZ', address: 'PUROK. 7 ANEG DELFIN ALBANO ISA', contact: '9558304370', dr_no: '0013', brand: 'MONARCH', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJS1067191', chassis: 'LX8TDK8U5SB000148', total: '97,000.00' },
  { date: '08/21/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'FLORES', first: 'HILTER', middle: 'G.', address: 'P. NASUDI SIMIMBAAN ROXAS', contact: '9675476128', dr_no: '0012', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1120537', chassis: 'LX8TDK8G1SB000805', total: '115,000.00' },
  { date: '', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'In house', last: 'BERNARDO', first: 'EDMAR', middle: 'A.', address: 'PUROK BANNAWAG MAGSAYSAY NAGUILAN ISABELA', contact: '9352055355', dr_no: '0007', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1120523', chassis: 'LX8TDK8G9B000900', total: '115,000.00' },
  { date: '', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'In house', last: 'MABBORANG', first: 'JONATHAN', middle: 'P.', address: '123 ST PALLUA SUR TUGUEGARAO CITY CAGAYAN', contact: '9653151659', dr_no: '0011', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1120624', chassis: 'LX8TDK8GX5B00086', total: '115,000.00' },

  // SEPTEMBER
  { date: '09/03/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'FLORES', first: 'HECTOR', middle: 'MANALAY', address: 'P.NASUDI SIMIMBAAN ROXAS ISA', contact: '9533143153', dr_no: '36', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118572', chassis: 'LX8TDK8G5SB000760', total: '115,000.00' },
  { date: '09/06/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'CORPUZ', first: 'RENALYN', middle: 'SEGUBAN', address: 'P.1 MUNOZ WEST ROXAS ISA', contact: '9675525186', dr_no: '42', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLACK', engine: '156M12S5106299', chassis: 'LX8PCJ508SE003799', total: '46,000.00' },
  { date: '09/22/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'BACUD', first: 'JAY PEE', middle: 'CALLE', address: 'P.1 BINARZANG QUIRINO ISA', contact: '9659518031', dr_no: '20', brand: 'MONARCH', model: 'MONARCH 125', color: 'RED', engine: '156FM12R5123778', chassis: 'LX8PCJ502RE011052', total: '46,000.00' },
  { date: '09/16/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'UCOL', first: 'HARISON', middle: 'IRINGAN', address: 'MALIGAYA MALLIG ISA', contact: '9335042829', dr_no: '10', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK', engine: '1P57MJS1121621', chassis: 'LX8TDK8G7SB001019', total: '115,000.00' },
  { date: '09/16/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'RAMISCAL', first: 'JEFFRY', middle: 'SANCHEZ', address: 'P.5 NUESA ROXAS ISA', contact: '9381907382', dr_no: '11', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158775', chassis: 'LX8PCL507NE012946', total: '50,000.00' },
  { date: '09/11/2025', closer: 'Manuel Gabuat', source: 'AGENT', category: 'Financing', last: 'UDAN', first: 'NANCY', middle: 'LOPEZ', address: 'P.4 SAN JOSE NORTE MALLIG ISA', contact: '9533046515', dr_no: '4', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLACK', engine: '156FM12S5106303', chassis: 'LX8PCJ506SE003803', total: '46,000.00' },
  { date: '09/10/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'VILLEZA', first: 'LALAINE', middle: 'RODRIGUEZ', address: 'P.4 SAN PLACIDO ROXAS ISA.', contact: '9544795512', dr_no: '48', brand: 'MONARCH', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJS1067208', chassis: 'LX8TDK8U9SB000153', total: '97,000.00' },
  { date: '09/24/2025', closer: 'Jayson Madrid', source: 'AGENT', category: 'Financing', last: 'NIGOS', first: 'ABELARDO III', middle: 'AZUERO', address: 'P.1 SAN PLACIDO ROXAS ISA', contact: '9675524986', dr_no: '24', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158487', chassis: 'LX8PCL509NE012656', total: '50,000.00' },
  { date: '09/26/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'TANGO', first: 'JOSE', middle: 'BEMBO', address: 'P.2A BARUCBOC QUEZON ISA.', contact: '9758751504', dr_no: '36', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158481', chassis: 'LX8PCL502NE012658', total: '50,000.00' },
  { date: '09/29/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'SABADO', first: 'JANICA', middle: 'MARTIN', address: 'P.6 IMBIAO ROXAS ISABELA', contact: '9559067319', dr_no: '38', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKN5158787', chassis: 'LX8PCL509NE012964', total: '50,000.00' },

  // OCTOBER
  { date: '10/01/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'LOZANO', first: 'EDNARD', middle: 'DELOS SANTOS', address: 'P.2 QUILING ROXAS ISABELA', contact: '9925588838', dr_no: '54', brand: 'MONARCH', model: 'OMNI 125', color: 'GRAY', engine: '1P521MIRTC01476', chassis: 'LWMTJV1C7RT001476', total: '72,000.00' },
  { date: '10/01/2025', closer: 'Jason Madrid', source: 'AGENT', category: 'Financing', last: 'RAMOS', first: 'ROWELL', middle: 'PIGAO', address: 'P.1 SAN PLACIDO ROXAS ISABELA', contact: '9531420366', dr_no: '55', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158488', chassis: 'LX8PCL50XNE012665', total: '50,000.00' },
  { date: '10/02/2025', closer: 'Jason Madrid', source: 'AGENT', category: 'Financing', last: 'JALLORINA', first: 'EDWIN', middle: 'PASSION', address: 'P.4 SOTERO NUESA ROXAS ISABELA', contact: '9911837466', dr_no: '60', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158486', chassis: 'LX8PCL508NE012664', total: '50,000.00' },
  { date: '10/04/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'EUGENIO', first: 'JOMAR', middle: 'GARNADOZO', address: 'P.4 MARCOS ROXAS ISABELA', contact: '9053309365', dr_no: '61', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121648', chassis: 'LX8TDKG6SB001044', total: '115,000.00' },
  { date: '10/08/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'RAQUINE', first: 'ROMEL', middle: 'PALUMANI', address: 'P.2 MUNOS WEST ROXAS ISABELA', contact: '9538263378', dr_no: '69', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK', engine: '162FMKN5158471', chassis: 'LX8PCL503NE012653', total: '50,000.00' },
  { date: '10/11/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'BALLESTEROS', first: 'ERWIN', middle: 'CALPOTURA', address: 'P.3 MUNOS WEST ROXAS ISABELA', contact: '9913923064', dr_no: '74', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLUE', engine: '162FMKN5158600', chassis: 'LX8PCL501NE012781', total: '50,000.00' },
  { date: '10/21/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'MEJIA', first: 'JEFFREY', middle: 'BAJO', address: 'P.7 SAN ANTONIO ROXAS ISABELA', contact: '9513269576', dr_no: '478', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106720', chassis: 'LX8PCL500SE007941', total: '50,000.00' },
  { date: '10/25/2025', closer: 'Nailmar Nagum', source: 'WALK-IN', category: 'Financing', last: 'GAMBOA', first: 'RONALD', middle: 'DE LEON', address: 'P.2 QUILING ROXAS ISABELA', contact: '9361371275', dr_no: '112', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106893', chassis: 'LX8PCL503SE008114', total: '50,000.00' },
  { date: '10/29/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'ORDONIO', first: 'WILLIE', middle: 'PRADO', address: 'P.1 SITIO MANANAO SAN MANUEL ISABELA', contact: '', dr_no: '125', brand: 'MONARCH', model: 'MONARCH 125', color: 'BLUE', engine: '156FMI2S5106357', chassis: 'LX8PCJ507SE003857', total: '46,000.00' },
  { date: '10/29/2025', closer: 'Nailmar Nagum', source: 'AGENT', category: 'Financing', last: 'VILLEGAS', first: 'MARIO', middle: 'DOMINGO', address: 'P.TAGUMPAY MATUSALEM ROXAS ISABELA', contact: '', dr_no: '126', brand: 'MONARCH', model: 'MONARCH 125', color: 'RED', engine: '156FMI2S5106274', chassis: 'LX8PCJ503SE003774', total: '46,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Roxas sales for branch:', branch.name, 'id=', branch.id);

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

      // Strict SKYGO mapping
      const item = await utils.findSkygoItemForModel(prisma, normalizeModel(r.model));

      const totalAmount = parseAmount(r.total);
      const category = r.category || 'Financing';

      // Enforce: must have a concrete unit in inventory
      if (!item) {
        console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no);
        continue;
      }
      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, r.engine, r.chassis);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) {
          console.warn('SKIP: No available unit (and could not auto-add) for', r.engine || r.chassis, 'model', item.model, 'dr_no', r.dr_no);
          continue;
        }
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

  console.log('\nRoxas seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
