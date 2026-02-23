require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT
        SUM(CASE WHEN v.status = 'available' THEN 1 ELSE 0 END)::int AS available,
        SUM(CASE WHEN v.status = 'sold' THEN 1 ELSE 0 END)::int AS sold,
        SUM(CASE WHEN COALESCE(v.transferred, false) = true THEN 1 ELSE 0 END)::int AS transferred,
        COUNT(*)::int AS total_non_transferred
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      WHERE COALESCE(v.transferred, false) = false;
    `);
    const row = res.rows[0] || {};
  console.log(JSON.stringify(row, null, 2));
  } catch (err) {
    console.error('Error counting available units:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
