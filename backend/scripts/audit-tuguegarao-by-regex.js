require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  const seedFile = path.join(__dirname, 'seed-tuguegarao-sales.js');
  const txt = fs.readFileSync(seedFile, 'utf8');
  const block = (txt.match(/const\s+rows\s*=\s*\[(.*)\];/s) || [])[1] || '';
  const re = /engine:\s*'([^']*)'[\s\S]*?chassis:\s*'([^']*)'/g;
  const pairs = [];
  let m;
  while ((m = re.exec(block))) {
    pairs.push({ engine: m[1].trim(), chassis: m[2].trim() });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const branch = await client.query("SELECT id FROM branches WHERE name ILIKE '%Tuguegarao%' LIMIT 1");
    const branchId = branch.rows[0].id;
    const missing = [];
    for(const p of pairs){
      const q = await client.query(`
        SELECT s.id FROM sales s
        JOIN sales_items si ON si.sale_id = s.id
        JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        WHERE s.branch_id = $1
          AND ( ( $2<>'' AND v.engine_no = $2 ) OR ( $3<>'' AND v.chassis_no = $3 ) )
        LIMIT 1
      `,[branchId, p.engine, p.chassis]);
      if(q.rows.length===0){ missing.push(p); }
    }
    console.log(JSON.stringify({ totalPairs: pairs.length, missingCount: missing.length, missing }, null, 2));
  }catch(e){
    console.error('audit-regex failed:', e.message);
    process.exit(1);
  }finally{ await client.end(); }
})();
