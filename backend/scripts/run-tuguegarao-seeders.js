#!/usr/bin/env node
// Run Tuguegarao seeders (part 1 and part 2) using pg client to preserve DO $$ blocks
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

(async () => {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in environment or backend/.env');
    process.exit(2);
  }
  const client = new Client({ connectionString });
  const files = [
    path.join('backend','db','seed_tuguegarao_inventory.sql'),
    path.join('backend','db','seed_tuguegarao_inventory_part2.sql')
  ];
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

    // verification summary for Tuguegarao
    const branches = (await client.query("SELECT id,name FROM branches WHERE name ILIKE '%Tuguegarao%' ORDER BY id")).rows;
    console.log('\nTuguegarao branch rows found:', JSON.stringify(branches, null, 2));
    const invCount = (await client.query("SELECT count(*)::int AS c FROM inventory_movements im JOIN branches b ON b.id = im.branch_id WHERE b.name ILIKE '%Tuguegarao%'")).rows[0].c;
    console.log('Inventory movements in Tuguegarao branches:', invCount);
  } catch (e) {
    console.error('Fatal error running Tuguegarao seeders', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
