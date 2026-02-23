#!/usr/bin/env node
const fs = require('fs');
const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const sql = fs.readFileSync('backend/db/seed_sta_mesa_inventory.sql','utf8');
    const lines = sql.split(/\r?\n/).filter(l=>l.includes("('STA MESA BRANCH'"));
    console.log('Found', lines.length, 'lines with STA MESA BRANCH');
    const results = [];
    function parseTuple(line){
      const start = line.indexOf('(');
      const end = line.lastIndexOf(')');
      if(start === -1 || end === -1) return [];
      const body = line.slice(start+1, end);
      const tokens = [];
      let cur = '';
      let inQuote = false;
      for(let i=0;i<body.length;i++){
        const ch = body[i];
        if(ch === "'"){
          inQuote = !inQuote;
          cur += ch; // keep quotes for now
        } else if(ch === ',' && !inQuote){
          tokens.push(cur.trim()); cur = '';
        } else {
          cur += ch;
        }
      }
      if(cur.length) tokens.push(cur.trim());
      // strip surrounding single quotes from quoted tokens
      return tokens.map(t=>{
        const m = t.match(/^'(.*)'$/s);
        return m ? m[1] : (t === 'NULL' ? null : t);
      });
    }
    for(const line of lines){
      const toks = parseTuple(line);
      // engine_no at index 10 (0-based), chassis_no at 11
      const engine = toks[10] || null;
      const chassis = toks[11] || null;
      const e = engine ? engine.trim() : null;
      const c = chassis ? chassis.trim() : null;
      const existsEngine = e ? (await client.query('SELECT v.id AS vid, v.engine_no, im.branch_id FROM vehicle_units v JOIN inventory_movements im ON im.id=v.inventory_id WHERE v.engine_no=$1 LIMIT 1',[e])).rows[0] : null;
      const existsChassis = c ? (await client.query('SELECT v.id AS vid, v.chassis_no, im.branch_id FROM vehicle_units v JOIN inventory_movements im ON im.id=v.inventory_id WHERE v.chassis_no=$1 LIMIT 1',[c])).rows[0] : null;
      results.push({ engine:e, chassis:c, existsEngine: existsEngine ? { id: existsEngine.vid, branch_id: existsEngine.branch_id } : null, existsChassis: existsChassis ? { id: existsChassis.vid, branch_id: existsChassis.branch_id } : null });
    }
    console.log(JSON.stringify(results,null,2));
  }catch(e){console.error(e.message||e);process.exit(1);}finally{await client.end();}
})();
