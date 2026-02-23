const fs = require('fs');
const path = process.argv[2];
if(!path){ console.error('Usage: node validate_values.js <sqlfile>'); process.exit(2); }
const s = fs.readFileSync(path,'utf8');
const start = s.indexOf('SELECT * FROM (VALUES');
if(start === -1){ console.error('VALUES block not found'); process.exit(2); }
const after = s.slice(start);
const open = after.indexOf('(');
// find the part between the first ( after VALUES and the closing ) AS t
const idxValuesStart = start + after.indexOf('(VALUES') + '(VALUES'.length;
// find the closing pattern ') AS t('
const closeIdx = s.indexOf(') AS t(', idxValuesStart);
if(closeIdx === -1){ console.error('Closing AS t( not found'); process.exit(2); }
const vals = s.slice(idxValuesStart, closeIdx);
// Trim leading whitespace and starting paren
const tuplesText = vals.trim();
// We'll parse tuples by scanning and splitting at top-level "),\n" occurrences
let tuples = [];
let cur = '';
let depth = 0;
let inQuote = false;
for(let i=0;i<tuplesText.length;i++){
  const ch = tuplesText[i];
  cur += ch;
  if(ch === "'"){
    // toggle quote unless escaped by two single quotes
    // handle SQL escaping by two consecutive single quotes
    const next = tuplesText[i+1];
    if(next === "'"){
      // escaped quote, consume next
      cur += next; i++;
      continue;
    }
    inQuote = !inQuote;
  }
  if(!inQuote){
    if(ch === '(') depth++;
    else if(ch === ')') depth--;
    // split when we encounter a closing paren followed by optional spaces, comma, newline
    if(ch === ')' && depth === 0){
      // check next non-space char is comma or end
      let j = i+1; while(j<tuplesText.length && /[\s]/.test(tuplesText[j])) j++;
      if(tuplesText[j] === ','){
        tuples.push(cur.trim());
        cur = '';
        // skip the comma
        i = j; 
      } else {
        tuples.push(cur.trim());
        cur = '';
      }
    }
  }
}
console.log('Found', tuples.length, 'tuples');
for(let k=0;k<tuples.length;k++){
  const t = tuples[k];
  // count top-level commas inside tuple (i.e., fields = commas+1)
  let fields = 0;
  inQuote = false; depth = 0; let commacount = 0;
  for(let i=0;i<t.length;i++){
    const ch = t[i];
    if(ch === "'"){
      const next = t[i+1];
      if(next === "'"){ i++; continue; }
      inQuote = !inQuote;
    }
    if(!inQuote){
      if(ch === ',') commacount++;
    }
  }
  fields = commacount + 1;
  console.log(k+1, 'fields=', fields, 'tuple=', t.slice(0,80).replace(/\n/g,' ')+ (t.length>80?'...':''));
}
