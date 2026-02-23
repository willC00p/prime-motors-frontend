const { Client } = require('pg');
(async () => {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const sql = `SELECT v.id AS vehicle_unit_id, v.engine_no, v.chassis_no, v.transferred, im.id AS inventory_id, b.name as branch, i.item_no, im.date_received, im.remarks, im.created_at
                 FROM vehicle_units v
                 JOIN inventory_movements im ON im.id = v.inventory_id
                 LEFT JOIN branches b ON b.id = im.branch_id
                 LEFT JOIN items i ON i.id = im.item_id
                 WHERE lower(coalesce(im.remarks, '')) LIKE $1
                 ORDER BY im.created_at DESC`;
    const res = await client.query(sql, ['%baggao%']);
    console.log(`Found ${res.rows.length} matching rows:`);
    console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  }
})();
