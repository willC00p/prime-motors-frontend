const fs = require('fs');
const { Client } = require('pg');
(async()=>{
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    const f = 'backend/db/seed_tuguegarao_inventory.sql';
    const sql = fs.readFileSync(f,'utf8');
    try{
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('OK');
    }catch(e){
      await client.query('ROLLBACK').catch(()=>{});
      console.error('Error details:');
      console.error('message:', e.message);
      console.error('code:', e.code);
      console.error('position:', e.position);
      console.error('routine:', e.routine);
      console.error('stack:', e.stack);
      console.error('full error object:', JSON.stringify(Object.getOwnPropertyNames(e).reduce((acc,k)=>{acc[k]=e[k];return acc},{}), null, 2));
    }
  }catch(e){ console.error(e);} finally{ await client.end(); }
})();
