#!/usr/bin/env node
// Force Kamias sales_items unit_price/amount to inventory.srp or items.srp, then recompute sales totals.

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

async function main() {
  loadEnvFallback();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const br = await client.query("SELECT id, name FROM branches WHERE name ILIKE '%kamias%' LIMIT 1");
    if (br.rows.length === 0) throw new Error('Kamias branch not found');
    const branchId = br.rows[0].id;

    // Update sales_items to SRP
    const updateRes = await client.query(`
      WITH siq AS (
        SELECT si.id,
               COALESCE(inv.srp, it.srp) AS price
        FROM sales_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN items it ON it.id = si.item_id
        LEFT JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        LEFT JOIN inventory_movements inv ON inv.id = v.inventory_id
        WHERE s.branch_id = $1
      )
      UPDATE sales_items si
      SET unit_price = COALESCE(siq.price, si.unit_price),
          amount = COALESCE(siq.price, si.amount)
      FROM siq
      WHERE si.id = siq.id;
    `, [branchId]);

    // Recompute totals per sale
    const recomputeRes = await client.query(`
      WITH sums AS (
        SELECT si.sale_id, SUM(si.amount)::numeric(20,2) AS total
        FROM sales_items si
        GROUP BY si.sale_id
      )
      UPDATE sales s
      SET total_amount = COALESCE(sums.total, 0)
      FROM sums
      WHERE s.id = sums.sale_id AND s.branch_id = $1;
    `, [branchId]);

    console.log(JSON.stringify({ updated_sales_items: updateRes.rowCount, sales_totals_recomputed: recomputeRes.rowCount }, null, 2));
  } catch (e) {
    console.error('Fix failed:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
