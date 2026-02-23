const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const res = await client.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='vehicle_units' ORDER BY ordinal_position");
    console.log(res.rows);
  }catch(e){console.error(e);} finally{await client.end();}
})();
