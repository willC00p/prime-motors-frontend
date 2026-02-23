#!/usr/bin/env node
// Fix Kamias DR 0000011 vehicle unit chassis to LX8TDK8G3SB000711 (engine 1P57MJS1118535)
// This frees chassis LX8TDK8G1SB000917 for DR 0000012.

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
    await client.query('BEGIN');
    const br = await client.query("SELECT id FROM branches WHERE name ILIKE '%kamias%' LIMIT 1");
    if (br.rows.length === 0) throw new Error('Kamias branch not found');
    const branchId = br.rows[0].id;
    const sale = await client.query(`
      SELECT s.id
      FROM sales s
      WHERE s.branch_id = $1 AND s.dr_no = '0000011'
      LIMIT 1
    `, [branchId]);
    if (sale.rows.length === 0) throw new Error('Kamias sale DR 0000011 not found');
    const saleId = sale.rows[0].id;

    const si = await client.query(`
      SELECT si.id AS si_id, si.vehicle_unit_id
      FROM sales_items si
      WHERE si.sale_id = $1
      LIMIT 1
    `, [saleId]);
    if (si.rows.length === 0) throw new Error('Sales item for DR 0000011 not found');
    const { si_id, vehicle_unit_id } = si.rows[0];

    // Update vehicle_units to correct engine/chassis
    await client.query(`
      UPDATE vehicle_units
      SET engine_no = '1P57MJS1118535', chassis_no = 'LX8TDK8G3SB000711'
      WHERE id = $1
    `, [vehicle_unit_id]);

    await client.query('COMMIT');
    console.log(JSON.stringify({ sale_id: saleId, sales_item_id: si_id, vehicle_unit_id, new_engine: '1P57MJS1118535', new_chassis: 'LX8TDK8G3SB000711' }, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Fix failed:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
