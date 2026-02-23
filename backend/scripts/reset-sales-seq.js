#!/usr/bin/env node
// Reset the sales.id sequence to 1 if the sales table is empty,
// otherwise set it to max(id)+1. Safe for Postgres.

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnvFallback() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

(async()=>{
  if (!process.env.DATABASE_URL) loadEnvFallback();
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Please set it in environment or backend/.env');
    process.exit(2);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const { rows: [{ c: count }] } = await client.query(`SELECT COUNT(*)::int AS c FROM sales`);
    if (count > 0) {
      const { rows: [{ max_id }] } = await client.query(`SELECT COALESCE(MAX(id), 0)::int AS max_id FROM sales`);
      const seqSql = `SELECT pg_get_serial_sequence('sales','id') AS seq`;
      const { rows: [{ seq }] } = await client.query(seqSql);
      if (!seq) throw new Error('Could not resolve sales id sequence name');
      await client.query('SELECT setval($1, $2, true)', [seq, max_id]);
      console.log(`Sales has ${count} rows. Sequence ${seq} set to ${max_id} (next will be ${max_id+1}).`);
    } else {
      const seqSql = `SELECT pg_get_serial_sequence('sales','id') AS seq`;
      const { rows: [{ seq }] } = await client.query(seqSql);
      if (!seq) throw new Error('Could not resolve sales id sequence name');
      await client.query('SELECT setval($1, 1, false)', [seq]);
      console.log(`Sales is empty. Sequence ${seq} reset to start at 1.`);
    }
  }catch(e){
    console.error('Failed to reset sales sequence:', e.message || e);
    process.exit(1);
  } finally { await client.end(); }
})();
