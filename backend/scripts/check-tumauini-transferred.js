const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const res = await client.query(`
      SELECT v.id, v.engine_no, v.chassis_no, v.transferred, b.name AS branch, im.remarks
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%tumauini%'
      ORDER BY v.id
      LIMIT 200
    `);
    console.table(res.rows);
  }catch(e){console.error(e);} finally{await client.end();}
})();
