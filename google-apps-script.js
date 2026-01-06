/**
 * Employee Training Dashboard - Google Apps Script
 * This script serves data from Google Sheets to your React dashboard
 * Configured for "LMS completion" sheet
 */

// Configuration - Update these values for your sheet
const CONFIG = {
  // Main data sheet name (where your employee training data is)
  DATA_SHEET_NAME: 'LMS completion',
  
  // Store mapping sheet name (if you have store mapping data)
  STORE_MAPPING_SHEET_NAME: 'Store_Mapping',
  
  // CORS settings - add your frontend URL here
  ALLOWED_ORIGINS: [
    'http://localhost:3012',
    'http://localhost:3000',
    'http://localhost:3001',
    // Add your production domain here when deployed
    // 'https://yourdomain.com'
  ]
};

/**
 * Handle GET requests - serves the training data
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getData';
    
    switch (action) {
      case 'getData':
        return getTrainingData();
      case 'getStoreMapping':
        return getStoreMappingData();
      case 'health':
        return createResponse({ status: 'ok', timestamp: new Date().toISOString() });
      default:
        return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createErrorResponse(error.toString(), 500);
  }
}

/**
 * Handle POST requests (if needed for future updates)
 */
function doPost(e) {
  try {
    // Add POST handlers here if needed for data updates
    return createErrorResponse('POST not implemented yet', 501);
  } catch (error) {
    console.error('Error in doPost:', error);
    return createErrorResponse(error.toString(), 500);
  }
}

/**
 * Get training data from the main sheet
 */
function getTrainingData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.DATA_SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${CONFIG.DATA_SHEET_NAME}" not found. Please check the sheet name in CONFIG.`);
    }
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return createResponse({ data: [], message: 'No data found in sheet' });
    }
    
    // First row contains headers
    const headers = values[0].map(header => header.toString().trim());
    const data = [];
    
    // Convert rows to objects
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const record = {};
      
      headers.forEach((header, index) => {
        let value = row[index];
        
        // Clean up the data
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = value.toString().trim();
        }
        
        // Handle specific fields based on your LMS completion sheet columns
        if (header.toLowerCase().includes('completion_hours') || 
            header.toLowerCase().includes('course_completion_hours')) {
          record[header] = value ? parseFloat(value) : 0;
        } else if (header.toLowerCase().includes('progress') || 
                   header.toLowerCase().includes('course_progress')) {
          // Remove % sign and convert to number
          const numValue = parseFloat(value.toString().replace('%', ''));
          record[header] = isNaN(numValue) ? 0 : numValue;
        } else if (header.toLowerCase().includes('completion_status') || 
                   header.toLowerCase().includes('course_completion_status')) {
          record[header] = value === 'Completed' ? 'Completed' : 'Not Completed';
        } else if (header.toLowerCase().includes('date')) {
          // Handle date fields - ensure they're in proper format
          if (value && value !== '') {
            try {
              // Try to parse the date and format it consistently
              const dateObj = new Date(value);
              if (!isNaN(dateObj.getTime())) {
                record[header] = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
              } else {
                record[header] = value; // Keep original if can't parse
              }
            } catch (e) {
              record[header] = value; // Keep original if error
            }
          } else {
            record[header] = '';
          }
        } else if (header.toLowerCase().includes('months_to_expire')) {
          // Handle months to expire as number
          record[header] = value ? parseInt(value) : 0;
        } else {
          record[header] = value;
        }
      });
      
      // Only add non-empty rows
      if (Object.values(record).some(val => val !== '')) {
        data.push(record);
      }
    }
    
    // Check if Store ID column exists for merged data capability
    const hasStoreId = headers.some(header => 
      header.toLowerCase().replace(/\s+/g, '').includes('storeid') || 
      header.toLowerCase() === 'store id'
    );
    
    return createResponse({
      data: data,
      headers: headers,
      count: data.length,
      hasStoreId: hasStoreId,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting training data:', error);
    return createErrorResponse(`Error fetching data: ${error.toString()}`, 500);
  }
}

/**
 * Get store mapping data (if available)
 */
function getStoreMappingData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(CONFIG.STORE_MAPPING_SHEET_NAME);
    
    if (!sheet) {
      return createResponse({ 
        data: [], 
        message: `Store mapping sheet "${CONFIG.STORE_MAPPING_SHEET_NAME}" not found` 
      });
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length === 0) {
      return createResponse({ data: [], message: 'No store mapping data found' });
    }
    
    const headers = values[0].map(header => header.toString().trim());
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const record = {};
      
      headers.forEach((header, index) => {
        let value = row[index];
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = value.toString().trim();
        }
        record[header] = value;
      });
      
      if (Object.values(record).some(val => val !== '')) {
        data.push(record);
      }
    }
    
    return createResponse({
      data: data,
      headers: headers,
      count: data.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting store mapping data:', error);
    return createErrorResponse(`Error fetching store mapping: ${error.toString()}`, 500);
  }
}

/**
 * Create a successful response with CORS headers
 */
function createResponse(data) {
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
    
  // Add CORS headers
  return addCorsHeaders(response);
}

/**
 * Create an error response
 */
function createErrorResponse(message, statusCode = 500) {
  const errorData = {
    error: true,
    message: message,
    statusCode: statusCode,
    timestamp: new Date().toISOString()
  };
  
  const response = ContentService.createTextOutput(JSON.stringify(errorData))
    .setMimeType(ContentService.MimeType.JSON);
    
  return addCorsHeaders(response);
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response) {
  // In Apps Script, we can't set status codes or custom headers in the same way
  // But we can return the response with CORS-friendly content
  return response;
}

/**
 * Test function to verify the script works
 * Run this function in the Apps Script editor to test
 */
function testScript() {
  console.log('Testing Google Apps Script...');
  
  try {
    // Test getting training data
    const trainingResult = getTrainingData();
    console.log('Training data result:', trainingResult.getContent());
    
    // Test getting store mapping data
    const storeResult = getStoreMappingData();
    console.log('Store mapping result:', storeResult.getContent());
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Function to set up the script - run this once after pasting the code
 */
function setupScript() {
  console.log('Setting up Google Apps Script for LMS completion sheet...');
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  console.log('Spreadsheet name:', spreadsheet.getName());
  
  // List all sheets
  const sheets = spreadsheet.getSheets();
  console.log('Available sheets:');
  sheets.forEach(sheet => {
    console.log('- ' + sheet.getName());
  });
  
  // Check if required sheets exist
  const dataSheet = spreadsheet.getSheetByName(CONFIG.DATA_SHEET_NAME);
  const storeSheet = spreadsheet.getSheetByName(CONFIG.STORE_MAPPING_SHEET_NAME);
  
  console.log('LMS completion sheet found:', !!dataSheet);
  console.log('Store mapping sheet found:', !!storeSheet);
  
  if (dataSheet) {
    const range = dataSheet.getDataRange();
    console.log('LMS completion sheet has', range.getNumRows(), 'rows and', range.getNumColumns(), 'columns');
    
    if (range.getNumRows() > 0) {
      const headers = range.getValues()[0];
      console.log('Headers found:');
      headers.forEach((header, index) => {
        console.log(`${index + 1}. ${header}`);
      });
      
      // Verify expected columns are present
      const expectedColumns = [
        'employee_code', 'employee_name', 'email', 'employee_status', 'gender',
        'date_of_joining', 'department', 'designation', 'reporting_manager_code',
        'reporting_manager_name', 'course_category', 'course_name', 'course_type',
        'course_end_date', 'enrollment_status', 'course_completion_hours',
        'course_enrolment_date', 'course_completion_date', 'course_progress',
        'course_completion_status', 'refresher_requirement', 'recurrence_date',
        'refresher_status', 'months_to_expire', 'course_role', 'Store ID'
      ];
      
      const missingColumns = expectedColumns.filter(col => 
        !headers.some(header => header.toString().toLowerCase().trim() === col.toLowerCase())
      );
      
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing expected columns:', missingColumns);
      } else {
        console.log('✅ All expected columns are present!');
      }
    }
  } else {
    console.log('❌ Sheet "' + CONFIG.DATA_SHEET_NAME + '" not found!');
    console.log('Available sheets are:', sheets.map(s => s.getName()).join(', '));
  }
  
  console.log('Setup complete! You can now deploy this script as a web app.');
}