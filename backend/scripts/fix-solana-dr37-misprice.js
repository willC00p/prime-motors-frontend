#!/usr/bin/env node
// Fix Solana mispriced MONARCH 125 sale with dr_no '37' from 50,000 to 46,000.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
function loadEnvFallback(){const p=path.join(__dirname,'..','.env');if(!fs.existsSync(p))return;const c=fs.readFileSync(p,'utf8');for(const line of c.split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);if(m)process.env[m[1]]=process.env[m[1]]||m[2];}}
(async()=>{
  loadEnvFallback();
  const client = new (require('pg').Client)({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    const br = await client.query("SELECT id FROM branches WHERE name ILIKE '%Solana%' LIMIT 1");
    if (!br.rows.length) throw new Error('Solana branch not found');
    const branchId = br.rows[0].id;
    const saleRes = await client.query(`
      SELECT s.id
      FROM sales s
      JOIN sales_items si ON si.sale_id = s.id
      JOIN items it ON it.id = si.item_id
      WHERE s.branch_id = $1 AND s.dr_no = '37' AND it.model = 'MONARCH 125'
      LIMIT 1
    `, [branchId]);
    if (!saleRes.rows.length) { console.log('No matching Solana MONARCH 125 dr_no 37 sale found.'); await client.query('ROLLBACK'); return; }
    const saleId = saleRes.rows[0].id;
    await client.query('UPDATE sales_items SET unit_price = 46000, amount = 46000 WHERE sale_id = $1', [saleId]);
    await client.query('UPDATE sales SET total_amount = 46000 WHERE id = $1', [saleId]);
    await client.query('COMMIT');
    console.log(JSON.stringify({ fixed_sale_id: saleId, new_amount: 46000 }, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Fix failed:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
