#!/usr/bin/env node
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
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const br = await client.query("SELECT id FROM branches WHERE name ILIKE '%kamias%' LIMIT 1");
    const branchId = br.rows[0].id;
    const res = await client.query(`
      SELECT s.id, s.dr_no, to_char(s.date_sold, 'YYYY-MM-DD') as date_sold, it.model,
             v.engine_no, v.chassis_no
      FROM sales s
      JOIN sales_items si ON si.sale_id = s.id
      JOIN items it ON it.id = si.item_id
      LEFT JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      WHERE s.branch_id = $1 AND s.dr_no = '80'
      ORDER BY s.id
    `, [branchId]);
    console.table(res.rows);
  } finally {
    await client.end();
  }
})();
