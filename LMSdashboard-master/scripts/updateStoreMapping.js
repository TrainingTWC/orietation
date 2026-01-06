// Script to update storeMapping.ts with trainer role data from CSV
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '..', '..', 'store-mappings.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvData.split('\n').filter(line => line.trim());
const headers = lines[0].split(',');

// Read existing storeMapping.ts to preserve location and region data
const storeMappingPath = path.join(__dirname, '..', 'data', 'storeMapping.ts');
const existingMapping = fs.readFileSync(storeMappingPath, 'utf-8');

// Extract existing store data
const existingStores = new Map();
const storeMatches = existingMapping.matchAll(/\{ "Store ID": "(S\d+)", "location": "([^"]+)", "Region": "([^"]+)", "AM": "([^"]+)", "Trainer": "([^"]+)"[^}]*\}/g);
for (const match of storeMatches) {
  existingStores.set(match[1], {
    location: match[2],
    region: match[3],
    am: match[4]
  });
}

// Parse CSV and merge with existing data
const stores = [];
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');
  if (values.length >= 6) {
    const storeId = values[0].trim();
    const existing = existingStores.get(storeId);
    
    if (existing) {
      stores.push({
        storeId,
        location: existing.location,
        region: existing.region,
        am: existing.am,
        trainer: values[2].trim(),
        eLearning: values[3].trim(),
        trainingHead: values[4].trim(),
        hrHead: values[5].trim()
      });
    }
  }
}

// Generate TypeScript file content
let tsContent = `import type { StoreRecord } from '../types';

// FIX: Standardized the casing for the "Region" field to ensure consistent data mapping and visualization.
// FIX: Removed unicode space characters from location names for better data integrity.
// FIX: Added role hierarchy columns for trainer, e-learning specialist, training head, and HR head access control
export const storeMappingData: StoreRecord[] = [
`;

stores.forEach((store, index) => {
  tsContent += `    { "Store ID": "${store.storeId}", "location": "${store.location}", "Region": "${store.region}", "AM": "${store.am}", "Trainer": "${store.trainer}", "E-Learning Specialist": "${store.eLearning}", "Training Head": "${store.trainingHead}", "HR Head": "${store.hrHead}" }`;
  if (index < stores.length - 1) {
    tsContent += ',\n';
  } else {
    tsContent += '\n';
  }
});

tsContent += `]

`;

// Write the updated file
fs.writeFileSync(storeMappingPath, tsContent, 'utf-8');
console.log(`✅ Updated ${stores.length} stores in storeMapping.ts`);
