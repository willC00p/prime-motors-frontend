require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT b.name AS branch,
             SUM(CASE WHEN v.status = 'available' AND COALESCE(v.transferred,false)=false THEN 1 ELSE 0 END)::int AS available,
             SUM(CASE WHEN v.status = 'sold' AND COALESCE(v.transferred,false)=false THEN 1 ELSE 0 END)::int AS sold,
             COUNT(*) FILTER (WHERE COALESCE(v.transferred,false)=false)::int AS total
      FROM branches b
      LEFT JOIN inventory_movements im ON im.branch_id = b.id
      LEFT JOIN vehicle_units v ON v.inventory_id = im.id
      GROUP BY b.name
      ORDER BY b.name;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error counting units by branch:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
