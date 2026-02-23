#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
function loadEnvFallback(){const p=path.join(__dirname,'..','.env');if(!fs.existsSync(p))return;const c=fs.readFileSync(p,'utf8');for(const line of c.split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);if(m)process.env[m[1]]=process.env[m[1]]||m[2];}}
(async()=>{loadEnvFallback();const client=new (require('pg').Client)({connectionString:process.env.DATABASE_URL});await client.connect();try{const res=await client.query(`
  SELECT id, brand, model, srp, cost_of_purchase FROM items
  WHERE model IN ('MONARCH 125','MONARCH 175','P1 BOLT 150','M1 LANCE 150','OMNI 125')
  ORDER BY model
`);
console.table(res.rows);
} finally {await client.end();}})();