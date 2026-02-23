const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    const branchesRes = await client.query("SELECT id, name FROM branches WHERE name ILIKE '%antipolo%'");
    if (branchesRes.rows.length === 0) {
      console.log('No branch found with name matching "antipolo"');
      await client.end();
      process.exit(0);
    }

    for (const br of branchesRes.rows) {
      console.log('\nBranch:\n', br);

      const invRes = await client.query(`SELECT im.id, im.item_id, im.date_received, im.remarks, im.created_at,
                (SELECT COUNT(*) FROM vehicle_units v WHERE v.inventory_id = im.id) AS total_units
         FROM inventory_movements im
         WHERE im.branch_id = $1
         ORDER BY im.date_received DESC NULLS LAST, im.created_at DESC
         LIMIT 200`, [br.id]);

      console.log('\nInventory movements (latest 200):', invRes.rowCount);
      if (invRes.rowCount === 0) {
        console.log('  No inventory movements for this branch.');
      } else {
        console.table(invRes.rows.map(r => ({ id: r.id, item_id: r.item_id, date_received: r.date_received ? r.date_received.toISOString().slice(0,10) : null, total_units: Number(r.total_units), remarks: r.remarks })));
      }

      const aggRes = await client.query(`SELECT
           COUNT(v.*) AS total_units,
           SUM(CASE WHEN v.transferred = true THEN 1 ELSE 0 END)::int AS transferred_units,
           SUM(CASE WHEN v.status IS NULL OR lower(v.status) = 'available' THEN 1 ELSE 0 END)::int AS available_units,
           SUM(CASE WHEN lower(v.status) = 'sold' THEN 1 ELSE 0 END)::int AS sold_units
         FROM vehicle_units v
         JOIN inventory_movements im ON im.id = v.inventory_id
         WHERE im.branch_id = $1`, [br.id]);

      const agg = aggRes.rows[0] || { total_units: 0, transferred_units: 0, available_units: 0, sold_units: 0 };
      console.log('\nSummary for branch', br.name + ':');
      console.table([{ total_units: Number(agg.total_units || 0), transferred_units: Number(agg.transferred_units || 0), available_units: Number(agg.available_units || 0), sold_units: Number(agg.sold_units || 0) }]);

      const emptyInv = await client.query(`SELECT im.id, im.item_id, im.date_received, im.remarks
         FROM inventory_movements im
         WHERE im.branch_id = $1
           AND NOT EXISTS (SELECT 1 FROM vehicle_units v WHERE v.inventory_id = im.id)
         ORDER BY im.created_at DESC
         LIMIT 50`, [br.id]);
      if (emptyInv.rowCount > 0) {
        console.log('\nInventory movements with ZERO vehicle units (up to 50):');
        console.table(emptyInv.rows.map(r => ({ id: r.id, item_id: r.item_id, date_received: r.date_received ? r.date_received.toISOString().slice(0,10) : null, remarks: r.remarks })));
      } else {
        console.log('\nNo inventory movements with zero vehicle units found (recent).');
      }

      if (Number(agg.total_units || 0) === 0) {
        console.log('\nNOTE: Branch inventory appears empty (0 vehicle units).');
      }
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error checking Antipolo inventory:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
