const fs = require('fs');
const path = 'backend/db/seed_tuguegarao_inventory.sql';
const sql = fs.readFileSync(path,'utf8');
const pos = parseInt(process.argv[2]||'12832',10);
const start = Math.max(0, pos-120);
const end = Math.min(sql.length, pos+120);
console.log('file length:', sql.length);
console.log('showing chars', start, 'to', end);
console.log('--- snippet ---');
console.log(sql.slice(start,end));
// also show line/col
const before = sql.slice(0,pos);
const line = before.split('\n').length;
const col = before.split('\n').pop().length + 1;
console.log('--- location ---');
console.log(`pos=${pos} -> line ${line}, col ${col}`);
