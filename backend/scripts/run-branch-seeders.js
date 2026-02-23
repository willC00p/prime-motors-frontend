#!/usr/bin/env node
// Run branch inventory seeders (excluding Tuguegarao)
// Files executed (in order):
//  - seed_skygo_models.sql
//  - seed_kamias_inventory.sql
//  - seed_solana_inventory.sql
//  - seed_sta_mesa_inventory.sql

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFallback() {
  // try to read backend/.env if DATABASE_URL not set
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

(async()=>{
  loadEnvFallback();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set. Please set it in the environment or backend/.env');
    process.exit(2);
  }

  const files = [
    path.join('backend','db','seed_skygo_models.sql'),
    path.join('backend','db','seed_kamias_inventory.sql'),
    path.join('backend','db','seed_solana_inventory.sql'),
    path.join('backend','db','seed_sta_mesa_inventory.sql')
  ];

  const client = new Client({ connectionString });
  try {
    await client.connect();
    for (const f of files) {
      console.log('\n==== Running', f, '====');
      const sql = fs.readFileSync(f, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('OK:', f);
      } catch (e) {
        await client.query('ROLLBACK').catch(()=>{});
        console.error('ERROR running', f, e.message || e);
      }
    }

    // Simple verification: counts for branches and SKYGO items count
    const skygo = (await client.query("SELECT count(*)::int AS c FROM items WHERE brand='SKYGO'")).rows[0].c;
    const branches = (await client.query("SELECT id, name, (SELECT count(*) FROM inventory_movements im WHERE im.branch_id = b.id)::int AS inv_count FROM branches b WHERE name ILIKE '%Kamias%' OR name ILIKE '%Solana%' OR name ILIKE '%Sta. Mesa%' ORDER BY b.id")).rows;
    console.log('\nVerification:');
    console.log('SKYGO items count:', skygo);
    console.log('Branch inventory counts (Kamias/Solana/Sta. Mesa):');
    console.log(JSON.stringify(branches, null, 2));

  } catch (e) {
    console.error('Fatal error', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
