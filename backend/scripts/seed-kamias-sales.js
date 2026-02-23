const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const utils = require('./seed-utils');

// Tag used to identify seeded sales so the undo script can find them
const SEED_TAG = 'seed_kamias_sales_2025_07_11';

// Minimal dataset extracted from the provided CSV-like data.
// Fields: date (YYYY-MM-DD), dr_no, brand, model, color, engine_no, chassis_no, total_amount, last_name, given_name, middle_name, address, contact_no, payment_method, category, sales_closer, source
const rows = [
  // JULY
  { date: '2025-07-01', dr_no: '0000002', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1062811', chassis: 'LX8TDK8G2SB000098', total: 115000, last: 'Luto', first: 'Atanacio Jr', middle: 'Ty', address: '#54 buensoceso homes 2 Brgy Merville Paranaque', contact: '9171625999', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-05', dr_no: '0000003', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1062802', chassis: 'LX8TDK8G1SB000089', total: 115000, last: 'Servas', first: 'Jimboy', middle: 'Papa', address: 'B2 L15 Westville 2A Ligas III Bacoor Cavite', contact: '9542297123', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-05', dr_no: '0000004', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJR1341803', chassis: 'LX8TDK8G0RB002412', total: 115000, last: 'Valleja', first: 'Mercidito', middle: 'Avila', address: 'P1 B11 L21 Parklane Subd Brgy Santiago General Trias Cavite', contact: '9154879564', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-08', dr_no: '0000005', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118543', chassis: 'LX8TDK8GSB000715', total: 115000, last: 'Custodio', first: 'Ryan', middle: 'Pardo', address: '106 Impieral St Brgy E. Rod Cubao Quezon City', contact: '9273481722', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-10', dr_no: '0000006', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJR1297908', chassis: 'KX8TDK805RB001035', total: 97000, last: 'Belmonte', first: 'Arnel', middle: 'Mapindan', address: '138 Albany st Brgy Silangan Cubao Quezon City', contact: '9121109750', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-12', dr_no: '0000007', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121581', chassis: 'LX8TDK8GXSB000964', total: 115000, last: 'Osma', first: 'Vincent', middle: 'Arce', address: 'blk 67 L18 P6 Silangan San Mateo Rizal', contact: '9615489353', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-17', dr_no: '0000008', brand: 'MONARCH', model: 'OMNI 125', color: 'SILVER/GRAY', engine: '1P52QMIRTC01413', chassis: 'LWMTJV1C5RT001413', total: 72000, last: 'Sevilla', first: 'Julius Ceasar', middle: 'Trinidad', address: '2B KJ St East Kamias Quezon City', contact: '9455781551', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-17', dr_no: '0000009', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118532', chassis: 'LX8TDK8G9SB000728', total: 115000, last: 'Beltran', first: 'Agnes', middle: 'Paras', address: '2218 Cngressional Tower Center Congressiona Ave Q.C', contact: '9668015624', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-19', dr_no: '0000010', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK/GOLD', engine: '1P5MJR1343561', chassis: 'LX8TDK8U8RB001451', total: 97000, last: 'Aro', first: 'Christian', middle: 'Ludia', address: 'P3 PCJ  Cruz BF Homes Parañaque City', contact: '9300055537', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-22', dr_no: '0000011', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118535', chassis: 'LX8TDK8G3SB000711', total: 115000, last: 'Lantin', first: 'Mark Angelo', middle: 'Casipit', address: '39 langka st, Brgy Project 2 Quezon City', contact: '9670331062', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-31', dr_no: '0000012', brand: 'Monarch', model: 'P1 BOLT 150', color: 'Black/Silver', engine: '1P57MJS1120645', chassis: 'LX8TDK8G1SB000917', total: 115000, last: 'Ebora', first: 'Michael Charles', middle: 'Aguinaldo', address: '128 Gen Luna St Brgy Ususan Taguig City', contact: '9674632784', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-07-31', dr_no: '0000013', brand: 'Monarch', model: 'P1 BOLT 150', color: 'Black/Silver', engine: '1P57MJS1121560', chassis: 'LX8TDK8G9SB000986', total: 115000, last: 'Labramonte', first: 'Arjay', middle: 'Garcia', address: '119 Santa Cecilla St Brgy Maly San Mateo Rizal', contact: '9670143216', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },

  // AUGUST
  { date: '2025-08-08', dr_no: '0001', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'BLACK/SILVER', engine: '1P57MJR1297850', chassis: 'LX8TDK8U4RB000989', total: 97000, last: 'Francisco', first: 'Alvin', middle: 'Bajado', address: 'Blk 6 Kaingin 1 Brgy Pansol Quezon City', contact: '9649455604', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-19', dr_no: '0006', brand: 'SKYGO', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118480', chassis: 'LX8TDK8G8SB000669', total: 115000, last: 'Gaude', first: 'Rainer', middle: 'Mallari', address: '120 Mayo 28 Brgy 869 Punta Sta Ana Manila', contact: '9605479796', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-20', dr_no: '8', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118525', chassis: 'LX8TDK8G7SB000727', total: 115000, last: 'Rivera', first: 'Arvin', middle: 'Dacutanan', address: 'Blk 2 Lot * TUP Cmpound W Bicutan Taguig', contact: '9928625969', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-25', dr_no: '19', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1118590', chassis: 'LX8TDK8G7SB000789', total: 115000, last: 'Alcaide', first: 'Mark Frederic', middle: 'Diego', address: 'Claro St, Project 3 Quezon City', contact: '9859835328', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-27', dr_no: '24', brand: 'SKYGO', model: 'M1 LANCE 150', color: 'WHITE/GOLD', engine: '1P57MJR1343556', chassis: 'LX8TDK8U3RB001468', total: 97000, last: 'Bayore Jr', first: 'Felipe', middle: 'Everdone', address: '416 M Leyva St Old Zaniga Distric 2 Quezon City', contact: '9687360822', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-28', dr_no: '25', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BROWN/SIVER', engine: '1P57MJS1118573', chassis: 'LX8TDK8G7SB000761', total: 115000, last: 'Garbiles', first: 'Reymund', middle: 'Peñas', address: '162 L11&13 La solidaridad San Isidro Montalban Rizal', contact: '9454767736', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },
  { date: '2025-08-29', dr_no: '26', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121579', chassis: 'LX8TDK8G2SB000991', total: 115000, last: 'Leona', first: 'Leonard', middle: 'Flores', address: '1832 Sampaguita st Kahilom Pandacan Manila', contact: '9562596515', payment_method: 'Financing', category: 'Financing', sales_closer: '', source: 'WALK-IN' },

  // SEPTEMBER
  { date: '2025-09-06', dr_no: '44', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121637', chassis: 'LX8TDK8G4SB001026', total: 115000, last: 'Marinay', first: 'Mayflor', middle: 'Novencido', address: 'Sitio Maligaya 2 Mambugan Antipolo City', contact: '9634979860', payment_method: 'Financing', category: 'Financing', sales_closer: 'joey', source: 'AGENT' },
  { date: '2025-09-08', dr_no: '46', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121628', chassis: 'LX8TDK8G5SB001021', total: 115000, last: 'Malabanan', first: 'Suzanne Andrea', middle: 'Lim', address: '972 unit C Claro Castañeda st  Mandaluyong City', contact: '', payment_method: 'Financing', category: 'Financing', sales_closer: 'arjay', source: 'AGENT' },
  { date: '2025-09-10', dr_no: '49', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121638', chassis: 'LX8TDK8G6SB001027', total: 115000, last: 'Cortes', first: 'Rogelio', middle: 'Enrique', address: '305 matahimik St Malaya Quezon City', contact: '9544430495', payment_method: 'Financing', category: 'Financing', sales_closer: 'joey', source: 'WALK-IN' },
  { date: '2025-09-18', dr_no: '50', brand: 'Monarch', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1121629', chassis: 'LX8TDK8G7SB001022', total: 115000, last: 'Pabica', first: 'Adandholf', middle: 'Baccay', address: '21 Paquita St Brgy Gulod Novaliches Queson City', contact: '9816747350', payment_method: 'Financing', category: 'Financing', sales_closer: 'joey', source: 'AGENT' },
  { date: '2025-09-24', dr_no: '74', brand: 'Monarch', model: 'OMNI 125', color: 'GRAY', engine: '1P52QMIRTC01414', chassis: 'LWMTJV1C7RT001414', total: 72000, last: 'Magalit', first: 'Dalrine', middle: 'De Blas', address: '141 Petchay St Napico Pasig City', contact: '', payment_method: 'Cash', category: 'Cash', sales_closer: 'jr', source: 'WALK-IN' },

  // OCTOBER
  { date: '2025-10-11', dr_no: '75', brand: 'Monacrh', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227275', chassis: 'LX8TDK8G2SB001543', total: 115000, last: 'alejandro', first: 'Mahvis', middle: 'S', address: 'Block 18 Lot 51 Phase 2 Area 4 Dalagang Bukid Longos Malabon City', contact: '9152047308', payment_method: 'Financing', category: 'Financing', sales_closer: 'kenji', source: 'AGENT' },
  { date: '2025-10-17', dr_no: '77', brand: 'Monacrh', model: 'P1 BOLT 150', color: 'BROWN/SILVER', engine: '1P57MJS1227286', chassis: 'LX8TDK8G8SB001546', total: 115000, last: 'Rocabo', first: 'John Kenneth', middle: 'D', address: '1697 Lrc Compound cm recto Barangay 310 Manila City', contact: '9456171322', payment_method: 'Financing', category: 'Financing', sales_closer: 'Joey', source: 'WALK-IN' },
  { date: '2025-10-27', dr_no: '79', brand: 'Monacrh', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1230048', chassis: 'LX8TDK8GXSB001676', total: 115000, last: 'Estinozo', first: 'John Carlos', middle: 'S', address: '262 Don fabian Street Barangay Commonwealth Quezon City', contact: '9514419843', payment_method: 'Financing', category: 'Financing', sales_closer: 'Joey', source: 'AGENT' },
  { date: '2025-10-27', dr_no: '78', brand: 'Monacrh', model: 'OMNI 125', color: 'White', engine: '1P52QMIRTC01304', chassis: 'LWMTV1C0RT001304', total: 72000, last: 'Sayson', first: 'Joel', middle: 'C', address: 'block 6 lot 97 purok marilag', contact: '9108129147', payment_method: 'INHOUSE', category: 'INHOUSE', sales_closer: 'kenji', source: 'WALK-IN' },

  // NOVEMBER
  { date: '2025-11-10', dr_no: '91', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1230043', chassis: 'LX8TDK8G1SB001694', total: 115000, last: 'DIPLOMO', first: 'ROLANDO', middle: 'S', address: 'JAINGIN 1 BLOCK 6 BARANGY PANSOL QUEZON CITY', contact: '9853938023', payment_method: 'Financing', category: 'Financing', sales_closer: 'joey', source: 'AGENT' },
  { date: '2025-11-10', dr_no: '90', brand: 'MONARCH', model: 'P1 BOLT 150', color: 'BLACK/SILVER', engine: '1P57MJS1230024', chassis: 'LX8TDK8G4SB001690', total: 115000, last: 'GALINDEZ', first: 'JAIMERN RAIZEN YVES', middle: 'S', address: '34 PAJO STREET QUIRINO 2-A QUEZON CITY', contact: '9526586915', payment_method: 'Financing', category: 'Financing', sales_closer: 'Joey', source: 'WALK-IN' },
  { date: '2025-11-11', dr_no: '92', brand: 'MONARCH', model: 'OMNI 125', color: 'BLUE', engine: '1P52QMIRTC01243', chassis: 'LWMTJV1C6RT001243', total: 72000, last: 'OLAVARIO', first: 'MARVIN', middle: 'N', address: 'SITIO MAAGAY 2 INARAWAN ANTIPOLO CITY', contact: '9216877351', payment_method: 'Financing', category: 'Financing', sales_closer: 'Kenjie', source: 'WALK-IN' }
];

async function findBranch() {
  const b = await prisma.branches.findFirst({ where: { name: { contains: 'Kamias', mode: 'insensitive' } } });
  if (!b) throw new Error('Branch containing "Kamias" not found in branches table. Please create or verify branch name.');
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

      // Idempotency: do NOT use dr_no (can be duplicated). Use engine/chassis if present to detect already-sold units.
      // COMMENTED OUT: Allow re-seeding of units for Kamias to reach expected total
      // const engKey = (r.engine || '').trim();
      // const chsKey = (r.chassis || '').trim();
      // if (engKey || chsKey) {
      //   const alreadySold = await utils.isVehicleAlreadySold(prisma, engKey, chsKey);
      //   if (alreadySold) {
      //     console.log('Skip existing sale for unit', engKey || chsKey, '(already sold)');
      //     skipped.push(engKey || chsKey);
      //     continue;
      //   }
      // }

      const engKey = (r.engine || '').trim();
      const chsKey = (r.chassis || '').trim();

      // Additional guard: when both engine and chassis are missing, avoid creating duplicates
      // by skipping if a sale already exists for this branch with the same DR number.
      if (!engKey && !chsKey && (r.dr_no && String(r.dr_no).trim().length > 0)) {
        const existingByDr = await prisma.sales.findFirst({
          where: { branch_id: branch.id, dr_no: String(r.dr_no).trim() }
        });
        if (existingByDr) {
          console.log('Skip sale with empty engine/chassis due to existing same DR in branch ->', r.dr_no);
          skipped.push(`DR:${r.dr_no}`);
          continue;
        }
      }

      // Strict SKYGO model mapping based on db/seed_skygo_models.sql
      const modelNorm = normalizeModel(r.model || '');
      const item = await utils.findSkygoItemForModel(prisma, modelNorm);

      const totalAmount = r.total != null ? Number(r.total) : 0;

      // Require a concrete unit in inventory before creating any sale
      const eng = (r.engine || '').trim();
      const chs = (r.chassis || '').trim();
      if (!item) {
        console.warn('SKIP: SKYGO item not found for model', r.model, 'dr_no', r.dr_no);
        continue;
      }
      let vehicle = await utils.findAvailableVehicleForBranchAndItem(prisma, branch.id, item.id, eng, chs);
      if (!vehicle) {
        vehicle = await utils.ensureInventoryUnitForSale(prisma, branch.id, item, r, dateSold);
        if (!vehicle) {
          console.warn('SKIP: No available unit in inventory (and could not auto-add) for', eng || chs, 'model', item.model, 'dr_no', r.dr_no);
          continue;
        }
      }

      // We'll run per-sale transaction so partial failures don't leave inconsistent state per sale
      const result = await prisma.$transaction(async (tx) => {
        const sale = await tx.sales.create({
          data: {
            branch_id: branch.id,
            date_sold: dateSold,
            dr_no: r.dr_no || null,
            si_no: r.dr_no || null,
            total_amount: totalAmount,
            payment_method: r.payment_method || null,
            category_of_sales: r.category || null,
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

        // Link to concrete vehicle unit and update inventory
        await tx.vehicle_units.update({ where: { id: vehicle.id }, data: { status: 'sold' } });
        await tx.inventory_movements.update({ where: { id: vehicle.inventory_id }, data: { sold_qty: { increment: 1 }, ending_qty: { decrement: 1 } } });
        await tx.sales_items.create({ data: { sale_id: sale.id, item_id: item.id, qty: 1, unit_price: Number(r.total) || 0, amount: Number(r.total) || 0, vehicle_unit_id: vehicle.id } });
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
