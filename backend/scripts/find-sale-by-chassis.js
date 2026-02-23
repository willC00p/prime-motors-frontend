require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const chassis = process.argv[2];
  if (!chassis) {
    console.error('Usage: node scripts/find-sale-by-chassis.js <CHASSIS_NO>');
    process.exit(2);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT s.id AS sale_id, s.dr_no, s.si_no, s.branch_id, b.name AS branch_name, 
             v.id AS vehicle_unit_id, v.engine_no, v.chassis_no,
             im.item_id, i.brand, i.model
      FROM sales_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN items i ON i.id = im.item_id
      JOIN branches b ON b.id = s.branch_id
      WHERE v.chassis_no = $1
    `, [chassis]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('find-sale-by-chassis failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
