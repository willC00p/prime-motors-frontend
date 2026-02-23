const { Client } = require('pg');
(async()=>{
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await c.connect();
    await c.query("DO $$ BEGIN IF 1=1 THEN RAISE NOTICE 'ok'; END IF; END $$;");
    console.log('DO test OK');
  }catch(e){
    console.error('DO test error', e.message || e);
    process.exit(1);
  }finally{
    await c.end();
  }
})();
