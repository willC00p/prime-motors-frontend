require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    const queries = {
      total_sales: `SELECT COUNT(*)::int AS c FROM sales`,
      sales_with_items: `SELECT COUNT(*)::int AS c FROM sales s WHERE EXISTS (SELECT 1 FROM sales_items si WHERE si.sale_id = s.id)`,
      sales_without_items: `SELECT COUNT(*)::int AS c FROM sales s WHERE NOT EXISTS (SELECT 1 FROM sales_items si WHERE si.sale_id = s.id)`,
      with_dr_or_si: `SELECT COUNT(*)::int AS c FROM sales WHERE COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) IS NOT NULL`,
      null_dr_and_si: `SELECT COUNT(*)::int AS c FROM sales WHERE COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) IS NULL`,
  sales_items_total: `SELECT COUNT(*)::int AS c FROM sales_items`,
  sales_items_missing_vehicle: `SELECT COUNT(*)::int AS c FROM sales_items WHERE vehicle_unit_id IS NULL`,
      units_sold_distinct_vehicle: `SELECT COUNT(DISTINCT vehicle_unit_id)::int AS c FROM sales_items WHERE vehicle_unit_id IS NOT NULL`,
      units_sold_distinct_engine: `SELECT COUNT(DISTINCT v.engine_no)::int AS c FROM sales_items si JOIN vehicle_units v ON v.id = si.vehicle_unit_id WHERE v.engine_no IS NOT NULL AND v.engine_no <> ''`,
      units_sold_distinct_chassis: `SELECT COUNT(DISTINCT v.chassis_no)::int AS c FROM sales_items si JOIN vehicle_units v ON v.id = si.vehicle_unit_id WHERE v.chassis_no IS NOT NULL AND v.chassis_no <> ''`,
      unique_per_branch_drsi: `SELECT COUNT(*)::int AS c FROM (
        SELECT DISTINCT branch_id, COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) AS key
        FROM sales
        WHERE COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) IS NOT NULL
      ) t`,
      duplicate_groups: `SELECT branch_id, COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) AS key, COUNT(*)::int AS dup_count
        FROM sales
        WHERE COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,'')) IS NOT NULL
        GROUP BY branch_id, COALESCE(NULLIF(dr_no,'') , NULLIF(si_no,''))
        HAVING COUNT(*) > 1
        ORDER BY dup_count DESC, branch_id
      `,
      duplicate_groups_with_branch: `SELECT b.name AS branch, s.branch_id,
         COALESCE(NULLIF(s.dr_no,''), NULLIF(s.si_no,'')) AS key,
         COUNT(*)::int AS dup_count
       FROM sales s
       LEFT JOIN branches b ON b.id = s.branch_id
       WHERE COALESCE(NULLIF(s.dr_no,''), NULLIF(s.si_no,'')) IS NOT NULL
       GROUP BY b.name, s.branch_id, COALESCE(NULLIF(s.dr_no,''), NULLIF(s.si_no,''))
       HAVING COUNT(*) > 1
       ORDER BY dup_count DESC, b.name`,
      by_branch: `SELECT b.name AS branch, COUNT(*)::int AS sales
        FROM sales s LEFT JOIN branches b ON b.id = s.branch_id
        GROUP BY b.name ORDER BY b.name`,
      duplicates_by_vehicle: `SELECT v.id as vehicle_unit_id, v.engine_no, v.chassis_no, COUNT(*)::int AS dup_count
        FROM sales_items si JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        GROUP BY v.id, v.engine_no, v.chassis_no HAVING COUNT(*) > 1
        ORDER BY dup_count DESC, v.id LIMIT 50`
    };

    const results = {};
    for (const [k, sql] of Object.entries(queries)) {
      const r = await client.query(sql);
      results[k] = r.rows;
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
