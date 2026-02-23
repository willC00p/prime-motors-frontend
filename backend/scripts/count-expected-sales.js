#!/usr/bin/env node
// Count how many sales should be created based on the seeders' rows arrays,
// without executing the seeders. Robust against comments and strings.

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

function findSeederFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /^seed-.*-sales\.js$/i.test(e.name))
    .map((e) => path.join(dir, e.name))
    .sort();
}

function extractRowsArraySource(src) {
  // Find the assignment to rows: const rows = [ ... ]; or let rows = [ ... ];
  const m = src.match(/\b(?:const|let)\s+rows\s*=\s*\[/);
  if (!m) return null;
  let i = m.index;
  // Move to first '['
  i = src.indexOf('[', i);
  if (i < 0) return null;
  let start = i;
  // Scan to matching closing ']' accounting for strings and comments
  let inStr = false;
  let strQ = '';
  let esc = false;
  let inLineComment = false;
  let inBlockComment = false;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    const n = src[j + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && n === '/') { inBlockComment = false; j++; }
      continue;
    }
    if (!inStr) {
      if (c === '/' && n === '/') { inLineComment = true; j++; continue; }
      if (c === '/' && n === '*') { inBlockComment = true; j++; continue; }
      if (c === '"' || c === '\'') { inStr = true; strQ = c; esc = false; continue; }
      if (c === '[') { depth++; }
      if (c === ']') {
        depth--;
        if (depth === 0) {
          const end = j;
          return src.slice(start, end + 1);
        }
      }
      continue;
    } else {
      // in string
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === strQ) { inStr = false; strQ = ''; continue; }
      continue;
    }
  }
  return null;
}

function countTopLevelObjectsInArray(srcArray) {
  // srcArray includes leading '[' and trailing ']'
  let inStr = false, strQ = '', esc = false;
  let inLineComment = false, inBlockComment = false;
  let bracketDepth = 0; // for [ ]
  let braceDepth = 0; // for { }
  let count = 0;
  for (let i = 0; i < srcArray.length; i++) {
    const c = srcArray[i];
    const n = srcArray[i + 1];
    if (inLineComment) { if (c === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (c === '*' && n === '/') { inBlockComment = false; i++; } continue; }
    if (!inStr) {
      if (c === '/' && n === '/') { inLineComment = true; i++; continue; }
      if (c === '/' && n === '*') { inBlockComment = true; i++; continue; }
      if (c === '"' || c === '\'') { inStr = true; strQ = c; esc = false; continue; }
      if (c === '[') { bracketDepth++; continue; }
      if (c === ']') { bracketDepth--; continue; }
      if (c === '{') {
        // Count only objects directly within the top-level array: bracketDepth === 1 and braceDepth === 0
        if (bracketDepth === 1 && braceDepth === 0) count++;
        braceDepth++; continue;
      }
      if (c === '}') { if (braceDepth > 0) braceDepth--; continue; }
      continue;
    } else {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === strQ) { inStr = false; strQ = ''; continue; }
      continue;
    }
  }
  return count;
}

function main() {
  const files = findSeederFiles(SCRIPTS_DIR);
  let total = 0;
  const perFile = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const arrSrc = extractRowsArraySource(src);
    if (!arrSrc) { perFile.push({ file: path.basename(file), count: 0, note: 'rows array not found' }); continue; }
    const c = countTopLevelObjectsInArray(arrSrc);
    total += c;
    perFile.push({ file: path.basename(file), count: c });
  }
  console.table(perFile);
  console.log('TOTAL_EXPECTED_SALES:', total);
}

main();
