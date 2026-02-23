#!/usr/bin/env node
// Count all sales and show a per-branch breakdown.
// Loads DATABASE_URL from backend/.env when not present.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFallback() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

(async () => {
  loadEnvFallback();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set. Please set it in environment or backend/.env');
    process.exit(2);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();

  const total = (await client.query('SELECT count(*)::int AS c FROM sales')).rows[0].c;
  const salesItems = (await client.query('SELECT count(*)::int AS c FROM sales_items')).rows[0].c;
  const distinctUnits = (await client.query(`SELECT COUNT(DISTINCT vehicle_unit_id)::int AS c FROM sales_items WHERE vehicle_unit_id IS NOT NULL`)).rows[0].c;
  const itemsWithoutVehicle = (await client.query(`SELECT COUNT(*)::int AS c FROM sales_items WHERE vehicle_unit_id IS NULL`)).rows[0].c;

    const byBranch = (
      await client.query(
        `SELECT b.id, b.name, COALESCE(count(s.id),0)::int AS count
         FROM branches b
         LEFT JOIN sales s ON s.branch_id = b.id
         GROUP BY b.id, b.name
         ORDER BY b.name`
      )
    ).rows;

    // Per-branch unique units sold (by engine/chassis via vehicle_units)
    const perBranchUnits = (
      await client.query(`
        SELECT b.name AS branch,
               COUNT(DISTINCT v.id)::int AS unique_units_sold,
               COUNT(*) FILTER (WHERE si.vehicle_unit_id IS NULL)::int AS items_without_vehicle
        FROM sales_items si
        LEFT JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        LEFT JOIN inventory_movements im ON im.id = v.inventory_id
        LEFT JOIN branches b ON b.id = im.branch_id
        GROUP BY b.name
        ORDER BY b.name
      `)
    ).rows;

    const result = { total_sales_rows: total, sales_items_rows: salesItems, distinct_units_sold: distinctUnits, items_without_vehicle: itemsWithoutVehicle, byBranch, perBranchUnits };
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Error counting sales:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
