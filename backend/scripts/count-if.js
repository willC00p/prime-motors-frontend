const fs = require('fs');
const s = fs.readFileSync('backend/db/seed_tuguegarao_inventory.sql','utf8');
const ifCount = (s.match(/\bIF\b/g)||[]).length;
const endIfCount = (s.match(/END IF;/g)||[]).length;
console.log('IF count:', ifCount);
console.log('END IF; count:', endIfCount);
