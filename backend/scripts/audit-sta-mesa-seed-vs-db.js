require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseSeedRows(filePath){
  const txt = fs.readFileSync(filePath,'utf8');
  const m = txt.match(/const\s+rows\s*=\s*\[(.*)\];/s);
  if(!m) return [];
  const arrText = m[1];
  const objs = [];
  const parts = arrText.split(/\},\s*(?=\{|\n)/).map(p=>p.trim()).filter(Boolean);
  for(let p of parts){
    if(!p.endsWith('}')) p = p + '}';
    const get = (key)=>{
      const r = new RegExp(key+"\\s*:\\s*'([^']*)'","i").exec(p); return r? r[1].trim():'';
    };
    objs.push({
      dr_no: get('dr_no'),
      engine: get('engine'),
      chassis: get('chassis'),
      date: get('date'),
      brand: get('brand'),
      model: get('model')
    });
  }
  return objs;
}

(async () => {
  const seedFile = path.join(__dirname, 'seed-sta-mesa-sales.js');
  const rows = parseSeedRows(seedFile);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const branch = await client.query("SELECT id,name FROM branches WHERE name ILIKE '%Sta. Mesa%' LIMIT 1");
    if(branch.rows.length===0){ console.error('Branch not found'); process.exit(2);} 
    const branchId = branch.rows[0].id;

    const missing = [];
    for(const r of rows){
      const eng = (r.engine||'').trim();
      const chs = (r.chassis||'').trim();
      if(!eng && !chs){ continue; }
      const q = await client.query(`
        SELECT s.id, b.name AS branch
        FROM sales s
        JOIN sales_items si ON si.sale_id = s.id
        JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        JOIN inventory_movements im ON im.id = v.inventory_id
        JOIN branches b ON b.id = im.branch_id
        WHERE (
            ($1<>'' AND v.engine_no = $1) OR
            ($2<>'' AND v.chassis_no = $2)
          )
        LIMIT 1
      `,[eng, chs]);
      if(q.rows.length===0){ missing.push(r); }
    }

    console.log(JSON.stringify({ totalSeedRows: rows.length, missingCount: missing.length, missing }, null, 2));
  }catch(e){
    console.error('audit failed:', e.message);
    process.exit(1);
  }finally{
    await client.end();
  }
})();
