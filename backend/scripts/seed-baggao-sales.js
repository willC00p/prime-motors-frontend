const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag to identify this seed for easy undo
const SEED_TAG = 'seed_baggao_sales_2025_09_06';

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
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Baggao', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Baggao" not found in branches table.');
  return b;
}

// Dataset: Sept–Nov 2025 for Baggao
const rows = [
  // SEPTEMBER 2025
  { date: '9/6/2025',   closer: 'CRISTIAN',   source: 'AGENT', category: 'Financing', last: 'MARET',      first: 'RODOLFO',  middle: '',        address: 'ZONE 7 IMURONG BAGGAO, BAGGAO, CAGAYAN', contact: '9537847035', dr_no: '45',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'BLACK',      engine: '156FMI2S5106302', chassis: 'LX8PCJ504SE003802', total: '46,000.00' },
  { date: '9/10/2025',  closer: 'ALJON',      source: 'AGENT', category: 'Financing', last: 'PASCUAL',    first: 'REYMUNDO', middle: 'A',       address: 'ZONE 6 IMURONG BAGGAO, CAGAYAN',         contact: '9555149070', dr_no: '3',   brand: 'MONARCH', model: 'MONARCH 175',   color: 'BLUE',       engine: '162FMKN5158599', chassis: 'LX8PCL501NEO12778', total: '50,000.00' },
  { date: '9/17/2025',  closer: 'ALJON',      source: 'AGENT', category: 'Financing', last: 'CABISORA',   first: 'MARIELA',  middle: 'CALAGUI', address: 'ZONE 7 BACAGAN, BAGGAO CAGAYAN',        contact: '9534809889', dr_no: '12',  brand: 'SKYGO',   model: 'M1 LANCE 150',  color: 'WHITE/GOLD', engine: '1P57MJSI067226', chassis: 'LX8TDK8UXSB000162', total: '97,000.00' },
  { date: '9/17/2025',  closer: 'CRISTIAN',   source: 'AGENT', category: 'Financing', last: 'CABARO JR.', first: 'JERRY',    middle: 'CORTEZ', address: 'AZONE 6 ASINGA VIA BAGGAO, CAGAYAN',   contact: '9975943503', dr_no: '13',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'BLACK',      engine: '156FMI2S5106304', chassis: 'LX8PCL508SE003804', total: '46,000.00' },
  { date: '9/17/2025',  closer: 'CRISTIAN',   source: 'AGENT', category: 'Financing', last: 'CARGO',      first: 'MARINA',   middle: 'CARIG',  address: 'ZONE 6 TALLANG, BAGGAO, CAGAYAN',        contact: '9355036702', dr_no: '14',  brand: 'SKYGO',   model: 'M1 LANCE 150',  color: 'WHITE/GOLD', engine: '1P57MJR1343564', chassis: 'LX8TDK8U3RB001471', total: '97,000.00' },
  { date: '9/23/2025',  closer: 'ALJON',      source: 'AGENT', category: 'Financing', last: 'FRANCISCO',  first: 'ARWIN',    middle: 'JAVIER', address: 'ZONE 4 DALLA BAGGAO, CAGAYAN',         contact: '9971297097', dr_no: '21',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',        engine: '156FMI2S5106266', chassis: 'LX8PCLJ504SE003766', total: '46,000.00' },
  { date: '9/23/2025',  closer: 'ALJON',      source: 'AGENT', category: 'Financing', last: 'LAS-AY',     first: 'MA. CRESENCIA', middle: 'SAUSORA', address: 'ZONE 6 SAN VICENTE BAGGAO., CAGAYAN', contact: '9817687130', dr_no: '23',  brand: 'MONARCH', model: 'MONARCH 175',   color: 'RED',        engine: '162FMKS5106718', chassis: 'LX8PCL502SE007939', total: '50,000.00' },
  { date: '9/25/2025',  closer: 'CRISTIAN',   source: 'AGENT', category: 'Financing', last: 'TAMON JR.',  first: 'ELIGIO',   middle: 'COLLADO',address: 'ZONE 3 CAMASI PEÑABLANCA CAGAYAN',       contact: '',           dr_no: '26',  brand: 'MONARCH', model: 'MONARCH 175',   color: 'RED',        engine: '162FMKS5106712', chassis: 'LX8PCL501SE007933', total: '50,000.00' },
  { date: '9/28/2025',  closer: 'CRISTIAN',   source: 'AGENT', category: 'Financing', last: 'VENTURA JR.',first: 'ARTEMIO',  middle: 'TACUBAN',address: 'ZONE 7 AWALLA, BAGGAO CAGAYAN',           contact: '',           dr_no: '39',  brand: 'MONARCH', model: 'MONARCH 175',   color: 'RED',        engine: '162FMKS5106745', chassis: 'LX8PCL505SE007966', total: '50,000.00' },
  { date: '9/30/2025',  closer: 'ALJON',      source: 'AGENT', category: 'Financing', last: 'AGRIMOR',    first: 'JONATHAN', middle: 'FRANCISCO', address: 'ZONE 3 TAYTAY BAGGAO, CAGAYAN',        contact: '',           dr_no: '43',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',        engine: '156FMI2S5106270', chassis: 'LX8PCL506SE003770', total: '46,000.00' },

  // OCTOBER 2025
  { date: '10/1/2025',   closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'FANTALGO',  first: 'GILBERT',   middle: 'ASUNCION', address: 'ZONE 3 TAYTAY BAGGAO CAGAYAN', contact: '9971097641', dr_no: '51',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',         engine: '156FMI2S5106277', chassis: 'LX8PCJ509SE003777', total: '46,000.00' },
  { date: '10/4/2025',   closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'PELAYO',    first: 'MARILYN',   middle: 'ADRIANO', address: 'ZONE 1 SAN JOSE BAGGAO CAGAYAN', contact: '9654805397', dr_no: '65',  brand: 'MONARCH', model: 'P1 BOLT 150',   color: 'SILVER/BLACK', engine: '1P57MJS1226943', chassis: 'LX8TDK8G1SB001369', total: '115,000.00' },
  { date: '10/5/2025',   closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'DURAN',     first: 'JONEDES',   middle: 'BALLESTEROS', address: 'ZONE 5 ASASSI BAGGAO, CAGAYAN', contact: '9514456225', dr_no: '70',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',         engine: '156FMI-2S5106281', chassis: 'LOX8PCJ500SE003781', total: '46,000.00' },
  { date: '10-10-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'IBAÑEZ',    first: 'FERDINAND', middle: 'ALSECO',   address: 'ZONE 7 IMURONG, BAGGAO,CAGAYAN', contact: '9269308142', dr_no: '75',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',         engine: '156FMI2S5106235', chassis: 'LX8PCJ504SE003735', total: '46,000.00' },
  { date: '10-13-2025',  closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'JACOBE JR.',first: 'JAIME',     middle: 'JAVIER',  address: 'ZONE 5 DALLA BAGGAO, CAGAYAN',     contact: '9269314066', dr_no: '84',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',         engine: '165FMI2R5123773', chassis: 'LX8PCL509RE011047', total: '46,000.00' },
  { date: '10-15-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'VENUS',     first: 'MARICEL',   middle: 'MOLINA',  address: 'ZONE 5 SAN JOSE, BAGGAO,CAGAYAN', contact: '9676316381', dr_no: '94',  brand: 'MONARCH', model: 'OMNI 125',      color: 'GRAY',        engine: '1P52QMISTC00550', chassis: 'LWMTJYV1C2ST000550', total: '72,000.00' },
  { date: '10-16-2025',  closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'LAWIGAN',   first: 'DANTE',     middle: 'LUMAUAN', address: 'ZONE 6 AWALLAN, BAGGAO,CAGYAN', contact: '9397147502', dr_no: '95',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'BLUE',        engine: '156FMI2S5106363', chassis: 'LX8PCJ502SE003863', total: '46,000.00' },
  { date: '10-17-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'PEDRALVEZ', first: 'JOEFFREY',  middle: 'PARALLAG', address: 'ZONE 7 SAN MIGUEL, BAGGAO,CAGAYAN', contact: '9556653540', dr_no: '41',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'RED',         engine: '156FMI12R5123745', chassis: 'LX8PCJ504RE011019', total: '46,000.00' },
  { date: '10-18-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'BALLINAN',  first: 'RODRIGO',   middle: 'LAUIGAN', address: 'ZONE 1 SAN MIGUEL, BAGGAO, CAGAYAN', contact: '9657541864', dr_no: '40',  brand: 'MONARCH', model: 'MONARCH 175',   color: 'BLUE',        engine: '162FMKS5106794', chassis: 'LX8PCL501SE008015', total: '50,000.00' },
  { date: '10-20-2025',  closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'PERALTA',   first: 'FREDDIE',   middle: 'LATAWAN', address: 'ZONE 7 BACAGAN, BAGGAO,CAGAYAN', contact: '9168948578', dr_no: '51',  brand: 'MONARCH', model: 'OMNI 125',      color: 'WHITE',       engine: '1P2QMISTC00214', chassis: 'LWMTJVIC8ST0002', total: '72,000.00' },
  { date: '10-20-2025',  closer: 'CHRISTOPHER', source: 'AGENT', category: 'Financing', last: 'CABANG',    first: 'OLIVER',    middle: 'QUINES',  address: 'ZONE 1 SAN FRANCISCO, BAGGAO, CAGAYAN', contact: '9693386804', dr_no: '53',  brand: 'MONARCH', model: 'MONARCH 125',   color: 'BLUE',        engine: '156FMI285106355', chassis: 'LX8PCJ503SE003855', total: '46,000.00' },
  { date: '10-20-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'TRONDILLO', first: 'JAYBEE',    middle: 'BADUA',   address: 'ZONE 2 SANJOSE, BAGGAO,CAGAYAN', contact: '9164977166', dr_no: '97',  brand: 'MONARCH', model: 'P1 BOLT 150',   color: 'SILVER/BLACK', engine: '1P57MJS1226978', chassis: 'LX8TDK8G7SB001408', total: '115,000.00' },
  { date: '10-21-2025',  closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'BALLINAN',  first: 'RODOLFO',   middle: 'LAUIGAN', address: 'ZONE 1 SAN MIGUEL, BAGGAO, CAGAYAN', contact: '9772189087', dr_no: '90',  brand: 'MONARCH', model: 'OMNI 125',      color: 'GRAY',        engine: '1P52QMISTC00270', chassis: 'LWMTJVIC7ST000270', total: '72,000.00' },
  { date: '10-24-2025',  closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'FRONDA',    first: 'ELMER',     middle: 'FLORES',  address: 'ZONE 6 DALLA,BAGGAO,CAGAYAN', contact: '9971297097', dr_no: '116', brand: 'MONARCH', model: 'MONARCH 175',   color: 'BLUE',        engine: '162FMKS5106989', chassis: 'LX8PCL50XSE008210', total: '50,000.00' },
  { date: '10-25-2025',  closer: 'CRISITIAN',   source: 'AGENT', category: 'Financing', last: 'BARCILLANO',first: 'VIRGINIA',  middle: 'AGCAOILI', address: 'ZONE 5 CAPIDDIGAN, GATTARAN,CAGAYAN', contact: '9656506110', dr_no: '115', brand: 'MONARCH', model: 'MONARCH 125',   color: 'BLUE',        engine: '156FMI2S5106365', chassis: 'LX8PCJ506SE003865', total: '46,000.00' },

  // NOVEMBER 2025
  { date: '11/03/2025', closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'MANUEL',    first: 'REYMA',     middle: 'ASUNCION', address: 'ZONE 3 BITAG GRANDE, BAGGAO CAGAYAN', contact: '9358714727', dr_no: '134', brand: 'MONARCH', model: 'MONARCH 175', color: 'RED', engine: '162FMKS5106897', chassis: 'LX8PCL500SE008118', total: '50,000.00' },
  { date: '11/03/2025', closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'CABARO',    first: 'JOMAR',     middle: 'SIBBALUCA', address: 'ZONE 6 ASINGA VIA, BAGGAO,CAGAYAN', contact: '9655148211', dr_no: '132', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK/GREEN', engine: '162FMKS5106930', chassis: 'LX8PCL509SE008151', total: '50,000.00' },
  { date: '11/03/2025', closer: 'CRISTOPHER',  source: 'AGENT', category: 'Financing', last: 'SALDIVAR',  first: 'BRYAN',     middle: 'RAMIL',    address: 'ZONE 5 SAN FRANCISCO, BAGGAO, CAGAYAN', contact: '9752550388', dr_no: '131', brand: 'MONARCH', model: 'MONARCH 150', color: 'BLACK/GREEN', engine: '161FMJS5105853', chassis: 'LX8PCK507SE011723', total: '48,000.00' },
  { date: '11/04/2025', closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'GALACE',    first: 'EDGIE',     middle: 'CANOLO',   address: 'ZONE 7 SANTOR, BAGGAO CAGAYAN', contact: '9532759569', dr_no: '138', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK/GREEN', engine: '162FMKS5106937', chassis: 'LX8PCL501SE008158', total: '50,000.00' },
  { date: '11/04/2025', closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'CACHUELA',  first: 'APOLINARIO', middle: 'ALLEBAN', address: 'ZONE 5 SAN ANTONIO, BAGGAO, CAGAYAN', contact: '9543391505', dr_no: '139', brand: 'MONARCH', model: 'MONARCH 150', color: 'BLACK/GREEN', engine: '161FMJS5105824', chassis: 'LX8PCK504SE011694', total: '48,000.00' },
  { date: '11/08/2025', closer: 'CHRISTOPHER', source: 'AGENT', category: 'Financing', last: 'OROSCO',    first: 'FERNANDO',  middle: 'DUMLAO',  address: 'ZONE 4 SANJOSE, BAGGAO, CAGAYAN', contact: '9916884416', dr_no: '150', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'GOLD/SILVER', engine: '1P57MJS1227294', chassis: 'LX8TCK8G7SB001585', total: '115,000.00' },
  { date: '11/08/2025', closer: 'CRISTIAN',    source: 'AGENT', category: 'Financing', last: 'PASION',    first: 'CRISTOPHER', middle: 'CORPUZ', address: 'ZONE 7 ASINGA VIA, BAGGAO, CAGAYAN', contact: '9652133224', dr_no: '152', brand: 'MONARCH', model: 'MONARCH 150', color: 'RED', engine: '161FMJS5131306', chassis: 'LX8PCK501SE018666', total: '48,000.00' },
  { date: '11/08/2025', closer: 'ALJON',       source: 'AGENT', category: 'Financing', last: 'BARTOLOME', first: 'LUZVIMINDA', middle: 'SAGUIPED', address: 'ZONE 5 SAN ANTONIO, BAGGAO, CAGAYAN', contact: '9557760274', dr_no: '153', brand: 'MONARCH', model: 'MONARCH 175', color: 'BLACK/GREEN', engine: '162FMKS5106927', chassis: 'LX8PCL509SE008148', total: '50,000.00' }
];

async function seed() {
  const branch = await findBranch();
  console.log('Seeding Baggao sales for branch:', branch.name, 'id=', branch.id);

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

  console.log('\nBaggao seeding complete. Created', created.length, 'sales. Skipped', skipped.length, 'existing. Seed tag:', SEED_TAG);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
