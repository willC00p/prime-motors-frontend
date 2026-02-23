const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try{
    const branch = (await client.query("SELECT id,name FROM branches WHERE name ILIKE '%gattaran%' LIMIT 1")).rows[0];
    if(!branch){
      console.log('No Gattaran branch found');
      return;
    }
    console.log('Branch:\n', branch);
    const mv = (await client.query(`SELECT COUNT(*)::int AS movements FROM inventory_movements WHERE branch_id = $1`, [branch.id])).rows[0];
    const units = (await client.query(`SELECT COUNT(*)::int AS units FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1`, [branch.id])).rows[0];
    const transferred = (await client.query(`SELECT COUNT(*)::int AS transferred FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1 AND v.transferred = true`, [branch.id])).rows[0];
    console.log('\nSummary for branch', branch.name);
    console.table({ movements: mv.movements, units: units.units, transferred: transferred.transferred });

    const recent = await client.query(`SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, im.date_received FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1 ORDER BY v.id DESC LIMIT 50`, [branch.id]);
    console.log('\nRecent units (up to 50):');
    console.table(recent.rows);
  }catch(e){ console.error(e); process.exit(1); } finally{ await client.end(); }
})();
