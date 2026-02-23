const fs = require('fs');
const path = require('path');
const p = path.join(__dirname,'..','db','seed_cauayan_inventory.sql');
let sql = fs.readFileSync(p,'utf8');
const m = sql.match(/(SELECT \* FROM \(VALUES)([\s\S]*?)(\) AS t\((.*?)\))/i);
if(!m){ console.error('VALUES block not found'); process.exit(2); }
const headerCols = m[4].split(',').map(s=>s.trim());
const valuesText = m[2].trim();
const tuples = valuesText.split(/\),\s*\(/g).map(t=>t.replace(/^\(|\)$/g,'').trim());
function splitTuple(t){
  let inQuote=false; let parts=[]; let cur='';
  for(let i=0;i<t.length;i++){
    const ch = t[i];
    if(ch === "'"){
      if(inQuote && t[i+1]==="'") { cur += "''"; i++; continue; }
      inQuote = !inQuote; cur += ch; continue;
    }
    if(ch === ',' && !inQuote){ parts.push(cur.trim()); cur=''; continue; }
    cur += ch;
  }
  if(cur.length) parts.push(cur.trim());
  return parts;
}
let fixedTuples = [];
for(let i=0;i<tuples.length;i++){
  let t = tuples[i];
  // skip comment-only tuple lines (if any)
  if(t.startsWith('--')){ continue; }
  const parts = splitTuple(t);
  if(parts.length !== headerCols.length){
    // pad with NULLs before the last item (remarks) until lengths match
    const last = parts.pop();
    while(parts.length < headerCols.length - 1){ parts.push('NULL'); }
    parts.push(last);
  }
  fixedTuples.push('(' + parts.join(', ') + ')');
}
const newValues = '\n      ' + fixedTuples.join(',\n      ') + '\n    ';
const newSql = sql.replace(m[2], newValues);
fs.writeFileSync(p, newSql,'utf8');
console.log('Fixed', fixedTuples.length, 'tuples to have', headerCols.length, 'columns');
