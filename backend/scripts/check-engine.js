const { Client } = require('pg');
const engine = process.argv[2];
if(!engine){
  console.error('Usage: node check-engine.js <ENGINE_NO>');
  process.exit(2);
}
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const res = await client.query(
      `SELECT v.id as vehicle_id, v.engine_no, v.chassis_no, v.transferred, im.id as inventory_id, im.date_received, im.ending_qty, im.remarks, b.name as branch_name, i.item_no
       FROM vehicle_units v
       JOIN inventory_movements im ON im.id = v.inventory_id
       JOIN branches b ON b.id = im.branch_id
       JOIN items i ON i.id = im.item_id
       WHERE v.engine_no = $1
          OR v.chassis_no = $1
          OR v.engine_no = regexp_replace($1, '\\s+', '', 'g')
          OR v.chassis_no = regexp_replace($1, '\\s+', '', 'g')
       LIMIT 10`,
      [engine]
    );
    if(res.rows.length === 0){
      console.log('No vehicle found for engine:', engine);
    } else {
      console.log(JSON.stringify(res.rows, null, 2));
    }
    await client.end();
  }catch(e){
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
