#!/usr/bin/env node
// Usage: node compute-branch-totals.js "Solana" (case-insensitive like)
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
  const nameLike = process.argv[2] || 'Solana';
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const br = await client.query('SELECT id, name FROM branches WHERE name ILIKE $1 LIMIT 1', ['%' + nameLike + '%']);
    if (br.rows.length === 0) { console.error('Branch not found for', nameLike); process.exit(2); }
    const { id: branchId, name } = br.rows[0];
    const tot = await client.query('SELECT COUNT(*)::int AS c, COALESCE(SUM(total_amount),0)::numeric(20,2) AS sum FROM sales WHERE branch_id = $1', [branchId]);
    const itemsSum = await client.query(`SELECT COALESCE(SUM(si.amount),0)::numeric(20,2) AS sum
      FROM sales_items si JOIN sales s ON s.id = si.sale_id WHERE s.branch_id = $1`, [branchId]);
    const byModel = await client.query(`SELECT it.model, COUNT(*)::int AS items, SUM(si.amount)::numeric(20,2) AS sum
      FROM sales_items si JOIN sales s ON s.id = si.sale_id JOIN items it ON it.id = si.item_id
      WHERE s.branch_id = $1 GROUP BY it.model ORDER BY it.model`, [branchId]);
    console.log(JSON.stringify({ branch: name, sales_count: tot.rows[0].c, sales_total_amount: tot.rows[0].sum, sales_items_amount_sum: itemsSum.rows[0].sum, byModel: byModel.rows }, null, 2));
  } finally { await client.end(); }
})();
