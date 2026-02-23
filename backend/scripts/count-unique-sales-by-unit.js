require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    // Overall unique units sold (by vehicle_unit_id / engine_no / chassis_no)
    const overall = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM sales) AS sales_rows,
        (SELECT COUNT(*)::int FROM sales_items) AS sales_items_rows,
        (SELECT COUNT(DISTINCT si.vehicle_unit_id)::int FROM sales_items si WHERE si.vehicle_unit_id IS NOT NULL) AS distinct_vehicle_units,
        (SELECT COUNT(DISTINCT v.engine_no)::int FROM sales_items si JOIN vehicle_units v ON v.id=si.vehicle_unit_id WHERE v.engine_no IS NOT NULL AND v.engine_no<>'') AS distinct_engines,
        (SELECT COUNT(DISTINCT v.chassis_no)::int FROM sales_items si JOIN vehicle_units v ON v.id=si.vehicle_unit_id WHERE v.chassis_no IS NOT NULL AND v.chassis_no<>'') AS distinct_chassis,
        (SELECT COUNT(*)::int FROM sales_items WHERE vehicle_unit_id IS NULL) AS items_without_vehicle
    `);

    // Per-branch unique units sold
    const perBranch = await client.query(`
      SELECT b.name AS branch,
             COUNT(DISTINCT v.id)::int AS unique_units_sold,
             COUNT(*) FILTER (WHERE si.vehicle_unit_id IS NULL)::int AS items_without_vehicle
      FROM sales_items si
      LEFT JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      LEFT JOIN inventory_movements im ON im.id = v.inventory_id
      LEFT JOIN branches b ON b.id = im.branch_id
      GROUP BY b.name
      ORDER BY b.name
    `);

    // List duplicates by vehicle unit across sales_items
    const duplicates = await client.query(`
      SELECT v.id AS vehicle_unit_id, v.engine_no, v.chassis_no, COUNT(*)::int AS dup_count
      FROM sales_items si JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      GROUP BY v.id, v.engine_no, v.chassis_no
      HAVING COUNT(*) > 1
      ORDER BY dup_count DESC, v.id
      LIMIT 50
    `);

    console.log(JSON.stringify({ overall: overall.rows[0], perBranch: perBranch.rows, duplicates: duplicates.rows }, null, 2));
  } catch (err) {
    console.error('count-unique-sales-by-unit failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
