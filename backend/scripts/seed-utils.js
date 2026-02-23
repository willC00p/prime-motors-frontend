// Shared utilities for sales seeding based on SKYGO models and strict unit-in-inventory rule
const { PrismaClient } = require('@prisma/client');

// Canonical SKYGO model names as defined in db/seed_skygo_models.sql
const CANONICAL_MODELS = [
  'MONARCH 175',
  'MONARCH 150',
  'MONARCH 125',
  'OMNI 125',
  'M1 ARROW 150',
  'CAFE 125',
  'CUB 110',
  'E1 AXIS 125',
  'M1 SPEAR 180 FI',
  'P1 TEMPEST 250',
  'M1 LANCE 150',
  'P1 BOLT 150',
  'KPV 150 KEYLESS'
];

// Synonym mapping -> canonical model name
const SYNONYMS = [
  { match: [/^TM\s*175$/i, /^TM175$/i], canon: 'MONARCH 175' },
  { match: [/^TM\s*150$/i, /^TM150$/i], canon: 'MONARCH 150' },
  { match: [/^TM\s*125$/i, /^TM125$/i], canon: 'MONARCH 125' },
  { match: [/^WM125$/i, /^OMNI\s*125$/i, /^OMNI-?125$/i], canon: 'OMNI 125' },
  { match: [/^RM150ST$/i, /ARROW\s*150/i, /M1\s*ARROW\s*150/i], canon: 'M1 ARROW 150' },
  { match: [/^RM125CB$/i, /E1\s*AXIS(\s*125)?/i, /AXIS\s*125/i], canon: 'E1 AXIS 125' },
  { match: [/^RM110CB$/i, /CUB\s*110/i], canon: 'CUB 110' },
  { match: [/^RM175CB$/i, /SPEAR\s*180/i], canon: 'M1 SPEAR 180 FI' },
  { match: [/^RM250ST$/i, /TEMPEST\s*250/i], canon: 'P1 TEMPEST 250' },
  { match: [/^SG150-?L$/i, /LANCE\s*150/i], canon: 'M1 LANCE 150' },
  { match: [/^TM150T$/i, /BOLT\s*150/i, /^P1\s*BOLT/i], canon: 'P1 BOLT 150' },
  { match: [/^SG150T-?KL$/i, /^KPV\s*150/i], canon: 'KPV 150 KEYLESS' },
  // Single-keyword fallbacks (very permissive by design)
  { match: [/\bLANCE\b/i], canon: 'M1 LANCE 150' },
  { match: [/\bBOLT\b/i], canon: 'P1 BOLT 150' },
  { match: [/\bARROW\b/i], canon: 'M1 ARROW 150' },
  { match: [/\bTEMPEST\b/i], canon: 'P1 TEMPEST 250' },
  { match: [/\bSPEAR\b/i], canon: 'M1 SPEAR 180 FI' },
  { match: [/\bAXIS\b/i], canon: 'E1 AXIS 125' },
  { match: [/\bOMNI\b/i], canon: 'OMNI 125' },
  { match: [/\bCAFE\b/i], canon: 'CAFE 125' },
  { match: [/\bCUB\b/i], canon: 'CUB 110' },
];

function normalizeWhitespace(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function normalizeSkygoModel(model) {
  const m = normalizeWhitespace(model).toUpperCase();
  if (!m) return '';
  // Exact canonical match
  const exact = CANONICAL_MODELS.find(c => c.toUpperCase() === m);
  if (exact) return exact;
  // Synonym patterns
  for (const entry of SYNONYMS) {
    if (entry.match.some((re) => re.test(m))) return entry.canon;
  }
  // Heuristic contains matching
  const contains = CANONICAL_MODELS.find(c => m.includes(c.toUpperCase()));
  return contains || m; // return original upper name as last resort
}

async function findSkygoItemForModel(prisma, modelName) {
  const canon = normalizeSkygoModel(modelName);
  if (!canon) return null;
  // Prefer exact model name match within SKYGO brand
  let item = await prisma.items.findFirst({
    where: {
      brand: { equals: 'SKYGO', mode: 'insensitive' },
      model: { equals: canon, mode: 'insensitive' }
    }
  });
  if (item) return item;
  // Fallback: contains search on model
  item = await prisma.items.findFirst({
    where: {
      brand: { equals: 'SKYGO', mode: 'insensitive' },
      model: { contains: canon, mode: 'insensitive' }
    }
  });
  if (item) return item;

  // Final fallback: token-similarity against all SKYGO models
  const all = await prisma.items.findMany({
    where: { brand: { equals: 'SKYGO', mode: 'insensitive' } },
    select: { id: true, model: true }
  });
  const targetTokens = canon.split(/\s+/).filter(Boolean);
  const scored = all.map((it) => {
    const tokens = String(it.model || '').toUpperCase().split(/\s+/).filter(Boolean);
    const inter = tokens.filter(t => targetTokens.includes(t));
    const union = Array.from(new Set(tokens.concat(targetTokens)));
    const jaccard = union.length ? inter.length / union.length : 0;
    return { it, score: jaccard };
  }).sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (best && best.score >= 0.34) {
    return await prisma.items.findFirst({ where: { id: best.it.id } });
  }
  return null;
}

async function findAvailableVehicleForBranchAndItem(prisma, branchId, itemId, engineNo, chassisNo) {
  const eng = (engineNo || '').trim();
  const chs = (chassisNo || '').trim();
  // If engine/chassis provided, try to find that exact unit first
  if (eng || chs) {
    const vehicle = await prisma.vehicle_units.findFirst({
      where: {
        OR: [
          eng ? { engine_no: eng } : undefined,
          chs ? { chassis_no: chs } : undefined
        ].filter(Boolean)
      },
      include: { inventory: true }
    });

    if (!vehicle) return null;
    if (vehicle.transferred) return null;
    if (vehicle.status && vehicle.status.toLowerCase() !== 'available') return null;
    if (!vehicle.inventory) return null;
    if (vehicle.inventory.branch_id !== branchId) return null;
    if (itemId && vehicle.inventory.item_id !== itemId) return null;
    return vehicle;
  }

  // Fallback only when engine & chassis are both missing: pick any available unit of this item in the branch
  const fallbackCandidates = await prisma.vehicle_units.findMany({
    where: {
      status: { equals: 'available' },
      inventory: { branch_id: branchId, item_id: itemId }
    },
    take: 10,
    orderBy: { id: 'asc' },
    include: { inventory: true }
  });
  const fallback = (fallbackCandidates || []).find(v => !v.transferred);
  return fallback || null;
}

module.exports = {
  normalizeSkygoModel,
  findSkygoItemForModel,
  findAvailableVehicleForBranchAndItem,
  ensureInventoryUnitForSale,
  isVehicleAlreadySold,
};

// Create an inventory movement and a vehicle unit in the given branch for the given item.
// Returns an available vehicle unit linked to a freshly created inventory movement for the branch/item.
// Behavior:
// - If engine/chassis provided and an existing unit is found in THIS branch for THIS item and it's available -> reuse it.
// - If an existing unit is found elsewhere (different branch or different item) -> still create a new unit in this branch (allow duplicates across branches).
// - If neither engine nor chassis provided -> still create an anonymous unit (null engine/chassis) so the sale can proceed.
//   This mirrors historical data gaps and ensures we don't block the sale seeding.
async function ensureInventoryUnitForSale(prisma, branchId, item, row, dateSold) {
  const eng = (row.engine || row.engine_no || '').trim();
  const chs = (row.chassis || row.chassis_no || '').trim();
  const color = (row.color || null);

  // If a matching unit exists in THIS branch and for THIS item and is available, just reuse it.
  if (eng || chs) {
    const inBranch = await prisma.vehicle_units.findFirst({
      where: {
        OR: [
          eng ? { engine_no: eng } : undefined,
          chs ? { chassis_no: chs } : undefined
        ].filter(Boolean),
        inventory: { branch_id: branchId, item_id: item.id }
      },
      include: { inventory: true }
    });
    if (inBranch && (!inBranch.status || inBranch.status.toLowerCase() === 'available') && !inBranch.transferred) {
      return inBranch;
    }
    // If exists in other branches or not available here, we'll still proceed to create a new one in this branch.
  }

  // Look up pricing defaults from item
  const dbItem = await prisma.items.findFirst({ where: { id: item.id }, select: { srp: true, cost_of_purchase: true } });
  const srp = dbItem && dbItem.srp != null ? dbItem.srp : null;
  const cost = dbItem && dbItem.cost_of_purchase != null ? dbItem.cost_of_purchase : 0;

  // Create inventory movement and vehicle unit
  const inv = await prisma.inventory_movements.create({
    data: {
      branch_id: branchId,
      item_id: item.id,
      date_received: dateSold || new Date(),
      supplier_id: null,
      dr_no: row.dr_no || null,
      si_no: row.si_no || row.dr_no || null,
      cost: Number(cost) || 0,
      srp: srp != null ? Number(srp) : null,
      beginning_qty: 1,
      purchased_qty: 1,
      transferred_qty: 0,
      sold_qty: 0,
      ending_qty: 1,
      color: color || null,
      remarks: 'auto-added-for-sale'
    }
  });

  const vehicle = await prisma.vehicle_units.create({
    data: {
      inventory_id: inv.id,
      chassis_no: chs || null,
      engine_no: eng || null,
      unit_number: 1,
      status: 'available'
    },
    include: { inventory: true }
  });

  return vehicle;
}

// Returns true if a vehicle unit with the given engine or chassis number has already been sold
// by checking if any sales_items reference a vehicle_unit matching the identifiers.
async function isVehicleAlreadySold(prisma, engineNo, chassisNo) {
  const eng = (engineNo || '').trim();
  const chs = (chassisNo || '').trim();
  if (!eng && !chs) return false;
  const sold = await prisma.vehicle_units.findFirst({
    where: {
      OR: [
        eng ? { engine_no: eng } : undefined,
        chs ? { chassis_no: chs } : undefined
      ].filter(Boolean),
      sales_items: { some: {} }
    },
    select: { id: true }
  });
  return !!sold;
}
