const { Client } = require('pg');
(async () => {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const sql = `SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, b.name as branch, i.item_no, im.created_at
                 FROM vehicle_units v
                 JOIN inventory_movements im ON im.id = v.inventory_id
                 JOIN branches b ON b.id = im.branch_id
                 JOIN items i ON i.id = im.item_id
                 WHERE b.name ILIKE $1
                 ORDER BY im.created_at DESC
                 LIMIT 50`;
    const res = await client.query(sql, ['%Kamias%']);
    console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  }
})();
