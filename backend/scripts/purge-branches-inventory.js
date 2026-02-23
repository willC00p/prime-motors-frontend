#!/usr/bin/env node
// Purge inventory for specific branches (Solana, Kamias, Sta. Mesa)
// - Finds branches by fuzzy name match
// - Checks for vehicle_units referenced by sales_items (blocking references)
// - If no blocking refs, deletes inventory_movements for the branch (cascades to vehicle_units, sales_inventory)

const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set DATABASE_URL in environment before running.');
    process.exit(2);
  }

  const client = new Client({ connectionString });
  await client.connect();

  const branchNames = ['Solana', 'Kamias', 'Sta. Mesa'];

  for (const name of branchNames) {
    console.log('\n--- Processing branches matching:', name, '---');
    const branches = (await client.query("SELECT id, name FROM branches WHERE name ILIKE '%' || $1 || '%'", [name])).rows;
    if (branches.length === 0) {
      console.log('No branches found matching', name);
      continue;
    }

    for (const br of branches) {
      console.log(`Found branch: id=${br.id} name="${br.name}"`);

      // Count inventory_movements
      const cntRes = await client.query('SELECT count(*)::int AS c FROM inventory_movements WHERE branch_id = $1', [br.id]);
      const invCount = cntRes.rows[0].c;

      // Check vehicle_units under this branch for referenced sales_items
      const blockingRes = await client.query(
        `SELECT count(DISTINCT v.id)::int AS blocking_count
         FROM vehicle_units v
         JOIN inventory_movements im ON im.id = v.inventory_id
         JOIN sales_items s ON s.vehicle_unit_id = v.id
         WHERE im.branch_id = $1`,
        [br.id]
      );
      const blockingCount = blockingRes.rows[0].blocking_count;

      console.log('Inventory movements count:', invCount);
      console.log('Vehicle units referenced by sales_items (blocking):', blockingCount);

      if (invCount === 0) {
        console.log('Nothing to delete for this branch. Skipping.');
        continue;
      }

      if (blockingCount > 0) {
        console.log('Cannot purge this branch because some vehicle_units are referenced by sales_items.');
        console.log('You can inspect blocking rows with:');
        console.log(`  SELECT v.id, v.engine_no, v.chassis_no, s.id as sales_item_id FROM vehicle_units v JOIN inventory_movements im ON im.id=v.inventory_id JOIN sales_items s ON s.vehicle_unit_id=v.id WHERE im.branch_id = ${br.id};`);
        continue;
      }

      // Proceed to delete inventory_movements for this branch in a transaction
      try {
        await client.query('BEGIN');
        // Optionally record counts into a temp table or log before deleting. We'll grab affected IDs for reporting.
        const affectedInv = await client.query('SELECT id FROM inventory_movements WHERE branch_id = $1', [br.id]);
        const affectedIds = affectedInv.rows.map(r => r.id);

        const delResult = await client.query('DELETE FROM inventory_movements WHERE branch_id = $1 RETURNING id', [br.id]);
        await client.query('COMMIT');
        console.log(`Deleted ${delResult.rowCount} inventory_movements for branch id=${br.id}.`);
        if (affectedIds.length) console.log('Affected inventory ids (sample up to 20):', affectedIds.slice(0, 20).join(', '));
      } catch (e) {
        await client.query('ROLLBACK').catch(()=>{});
        console.error('Error deleting for branch', br.id, e.message || e);
      }
    }
  }

  await client.end();
  console.log('\nPurge script completed.');
}

main().catch(e=>{
  console.error('Fatal error', e);
  process.exit(1);
});
