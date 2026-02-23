const { Client } = require('pg');
(async () => {
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const engines = ['1P57MJS1121607','1P57MJS1121652','1P57MJS1121618'];
    const res = await client.query(
      `SELECT v.id, v.engine_no, v.chassis_no, v.transferred, b.name as branch, im.created_at
       FROM vehicle_units v
       JOIN inventory_movements im ON im.id = v.inventory_id
       JOIN branches b ON b.id = im.branch_id
       WHERE v.engine_no = ANY($1)
       ORDER BY im.created_at DESC`,
      [engines]
    );
    console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('error', err);
    process.exit(1);
  }
})();
