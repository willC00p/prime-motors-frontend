#!/usr/bin/env node
// Run backend/db/seed_branches.sql idempotently using pg client
// Loads DATABASE_URL from backend/.env if not present

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
    console.error('DATABASE_URL not set. Set it in environment or backend/.env');
    process.exit(2);
  }

  const sqlFile = path.join(__dirname, '..', 'db', 'seed_branches.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('SQL file not found:', sqlFile);
    process.exit(3);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Running', sqlFile);
    const sql = fs.readFileSync(sqlFile, 'utf8');

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('OK: seed_branches applied');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('ERROR applying seed_branches.sql', e.message || e);
      process.exit(1);
    }

    const rows = (await client.query("SELECT id, name, address FROM branches WHERE name ILIKE 'Prime Motors %' ORDER BY name"))
      .rows;
    console.log('\nBranches summary (' + rows.length + ' rows):');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Fatal error', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
