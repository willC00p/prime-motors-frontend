const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync(path.join(__dirname,'..','db','seed_cauayan_inventory.sql'),'utf8');
const m = sql.match(/SELECT \* FROM \(VALUES([\s\S]*?)\) AS t\((.*?)\)/i);
if(!m){ console.error('VALUES block or AS t(...) not found'); process.exit(2); }
const valuesText = m[1].trim();
const cols = m[2].split(',').map(s=>s.trim());
console.log('Header column count:', cols.length, cols.join(','));
// split tuples by /\),\s*\(/ but keep first and last
const tuples = valuesText.split(/\),\s*\(/g).map(t=>t.replace(/^\(|\)$/g,'').trim());
console.log('Tuples found:', tuples.length);
for(let i=0;i<tuples.length;i++){
  const t = tuples[i];
  // naive split on commas that are outside quotes
  let inQuote = false; let parts = []; let cur = '';
  for(let j=0;j<t.length;j++){
    const ch = t[j];
    if(ch === "'"){
      // handle escaped single quotes by checking next char
      if(inQuote && t[j+1]==="'"){
        cur += "''"; j++; continue;
      }
      inQuote = !inQuote; cur += ch; continue;
    }
    if(ch === ',' && !inQuote){ parts.push(cur.trim()); cur=''; continue; }
    cur += ch;
  }
  if(cur.length) parts.push(cur.trim());
  if(parts.length !== cols.length){
    console.log('Mismatch at tuple', i+1, 'expected', cols.length, 'got', parts.length);
    console.log('Tuple preview:', parts.slice(0,30).join(' | '));
  }
}
console.log('Done');
