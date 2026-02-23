#!/usr/bin/env node
const { Client } = require('pg');
const id = process.argv[2];
if (!id) {
  console.error('Usage: node purge-branch-id.js <branch_id>');
  process.exit(2);
}
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try{
    const br = (await client.query('SELECT id,name FROM branches WHERE id=$1', [id])).rows[0];
    if(!br) { console.error('No branch with id', id); process.exit(1); }
    console.log('Target branch:', br);
    const cntRes = await client.query('SELECT count(*)::int AS c FROM inventory_movements WHERE branch_id = $1', [id]);
    const invCount = cntRes.rows[0].c;
    const blockingRes = await client.query(`SELECT count(DISTINCT v.id)::int AS blocking_count FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id JOIN sales_items s ON s.vehicle_unit_id = v.id WHERE im.branch_id = $1`, [id]);
    const blockingCount = blockingRes.rows[0].blocking_count;
    console.log('Inventory movements count:', invCount);
    console.log('Vehicle units referenced by sales_items (blocking):', blockingCount);
    if (invCount === 0) { console.log('Nothing to delete.'); process.exit(0); }
    if (blockingCount > 0) { console.log('Found blocking references; aborting.'); process.exit(0); }
    await client.query('BEGIN');
    const delResult = await client.query('DELETE FROM inventory_movements WHERE branch_id = $1 RETURNING id', [id]);
    await client.query('COMMIT');
    console.log(`Deleted ${delResult.rowCount} inventory_movements for branch id=${id}`);
  }catch(e){
    await client.query('ROLLBACK').catch(()=>{});
    console.error('Error:', e.message || e);
  }finally{ await client.end(); }
})();
