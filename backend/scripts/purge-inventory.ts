#!/usr/bin/env ts-node
import dotenv from 'dotenv';
import path from 'path';
import prisma from '../src/lib/prisma';

// Load env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/*
  Purges ONLY inventory-related transactional data:
  - inventory_movements
  - vehicle_units
  - sales_items links (reset unit status?) NO: we don't touch sales.
  - sales_inventory
  It does NOT delete models, items, suppliers, branches, users, sales records.
  After purge:
    * inventory_movements empty (identity reset)
    * vehicle_units empty (identity reset)
    * sales_inventory empty (identity reset)
    * Any vehicle_units referenced by sales_items and lto_registrations would become dangling; proactively null those FKs.
    * Optional: recalc sales totals? (Skipped – user said only inventory.)
*/

async function main() {
  try {
    console.log('[purge-inventory] Starting purge of inventory tables...');

    // Show counts before
    const [{ inv_before } = { inv_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS inv_before FROM inventory_movements`);
    const [{ unit_before } = { unit_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS unit_before FROM vehicle_units`);
    const [{ si_before } = { si_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS si_before FROM sales_inventory`);
    console.log('[purge-inventory] Pre-purge counts:', { inventory_movements: inv_before, vehicle_units: unit_before, sales_inventory: si_before });

    // Null out vehicle_unit_id references from sales_items and lto_registrations to avoid FK issues before deleting units
    console.log('[purge-inventory] Nulling vehicle_unit_id in sales_items and lto_registrations...');
    await prisma.$executeRawUnsafe(`UPDATE sales_items SET vehicle_unit_id = NULL WHERE vehicle_unit_id IS NOT NULL`);
    await prisma.$executeRawUnsafe(`UPDATE lto_registrations SET vehicle_unit_id = NULL WHERE vehicle_unit_id IS NOT NULL`);

    // Delete sales_inventory junctions
    console.log('[purge-inventory] Truncating sales_inventory (restart identity)...');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE sales_inventory RESTART IDENTITY`);

    // Delete vehicle_units (avoid TRUNCATE CASCADE to prevent wiping unrelated tables)
    console.log('[purge-inventory] Deleting all rows from vehicle_units and restarting identity...');
    await prisma.$executeRawUnsafe(`DELETE FROM vehicle_units`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS vehicle_units_id_seq RESTART WITH 1`);

    // Reset inventory_movements (delete then reset identity)
    console.log('[purge-inventory] Deleting all rows from inventory_movements and restarting identity...');
    await prisma.$executeRawUnsafe(`DELETE FROM inventory_movements`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS inventory_movements_id_seq RESTART WITH 1`);

    // Optionally clear related loan templates? (Not requested) – skipped.

    // Report counts after purge
    const [{ inv_count } = { inv_count: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS inv_count FROM inventory_movements`);
    const [{ unit_count } = { unit_count: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS unit_count FROM vehicle_units`);
    const [{ si_count } = { si_count: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS si_count FROM sales_inventory`);

    console.log('[purge-inventory] Completed. Post-purge counts:', { inventory_movements: inv_count, vehicle_units: unit_count, sales_inventory: si_count });
  } catch (err) {
    console.error('[purge-inventory] Failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
