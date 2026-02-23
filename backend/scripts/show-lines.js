const fs = require('fs');
const [start, len] = [parseInt(process.argv[2]||'116',10), parseInt(process.argv[3]||'30',10)];
const s = fs.readFileSync('backend/db/seed_tuguegarao_inventory.sql','utf8');
const lines = s.split(/\r?\n/);
for(let i=start-1;i<Math.min(lines.length, start-1+len); i++){
  console.log((i+1).toString().padStart(4,' ')+':', lines[i]);
}
