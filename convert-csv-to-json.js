/**
 * CSV to JSON Converter for LMS Training Data
 * Converts the complete CSV file to the required JSON format
 */

const fs = require('fs');
const path = require('path');

function convertCSVToJSON() {
  try {
    console.log('🔄 Starting CSV to JSON conversion...');
    
    // Read the CSV file
    const csvPath = './public/data/lms-completion.csv';
    const jsonPath = './public/data/lms-completion.json';
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath);
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`📊 Found ${lines.length} lines in CSV`);
    
    if (lines.length < 2) {
      console.error('❌ CSV file must have at least a header and one data row');
      return;
    }
    
    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    
    console.log('📋 Headers found:', headers.length);
    console.log('🔍 First 5 headers:', headers.slice(0, 5));
    
    // Convert each data row
    const jsonData = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        
        // Skip lines that don't have enough columns
        if (values.length < headers.length) {
          console.warn(`⚠️ Line ${i + 1} has ${values.length} columns, expected ${headers.length}`);
          errorCount++;
          continue;
        }
        
        // Create record object
        const record = {};
        
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j].trim();
          const value = values[j] ? values[j].trim() : '';
          
          // Map to the exact field names expected by the dashboard
          switch (header.toLowerCase()) {
            case 'employee_code':
            case 'employee code':
              record.employee_code = value;
              break;
            case 'employee_name':
            case 'employee name':
              record.employee_name = value;
              break;
            case 'email':
              record.email = value;
              break;
            case 'employee_status':
            case 'employee status':
              record.employee_status = value;
              break;
            case 'gender':
              record.gender = value;
              break;
            case 'date_of_joining':
            case 'date of joining':
              record.date_of_joining = value;
              break;
            case 'department':
              record.department = value;
              break;
            case 'designation':
              record.designation = value;
              break;
            case 'reporting_manager_code':
            case 'reporting manager code':
              record.reporting_manager_code = value;
              break;
            case 'reporting_manager_name':
            case 'reporting manager name':
              record.reporting_manager_name = value;
              break;
            case 'course_category':
            case 'course category':
              record.course_category = value;
              break;
            case 'course_name':
            case 'course name':
              record.course_name = value;
              break;
            case 'course_type':
            case 'course type':
              record.course_type = value;
              break;
            case 'course_end_date':
            case 'course end date':
              record.course_end_date = value;
              break;
            case 'enrollment_status':
            case 'enrollment status':
              record.enrollment_status = value;
              break;
            case 'course_completion_hours':
            case 'course completion hours':
              record.course_completion_hours = value;
              break;
            case 'course_enrolment_date':
            case 'course enrolment date':
              record.course_enrolment_date = value;
              break;
            case 'course_completion_date':
            case 'course completion date':
              record.course_completion_date = value;
              break;
            case 'course_progress':
            case 'course progress':
              record.course_progress = value;
              break;
            case 'course_completion_status':
            case 'course completion status':
              record.course_completion_status = value;
              break;
            case 'refresher_requirement':
            case 'refresher requirement':
              record.refresher_requirement = value;
              break;
            case 'recurrence_date':
            case 'recurrence date':
              record.recurrence_date = value;
              break;
            case 'refresher_status':
            case 'refresher status':
              record.refresher_status = value;
              break;
            case 'months_to_expire':
            case 'months to expire':
              record.months_to_expire = value;
              break;
            case 'course_role':
            case 'course role':
              record.course_role = value;
              break;
            case 'store id':
            case 'store_id':
              record['Store ID'] = value;
              break;
            default:
              // Keep any additional fields as-is
              record[header] = value;
              break;
          }
        }
        
        jsonData.push(record);
        processedCount++;
        
        // Progress indicator
        if (processedCount % 1000 === 0) {
          console.log(`⏳ Processed ${processedCount} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing line ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    // Write JSON file
    console.log('💾 Writing JSON file...');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    
    console.log('✅ Conversion completed successfully!');
    console.log(`📊 Total records processed: ${processedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📁 Output file: ${jsonPath}`);
    console.log(`📏 File size: ${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // Sample validation
    if (jsonData.length > 0) {
      console.log('🔍 Sample record:');
      console.log(JSON.stringify(jsonData[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

// Helper function to parse CSV lines properly (handles quotes and commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add the last field
  
  // Clean up quoted fields
  return result.map(field => {
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
      field = field.slice(1, -1);
    }
    return field;
  });
}

// Run the conversion
convertCSVToJSON();