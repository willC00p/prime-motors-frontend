const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2] ? 
  path.join(__dirname, '../../', process.argv[2]) : 
  path.join(__dirname, '../../Branch Sales Monitoring Report.xlsx');

const workbook = XLSX.readFile(filePath);
console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get the range of cells that contain data
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
console.log('Sheet Range:', range);

// Read with headers
const jsonWithHeaders = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  defval: null,
  raw: true
});

// Print first few rows
console.log('\nFirst 5 rows:');
jsonWithHeaders.slice(0, 5).forEach((row, i) => {
  console.log(`Row ${i}:`, row);
});
