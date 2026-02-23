#!/usr/bin/env node
// Force-insert STA MESA rows even if same engine/chassis exist in other branches
// Behavior:
// - Parse seed_sta_mesa_inventory.sql for rows targeting 'STA MESA BRANCH'
// - For each row: if the engine_no OR chassis_no is NOT present in STA MESA (branch_id 17), insert a new inventory_movements + vehicle_units
// - Do not modify existing rows in other branches

const fs = require('fs');
const { Client } = require('pg');

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
      cur += ch;
    } else if(ch === ',' && !inQuote){
      tokens.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  if(cur.length) tokens.push(cur.trim());
  return tokens.map(t=>{ const m = t.match(/^'(.*)'$/s); return m ? m[1] : (t === 'NULL' ? null : t); });
}

(async()=>{
  const connectionString = process.env.DATABASE_URL;
  if(!connectionString){ console.error('Set DATABASE_URL in environment'); process.exit(2); }
  const client = new Client({ connectionString });
  await client.connect();
  const sql = fs.readFileSync('backend/db/seed_sta_mesa_inventory.sql','utf8');
  const lines = sql.split(/\r?\n/).filter(l=>l.includes("('STA MESA BRANCH'"));
  console.log('Found', lines.length, 'STA MESA tuples');

  let inserted = 0;
  for(const line of lines){
    const toks = parseTuple(line);
    // mapping from seed: branch(0), item_no(1), date_received(2), supplier(3), tin(4), dr_no(5), si_no(6), brand(7), model(8), color(9), engine_no(10), chassis_no(11), pnpc_status(12), beg_inv(13), purchased(14), transfer(15), sales(16), ending_inv(17), note_date(18), remarks(19)
    const item_no = toks[1] || null;
    const date_received_raw = toks[2] || null;
    const supplier = toks[3] || null;
    const tin = toks[4] || null;
    const dr_no = toks[5] || null;
    const si_no = toks[6] || null;
    const brand = toks[7] || null;
    const model = toks[8] || null;
    const color = toks[9] || null;
    const engine_no = toks[10] ? toks[10].trim() : null;
    const chassis_no = toks[11] ? toks[11].trim() : null;
  const beg_inv_raw = toks[13];
  const purchased_raw = toks[14];
  const ending_raw = toks[17];
  const beg_inv = (beg_inv_raw !== null && beg_inv_raw !== undefined && beg_inv_raw !== '' && !isNaN(Number(beg_inv_raw))) ? Number(beg_inv_raw) : 1;
  const purchased = (purchased_raw !== null && purchased_raw !== undefined && purchased_raw !== '' && !isNaN(Number(purchased_raw))) ? Number(purchased_raw) : 1;
  const ending_inv = (ending_raw !== null && ending_raw !== undefined && ending_raw !== '' && !isNaN(Number(ending_raw))) ? Number(ending_raw) : null;
    const remarks = toks[19] || null;

    // check if already exists in STA MESA branch (id 17)
    const existsInSta = await client.query(`SELECT v.id, im.id as inv_id FROM vehicle_units v JOIN inventory_movements im ON im.id=v.inventory_id WHERE im.branch_id = $1 AND (v.engine_no = $2 OR v.chassis_no = $3) LIMIT 1`, [17, engine_no, chassis_no]);
    if(existsInSta.rows.length > 0){
      // already present in STA MESA
      continue;
    }

    // find or create supplier
    let supplier_id = null;
    if(supplier && supplier.trim() !== ''){
      const needle = `%${supplier.split(' ')[0]}%`;
      const sup = await client.query('SELECT id FROM suppliers WHERE name ILIKE $1 LIMIT 1', [needle]).catch(()=>null);
      if(sup && sup.rows && sup.rows.length>0) supplier_id = sup.rows[0].id;
      else{
        const ins = await client.query('INSERT INTO suppliers (name, tin_number, created_at) VALUES ($1,$2,NOW()) RETURNING id', [supplier, tin]);
        supplier_id = ins.rows[0].id;
      }
    }

    // resolve item by model+brand then item_no, else create minimal
    let item_id = null;
    if(model){
      const needleBrand = `%${brand || ''}%`;
      const it = await client.query('SELECT id FROM items WHERE model ILIKE $1 AND brand ILIKE $2 LIMIT 1', [model, needleBrand]);
      if(it.rows.length>0) item_id = it.rows[0].id;
    }
    if(!item_id && item_no){
      const it2 = await client.query('SELECT id FROM items WHERE item_no ILIKE $1 LIMIT 1', [`%${item_no}%`]);
      if(it2.rows.length>0) item_id = it2.rows[0].id;
    }
    if(!item_id){
      const insItem = await client.query('INSERT INTO items (item_no, brand, model, color, created_at) VALUES ($1,$2,$3, ARRAY[$4], NOW()) RETURNING id', [item_no||'', brand||'', model||'', color||'']);
      item_id = insItem.rows[0].id;
    }

    // parse date
    let date_received = null;
    if(date_received_raw && date_received_raw.trim() !== ''){
      // try MM/DD/YYYY
      try{
        const d = new Date(date_received_raw);
        if(!isNaN(d.getTime())) date_received = d.toISOString().slice(0,10);
      }catch(e){}
    }

    // determine sold/transfer flags
    const sold_qty = (ending_inv !== null && ending_inv === 0) ? 1 : 0;
    const trans_qty = (remarks && remarks.trim() !== '' && !/CASH SALE/i.test(remarks)) ? 1 : 0;

    // cost and srp
    const costRes = await client.query('SELECT cost_of_purchase, srp FROM items WHERE id = $1', [item_id]);
    const costVal = costRes.rows[0] && (costRes.rows[0].cost_of_purchase || costRes.rows[0].srp) ? (costRes.rows[0].cost_of_purchase || costRes.rows[0].srp) : 0;
    const srpVal = costRes.rows[0] && costRes.rows[0].srp ? costRes.rows[0].srp : null;

    // insert
    try{
      await client.query('BEGIN');
      const invIns = await client.query(
        `INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
         VALUES ($1,$2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10, $11, $12, NULLIF($13,''), $14, $15, NOW()) RETURNING id`,
         [17, item_id, date_received, supplier_id, dr_no, si_no, costVal, beg_inv, purchased, trans_qty, sold_qty, ending_inv, color, srpVal, remarks]
      );
      const newInvId = invIns.rows[0].id;
      await client.query('INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at) VALUES ($1,$2,$3,1,NOW())', [newInvId, chassis_no, engine_no]);
      await client.query('COMMIT');
      inserted++;
      console.log('Inserted unit', engine_no || chassis_no, '-> inventory_id', newInvId);
    }catch(e){
      await client.query('ROLLBACK').catch(()=>{});
      console.error('Error inserting', engine_no, e.message || e);
    }
  }
  await client.end();
  console.log('Done. Inserted', inserted, 'new units into STA MESA BRANCH (id=17)');
})();
