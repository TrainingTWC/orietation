const fs = require('fs');

// Function to parse CSV line with proper quote handling
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read the CSV file
const csv = fs.readFileSync('c:/Users/TWC/Downloads/store-mappings-2025-10-27.csv', 'utf8');
const lines = csv.trim().split('\n');
const headers = parseCSVLine(lines[0]);

// Parse CSV records
const records = lines.slice(1).map(line => {
  const values = parseCSVLine(line);
  const record = {};
  headers.forEach((header, i) => {
    record[header.trim()] = values[i]?.trim() || '';
  });
  return record;
});

// Generate TypeScript content
const storeRecords = records.map(r => {
  const storeId = r['Store ID'];
  const storeName = r['Store Name'];
  const region = r['Region'];
  const am = r['AM'];
  const trainer = r['Trainer'];
  const rtm = r['Region training manager'];
  const elearning = r['E-Learning Specialist'];
  const trainingHead = r['Training Head'];
  const hrHead = r['HR Head'];
  
  return `    { "Store ID": "${storeId}", "location": "${storeName}", "Region": "${region}", "AM": "${am}", "Trainer": "${trainer}", "Regional Training Manager": "${rtm}", "E-Learning Specialist": "${elearning}", "Training Head": "${trainingHead}", "HR Head": "${hrHead}" }`;
}).join(',\n');

const tsContent = `import type { StoreRecord } from '../types';

// FIX: Standardized the casing for the "Region" field to ensure consistent data mapping and visualization.
// FIX: Removed unicode space characters from location names for better data integrity.
// FIX: Added role hierarchy columns for trainer, e-learning specialist, training head, and HR head access control
// FIX: Updated Area Manager mappings and added Regional Training Manager field for region-wide access control
export const storeMappingData: StoreRecord[] = [
${storeRecords}
]
`;

// Write the TypeScript file
fs.writeFileSync('data/storeMapping.ts', tsContent);
console.log(`Store mapping updated successfully with ${records.length} records!`);
