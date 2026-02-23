#!/usr/bin/env node
const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const countRes = await client.query('SELECT count(*)::int AS c FROM inventory_movements WHERE branch_id = $1', [17]);
    const count = countRes.rows[0].c;
    const unitsRes = await client.query(`SELECT v.id, v.engine_no, v.chassis_no, im.date_received, im.remarks, i.item_no FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id JOIN items i ON i.id = im.item_id WHERE im.branch_id = $1 ORDER BY v.id`, [17]);
    console.log('inventory_movements count for branch_id=17:', count);
    console.log('vehicle_units for branch_id=17:');
    console.log(JSON.stringify(unitsRes.rows, null, 2));
  }catch(e){
    console.error(e.message || e);
    process.exit(1);
  }finally{
    await client.end();
  }
})();
