#!/usr/bin/env node
const { Client } = require('pg');
(async()=>{
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await c.connect();
    const res = await c.query("SELECT id, name FROM branches WHERE name ILIKE '%sta%' OR name ILIKE '%mesa%' ORDER BY id");
    console.log(JSON.stringify(res.rows, null, 2));
  }catch(e){
    console.error(e.message || e);
    process.exit(1);
  }finally{
    await c.end();
  }
})();
