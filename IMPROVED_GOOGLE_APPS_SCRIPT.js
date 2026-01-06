/**
 * IMPROVED LMS Training Data Google Apps Script
 * Handles data retrieval for the LMS Training Dashboard with proper CORS
 * Sheet name: LMS Training Data
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Deploy as web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Use the provided web app URL in your dashboard
 */

/**
 * Handles ALL HTTP requests (GET, POST, OPTIONS) for CORS compatibility
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function doOptions(e) {
  return handleRequest(e);
}

/**
 * Main request handler with improved CORS support
 */
function handleRequest(e) {
  try {
    console.log('LMS Training Data request received');
    
    // Create proper CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    };
    
    // Handle OPTIONS preflight request
    if (e && e.requestMethod === 'OPTIONS') {
      return ContentService
        .createTextOutput('')
        .setHeaders(headers);
    }
    
    // Get spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('LMS Training Data');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('LMS Training Data');
      setupLMSHeaders(sheet);
      
      // Return success response with empty data
      const response = {
        success: true,
        message: 'LMS Training Data sheet created successfully',
        data: [],
        timestamp: new Date().toISOString(),
        totalRecords: 0
      };
      
      return ContentService
        .createTextOutput(JSON.stringify(response))
        .setHeaders(headers);
    }
    
    // Check if sheet has data
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log('No LMS Training data found - sheet is empty');
      
      // Add sample data for testing
      addSampleLMSData(sheet);
      
      const response = {
        success: true,
        message: 'Sample LMS data added for testing',
        data: [],
        timestamp: new Date().toISOString(),
        totalRecords: 0
      };
      
      return ContentService
        .createTextOutput(JSON.stringify(response))
        .setHeaders(headers);
    }
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Get headers and data rows
    const headers_row = values[0];
    const dataRows = values.slice(1);
    
    console.log(`Found ${dataRows.length} LMS Training records`);
    
    // Convert to JSON format
    const trainingRecords = dataRows.map((row, index) => {
      const record = {};
      
      // Map each column value to the corresponding field
      headers_row.forEach((header, colIndex) => {
        let value = row[colIndex];
        
        // Clean up the value
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = value.toString().trim();
        }
        
        // Map headers to expected field names for LMS Training
        const headerStr = header.toString().trim();
        switch(headerStr) {
          case 'Employee Code':
          case 'employee_code':
            record.employee_code = value;
            break;
          case 'Employee Name':
          case 'employee_name':
            record.employee_name = value;
            break;
          case 'Email':
          case 'email':
            record.email = value;
            break;
          case 'Employee Status':
          case 'employee_status':
            record.employee_status = value;
            break;
          case 'Gender':
          case 'gender':
            record.gender = value;
            break;
          case 'Date of Joining':
          case 'date_of_joining':
            record.date_of_joining = value;
            break;
          case 'Department':
          case 'department':
            record.department = value;
            break;
          case 'Designation':
          case 'designation':
            record.designation = value;
            break;
          case 'Reporting Manager Code':
          case 'reporting_manager_code':
            record.reporting_manager_code = value;
            break;
          case 'Reporting Manager Name':
          case 'reporting_manager_name':
            record.reporting_manager_name = value;
            break;
          case 'Course Category':
          case 'course_category':
            record.course_category = value;
            break;
          case 'Course Name':
          case 'course_name':
            record.course_name = value;
            break;
          case 'Course Type':
          case 'course_type':
            record.course_type = value;
            break;
          case 'Course End Date':
          case 'course_end_date':
            record.course_end_date = value;
            break;
          case 'Enrollment Status':
          case 'enrollment_status':
            record.enrollment_status = value;
            break;
          case 'Course Completion Hours':
          case 'course_completion_hours':
            record.course_completion_hours = value;
            break;
          case 'Course Enrolment Date':
          case 'course_enrolment_date':
            record.course_enrolment_date = value;
            break;
          case 'Course Completion Date':
          case 'course_completion_date':
            record.course_completion_date = value;
            break;
          case 'Course Progress':
          case 'course_progress':
            // Handle percentage values
            let progress = value.toString().replace('%', '').trim();
            record.course_progress = progress;
            break;
          case 'Course Completion Status':
          case 'course_completion_status':
            record.course_completion_status = value;
            break;
          case 'Refresher Requirement':
          case 'refresher_requirement':
            record.refresher_requirement = value;
            break;
          case 'Recurrence Date':
          case 'recurrence_date':
            record.recurrence_date = value;
            break;
          case 'Refresher Status':
          case 'refresher_status':
            record.refresher_status = value;
            break;
          case 'Months to Expire':
          case 'months_to_expire':
            record.months_to_expire = value;
            break;
          case 'Course Role':
          case 'course_role':
            record.course_role = value;
            break;
          case 'Store ID':
          case 'store_id':
            record['Store ID'] = value;
            break;
          default:
            // Keep the original header name for unknown fields
            record[headerStr] = value;
            break;
        }
      });
      
      return record;
    });
    
    console.log('LMS Training data successfully processed');
    
    // Return success response with data
    const response = {
      success: true,
      message: 'LMS Training data retrieved successfully',
      data: trainingRecords,
      timestamp: new Date().toISOString(),
      totalRecords: trainingRecords.length
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setHeaders(headers);
      
  } catch (error) {
    console.error('Error in LMS Training script:', error);
    
    const errorResponse = {
      success: false,
      error: 'Failed to retrieve LMS Training data',
      message: error.toString(),
      timestamp: new Date().toISOString(),
      data: []
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      });
  }
}

/**
 * Sets up the correct headers for LMS Training Data sheet
 */
function setupLMSHeaders(sheet) {
  const headers = [
    'Employee Code',
    'Employee Name',
    'Email',
    'Employee Status',
    'Gender',
    'Date of Joining',
    'Department',
    'Designation',
    'Reporting Manager Code',
    'Reporting Manager Name',
    'Course Category',
    'Course Name',
    'Course Type',
    'Course End Date',
    'Enrollment Status',
    'Course Completion Hours',
    'Course Enrolment Date',
    'Course Completion Date',
    'Course Progress',
    'Course Completion Status',
    'Refresher Requirement',
    'Recurrence Date',
    'Refresher Status',
    'Months to Expire',
    'Course Role',
    'Store ID'
  ];
  
  // Set headers in the first row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#2563eb');
  headerRange.setFontColor('white');
  headerRange.setHorizontalAlignment('center');
  
  // Freeze the header row
  sheet.setFrozenRows(1);
  
  console.log('LMS Training headers set up successfully');
}

/**
 * Adds sample data for testing (optional)
 */
function addSampleLMSData(sheet) {
  const sampleData = [
    [
      'EMP001', 'John Smith', 'john.smith@company.com', 'Active', 'Male', 
      '2023-01-15', 'Sales', 'Sales Associate', 'MGR001', 'Jane Manager',
      'Safety', 'Fire Safety Training', 'Online', '2024-03-15', 'Enrolled',
      '2', '2024-01-10', '2024-01-15', '100%', 'Completed',
      'Yes', '2024-01-15', 'Complete', '11', 'Employee', 'STR001'
    ],
    [
      'EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Active', 'Female',
      '2023-02-20', 'Operations', 'Team Lead', 'MGR002', 'Mike Supervisor',
      'Compliance', 'Data Protection', 'Online', '2024-04-20', 'Enrolled',
      '3', '2024-02-01', '2024-02-10', '100%', 'Completed',
      'Yes', '2024-02-10', 'Complete', '10', 'Employee', 'STR002'
    ],
    [
      'EMP003', 'Robert Brown', 'robert.brown@company.com', 'Active', 'Male',
      '2023-03-10', 'IT', 'Developer', 'MGR003', 'Lisa Director',
      'Technical', 'Cybersecurity Basics', 'Online', '2024-05-10', 'Enrolled',
      '4', '2024-03-01', '2024-03-05', '100%', 'Completed',
      'Yes', '2024-03-05', 'Complete', '9', 'Employee', 'STR001'
    ]
  ];
  
  // Add sample data
  sampleData.forEach(row => {
    sheet.appendRow(row);
  });
  
  console.log('Sample LMS data added');
}

/**
 * Test function - call this to verify setup
 */
function testLMSScript() {
  console.log('Testing LMS Training script...');
  
  try {
    const testEvent = { requestMethod: 'GET' };
    const result = handleRequest(testEvent);
    const content = result.getContent();
    const parsed = JSON.parse(content);
    
    console.log('Test result:', parsed);
    
    if (parsed.success) {
      console.log('✅ LMS Script working correctly');
      console.log(`📊 Found ${parsed.totalRecords} records`);
    } else {
      console.log('❌ LMS Script has issues:', parsed.error);
    }
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Manual data clearing function (for admin use)
 */
function clearLMSData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('LMS Training Data');
  
  if (sheet) {
    sheet.clear();
    setupLMSHeaders(sheet);
    console.log('✅ LMS Training data cleared and headers reset');
  } else {
    console.log('❌ LMS Training Data sheet not found');
  }
}

/**
 * Get statistics about the data (for debugging)
 */
function getLMSStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('LMS Training Data');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return { 
      totalRecords: 0, 
      lastUpdate: 'No data',
      sheetExists: !!sheet 
    };
  }
  
  const data = sheet.getDataRange().getValues();
  const records = data.slice(1); // Remove header
  
  const stats = {
    totalRecords: records.length,
    lastUpdate: new Date().toISOString(),
    sheetExists: true,
    sampleRecord: records.length > 0 ? records[0] : null
  };
  
  console.log('LMS Stats:', stats);
  return stats;
}