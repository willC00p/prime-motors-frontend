const fs = require('fs');
const { Client } = require('pg');
(async()=>{
  const file = process.argv[2] || 'backend/db/seed_tuguegarao_inventory_part2.sql';
  if(!fs.existsSync(file)){
    console.error('File not found:', file);
    process.exit(2);
  }
  const sql = fs.readFileSync(file,'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try{
    await client.connect();
    try{
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('DO block executed OK for', file);
    }catch(e){
      await client.query('ROLLBACK').catch(()=>{});
      console.error('Error executing', file);
      console.error('message:', e.message);
      console.error('code:', e.code);
      console.error('position:', e.position);
      console.error('routine:', e.routine);
      console.error('stack:', e.stack);
      process.exit(1);
    }
  }catch(e){ console.error(e); process.exit(2);} finally{ await client.end(); }
})();
