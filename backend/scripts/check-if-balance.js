const fs = require('fs');
const s = fs.readFileSync('backend/db/seed_tuguegarao_inventory.sql','utf8');
const lines = s.split(/\r?\n/);
let stack = 0;
for(let i=0;i<lines.length;i++){
  const l = lines[i];
  // crude: count occurrences of 'IF' that are not 'END IF'
  const trimmed = l.trim();
  if(/^END IF;/.test(trimmed) || trimmed.includes('END IF')){
    stack -= 1; 
    console.log(`line ${i+1} END IF -> stack=${stack}`);
  }
  if(/\bIF\b/.test(trimmed) && !/END IF/.test(trimmed)){
    stack += 1;
    console.log(`line ${i+1} IF -> stack=${stack} (${trimmed})`);
  }
}
console.log('FINAL stack:', stack);
