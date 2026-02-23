#!/usr/bin/env node
// Runs all branch sales seeder scripts sequentially with shared env, summarizing results.
// Idempotency is handled within each seeder (skips existing DR/SI per branch).

const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');

// Load backend/.env if present so child processes inherit DATABASE_URL and friends
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const seeders = [
  'seed-kamias-sales.js',
  'seed-solana-sales.js',
  'seed-sta-mesa-sales.js',
  'seed-antipolo-sales.js',
  'seed-aurora-sales.js',
  'seed-roxas-sales.js',
  'seed-tuguegarao-sales.js',
  'seed-tumauini-sales.js',
  'seed-baggao-sales.js',
  'seed-gattaran-sales.js',
  'seed-ilagan-sales.js'
];

async function run() {
  const results = [];
  for (const file of seeders) {
    const abs = path.join(__dirname, file);
    if (!fs.existsSync(abs)) {
      console.warn('[WARN] Seeder not found, skipping:', file);
      results.push({ file, status: 'missing' });
      continue;
    }
    console.log(`\n==== Running ${file} ====`);
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [abs], {
        stdio: 'inherit',
        env: process.env,
      });
      child.on('close', (code) => resolve(code));
    });
    if (code === 0) {
      console.log('OK:', file);
      results.push({ file, status: 'ok' });
    } else {
      console.error('ERROR:', file, 'exit code', code);
      // continue to next
      results.push({ file, status: 'error', code });
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const err = results.filter(r => r.status === 'error').length;
  const missing = results.filter(r => r.status === 'missing').length;
  console.log('\nSales seeders summary:');
  console.log('OK:', ok, '| Errors:', err, '| Missing:', missing);
  if (err > 0 || missing > 0) {
    console.log('Details:', JSON.stringify(results, null, 2));
  }
}

run().catch((e) => {
  console.error('Fatal error running sales seeders:', e && e.message || e);
  process.exit(1);
});
