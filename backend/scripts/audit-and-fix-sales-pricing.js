#!/usr/bin/env node
// Audit and fix pricing fields:
// - inventory_movements: set srp/cost when missing/zero from items defaults
// - sales_items: set unit_price/amount when zero from linked inventory.srp or items.srp
// - sales: recompute total_amount from sum(sales_items.amount)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInventoryFromItems() {
  // Find inventory rows with missing/zero srp or cost, and items have values
  const invs = await prisma.inventory_movements.findMany({
    where: {
      OR: [
        { srp: null },
        { srp: { equals: 0 } },
        { cost: { equals: 0 } },
      ]
    },
    select: { id: true, item_id: true, srp: true, cost: true }
  });
  let updated = 0;
  for (const inv of invs) {
    const item = await prisma.items.findUnique({
      where: { id: inv.item_id },
      select: { srp: true, cost_of_purchase: true }
    });
    if (!item) continue;
    const patch = {};
    if ((inv.srp === null || Number(inv.srp) === 0) && item.srp != null) patch.srp = Number(item.srp);
    if (Number(inv.cost) === 0 && item.cost_of_purchase != null) patch.cost = Number(item.cost_of_purchase);
    if (Object.keys(patch).length) {
      await prisma.inventory_movements.update({ where: { id: inv.id }, data: patch });
      updated++;
    }
  }
  return updated;
}

async function fixSalesItemsFromInventoryOrItems() {
  // Identify sales_items with zero pricing
  const sitems = await prisma.sales_items.findMany({
    where: {
      OR: [
        { unit_price: { equals: 0 } },
        { amount: { equals: 0 } }
      ]
    },
    select: { id: true, item_id: true, vehicle_unit_id: true }
  });
  let updated = 0;
  for (const si of sitems) {
    let price = null;
    if (si.vehicle_unit_id) {
      const vu = await prisma.vehicle_units.findUnique({
        where: { id: si.vehicle_unit_id },
        select: { inventory_id: true }
      });
      if (vu && vu.inventory_id) {
        const inv = await prisma.inventory_movements.findUnique({ where: { id: vu.inventory_id }, select: { srp: true } });
        if (inv && inv.srp != null) price = Number(inv.srp);
      }
    }
    if (price == null) {
      const it = await prisma.items.findUnique({ where: { id: si.item_id }, select: { srp: true } });
      if (it && it.srp != null) price = Number(it.srp);
    }
    if (price != null && price > 0) {
      await prisma.sales_items.update({ where: { id: si.id }, data: { unit_price: price, amount: price } });
      updated++;
    }
  }
  return updated;
}

async function recomputeSalesTotals() {
  // Recompute total_amount for all sales from their items
  const sales = await prisma.sales.findMany({ select: { id: true } });
  let updated = 0;
  for (const s of sales) {
    const items = await prisma.sales_items.findMany({ where: { sale_id: s.id }, select: { amount: true } });
    const total = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
    const current = await prisma.sales.findUnique({ where: { id: s.id }, select: { total_amount: true } });
    const curr = Number(current.total_amount || 0);
    if (Math.abs(curr - total) > 0.009) {
      await prisma.sales.update({ where: { id: s.id }, data: { total_amount: total } });
      updated++;
    }
  }
  return updated;
}

async function main() {
  const inv = await fixInventoryFromItems();
  const sitems = await fixSalesItemsFromInventoryOrItems();
  const sales = await recomputeSalesTotals();
  console.log(JSON.stringify({ inventory_fixed: inv, sales_items_fixed: sitems, sales_totals_recomputed: sales }, null, 2));
}

main()
  .catch((e) => { console.error('Audit/Fix failed:', e.message || e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
