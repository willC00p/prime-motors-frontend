const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, '..', 'loan_sales_raw.json');
const raw = fs.readFileSync(rawPath, 'utf8');
const match = raw.match(/Content\s*:\s*([\s\S]*?)\n\s*RawContent\s*:/);
if (!match) {
  console.error('Preview head of file:\n', raw.slice(0, 300));
  throw new Error('Failed to locate Content block in loan_sales_raw.json');
}
const collapsed = match[1].replace(/\r?\n\s+/g, '').trim();
const jsonText = collapsed.replace(/,$/, '');
const data = JSON.parse(jsonText);

// quick branch id histogram
const branchCounts = new Map();
for (const row of data) {
  const key = row.branch_id;
  branchCounts.set(key, (branchCounts.get(key) || 0) + 1);
}

console.log('Total rows:', data.length);
console.log('Branch counts:', Array.from(branchCounts.entries()).sort((a, b) => a[0] - b[0]));

// Show sample row per branch id
for (const [branchId] of branchCounts.entries()) {
  const sample = data.find((r) => r.branch_id === branchId);
  console.log(`\nBranch ${branchId} sample:`, sample);
}
