const { Client } = require('pg');
const args = process.argv.slice(2);

(async () => {
  const runDelete = args.includes('--execute') || process.env.PURGE_ROXAS === '1' || process.env.PURGE_ROXAS === 'true';
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    const branchesRes = await client.query("SELECT id, name FROM branches WHERE name ILIKE '%roxas%'");
    if (branchesRes.rows.length === 0) {
      console.log('No branch found with name matching "roxas"');
      await client.end();
      process.exit(0);
    }

    for (const br of branchesRes.rows) {
      console.log(`\nBranch found: id=${br.id}, name=${br.name}`);
      const invCountRes = await client.query('SELECT COUNT(*)::int AS cnt FROM inventory_movements WHERE branch_id = $1', [br.id]);
      const invCount = invCountRes.rows[0].cnt;
      const vuCountRes = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1`,
        [br.id]
      );
      const vuCount = vuCountRes.rows[0].cnt;

      console.log(`Inventory movements: ${invCount}`);
      console.log(`Vehicle units:     ${vuCount}`);

      const sampleInv = await client.query('SELECT id, item_id, date_received, remarks, created_at FROM inventory_movements WHERE branch_id = $1 ORDER BY created_at DESC LIMIT 20', [br.id]);
      if (sampleInv.rowCount > 0) {
        console.log('\nSample inventory_movements (up to 20):');
        console.table(sampleInv.rows.map(r => ({ id: r.id, item_id: r.item_id, date_received: r.date_received ? r.date_received.toISOString().slice(0,10) : null, remarks: r.remarks, created_at: r.created_at })));
      }

      const sampleVu = await client.query(
        `SELECT v.id, v.engine_no, v.chassis_no, v.transferred, v.created_at, im.id AS inventory_id
         FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id
         WHERE im.branch_id = $1 ORDER BY v.created_at DESC LIMIT 50`,
        [br.id]
      );
      if (sampleVu.rowCount > 0) {
        console.log('\nSample vehicle_units (up to 50):');
        console.table(sampleVu.rows.map(r => ({ id: r.id, engine_no: r.engine_no, chassis_no: r.chassis_no, transferred: r.transferred, inventory_id: r.inventory_id, created_at: r.created_at })));
      }

      if (!runDelete) {
        console.log('\nDRY RUN: No destructive action taken. To actually delete these rows, re-run with:');
        console.log('  PowerShell: $env:PURGE_ROXAS = "1"; npx --yes --prefix backend node backend/scripts/purge-roxas.js');
        console.log('  OR: node backend/scripts/purge-roxas.js --execute');
        continue;
      }

      console.log('\nStarting transaction to purge Roxas data...');
      await client.query('BEGIN');
      // Delete vehicle_units for inventory_movements under the branch
      const deleteVUR = await client.query(
        `DELETE FROM vehicle_units v USING inventory_movements im WHERE v.inventory_id = im.id AND im.branch_id = $1 RETURNING v.id`,
        [br.id]
      );
      const deletedVU = deleteVUR.rowCount;

      // Delete the inventory_movements themselves
      const deleteInvR = await client.query('DELETE FROM inventory_movements WHERE branch_id = $1 RETURNING id', [br.id]);
      const deletedInv = deleteInvR.rowCount;

      await client.query('COMMIT');
      console.log(`Deleted vehicle_units: ${deletedVU}`);
      console.log(`Deleted inventory_movements: ${deletedInv}`);

      // Optionally, if you want to also delete any orphaned items or suppliers we could add that here (commented by default)
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error during Roxas purge:', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
