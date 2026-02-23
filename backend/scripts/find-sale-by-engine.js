require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const engine = process.argv[2];
  if (!engine) { console.error('Usage: node scripts/find-sale-by-engine.js <ENGINE_NO>'); process.exit(2); }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const res = await client.query(`
      SELECT s.id AS sale_id, s.dr_no, s.branch_id, b.name AS branch_name,
             v.id AS vehicle_unit_id, v.engine_no, v.chassis_no,
             i.brand, i.model
      FROM sales_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN items i ON i.id = im.item_id
      JOIN branches b ON b.id = s.branch_id
      WHERE v.engine_no = $1
      LIMIT 5
    `,[engine]);
    console.log(JSON.stringify(res.rows, null, 2));
  }catch(e){ console.error('find-sale-by-engine failed:', e.message); process.exit(1);} finally{ await client.end(); }
})();
