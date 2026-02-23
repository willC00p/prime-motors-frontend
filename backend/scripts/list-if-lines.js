const fs = require('fs');
const s = fs.readFileSync('backend/db/seed_tuguegarao_inventory.sql','utf8');
const lines = s.split(/\r?\n/);
lines.forEach((l,i)=>{
  if(/\bIF\b/.test(l)) console.log(i+1, 'IF ->', l.trim());
  if(/END IF;/.test(l)) console.log(i+1, 'END IF ->', l.trim());
});
