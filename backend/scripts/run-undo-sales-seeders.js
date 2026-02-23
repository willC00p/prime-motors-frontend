#!/usr/bin/env node
// Runs all branch sales undo scripts sequentially with shared env, summarizing results.

const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');

// Load backend/.env if present so child processes inherit DATABASE_URL and friends
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const undos = [
  'undo-kamias-sales.js',
  'undo-solana-sales.js',
  'undo-sta-mesa-sales.js',
  'undo-antipolo-sales.js',
  'undo-aurora-sales.js',
  'undo-roxas-sales.js',
  'undo-tuguegarao-sales.js',
  'undo-tumauini-sales.js',
  'undo-baggao-sales.js',
  'undo-gattaran-sales.js',
  'undo-ilagan-sales.js'
];

async function run() {
  const results = [];
  for (const file of undos) {
    const abs = path.join(__dirname, file);
    if (!fs.existsSync(abs)) {
      console.warn('[WARN] Undo script not found, skipping:', file);
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
      results.push({ file, status: 'error', code });
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const err = results.filter(r => r.status === 'error').length;
  const missing = results.filter(r => r.status === 'missing').length;
  console.log('\nSales undo summary:');
  console.log('OK:', ok, '| Errors:', err, '| Missing:', missing);
  if (err > 0 || missing > 0) {
    console.log('Details:', JSON.stringify(results, null, 2));
  }
}

run().catch((e) => {
  console.error('Fatal error running sales undos:', e && e.message || e);
  process.exit(1);
});
