#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
function loadEnvFallback(){const p=path.join(__dirname,'..','.env');if(!fs.existsSync(p))return;const c=fs.readFileSync(p,'utf8');for(const line of c.split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);if(m)process.env[m[1]]=process.env[m[1]]||m[2];}}
(async()=>{loadEnvFallback();const client=new (require('pg').Client)({connectionString:process.env.DATABASE_URL});await client.connect();try{const br=await client.query("SELECT id FROM branches WHERE name ILIKE '%Solana%' LIMIT 1");const bid=br.rows[0].id;const res=await client.query(`
  SELECT s.id as sale_id, s.dr_no, to_char(s.date_sold,'YYYY-MM-DD') as date_sold,
         si.amount, it.model
  FROM sales s
  JOIN sales_items si ON si.sale_id = s.id
  JOIN items it ON it.id = si.item_id
  WHERE s.branch_id = $1 AND it.model = 'MONARCH 125'
  ORDER BY s.date_sold, s.dr_no
`,[bid]);
console.table(res.rows);
} finally {await client.end();}})();