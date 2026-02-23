#!/usr/bin/env node
// Compute counts and monetary totals for the Kamias branch
// Prints sales row count, sum(sales.total_amount), and sum(sales_items.amount) for cross-check.

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
    console.error('DATABASE_URL not set.');
    process.exit(2);
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Find branch id for Kamias just to be safe
    const br = await client.query("SELECT id, name FROM branches WHERE name ILIKE '%kamias%' LIMIT 1");
    if (br.rows.length === 0) {
      console.error('Kamias branch not found in branches table');
      process.exit(3);
    }
    const branch = br.rows[0];
    const branchId = branch.id;

    const salesCountRes = await client.query('SELECT COUNT(*)::int AS c FROM sales WHERE branch_id = $1', [branchId]);
    const salesCount = salesCountRes.rows[0].c;

    const totalAmountRes = await client.query('SELECT COALESCE(SUM(total_amount),0)::numeric(20,2) AS s FROM sales WHERE branch_id = $1', [branchId]);
    const totalAmount = totalAmountRes.rows[0].s;

    const itemsSumRes = await client.query(`SELECT COALESCE(SUM(si.amount),0)::numeric(20,2) AS s
      FROM sales_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.branch_id = $1`, [branchId]);
    const itemsSum = itemsSumRes.rows[0].s;

    console.log(JSON.stringify({ branch: branch.name, branchId, salesCount, total_sales_total_amount: totalAmount, sum_sales_items_amount: itemsSum }, null, 2));
  } catch (e) {
    console.error('Query failed:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
