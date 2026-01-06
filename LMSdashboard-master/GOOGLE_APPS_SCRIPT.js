/**
 * LMS Training Data Google Apps Script - COMPLETE VERSION
 * Handles data retrieval for the LMS Training Dashboard
 * Sheet name: LMS Training Data
 * 
 * IMPORTANT: This script needs to be deployed as a web app with:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * Functions:
 * 1. doGet() - Returns LMS Training data for the dashboard
 * 2. doOptions() - Handles CORS preflight requests
 * 3. setupTrainingHeaders() - Sets up the spreadsheet headers
 * 4. testTrainingScript() - Test function for debugging
 */

/**
 * Handles OPTIONS requests for CORS preflight
 */
function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
}

/**
 * Handles GET requests to return LMS Training data for the dashboard
 */
function doGet(e) {
  try {
    console.log('LMS Training Data request received');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('LMS Training Data');
    
    // If no sheet exists or it's empty, return empty array
    if (!sheet || sheet.getLastRow() <= 1) {
      console.log('No LMS Training data found');
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }
    
    // Get all data from the sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Remove header row
    const headers = values[0];
    const dataRows = values.slice(1);
    
    console.log(`Found ${dataRows.length} LMS Training records`);
    
    // Convert to JSON format expected by dashboard
    const trainingRecords = dataRows.map(row => {
      const record = {};
      
      // Map each column to the corresponding field
      headers.forEach((header, index) => {
        const value = row[index];
        
        // Map headers to expected field names for LMS Training
        switch(header) {
          case 'Employee Code':
            record.employee_code = value || '';
            break;
          case 'Employee Name':
            record.employee_name = value || '';
            break;
          case 'Email':
            record.email = value || '';
            break;
          case 'Employee Status':
            record.employee_status = value || '';
            break;
          case 'Gender':
            record.gender = value || '';
            break;
          case 'Date of Joining':
            record.date_of_joining = value || '';
            break;
          case 'Department':
            record.department = value || '';
            break;
          case 'Designation':
            record.designation = value || '';
            break;
          case 'Reporting Manager Code':
            record.reporting_manager_code = value || '';
            break;
          case 'Reporting Manager Name':
            record.reporting_manager_name = value || '';
            break;
          case 'Course Category':
            record.course_category = value || '';
            break;
          case 'Course Name':
            record.course_name = value || '';
            break;
          case 'Course Type':
            record.course_type = value || '';
            break;
          case 'Course End Date':
            record.course_end_date = value || '';
            break;
          case 'Enrollment Status':
            record.enrollment_status = value || '';
            break;
          case 'Course Completion Hours':
            record.course_completion_hours = parseFloat(value) || 0;
            break;
          case 'Course Enrolment Date':
            record.course_enrolment_date = value || '';
            break;
          case 'Course Completion Date':
            record.course_completion_date = value || '';
            break;
          case 'Course Progress':
            // Handle percentage values - remove % if present and convert to number
            const progressStr = value ? value.toString().replace('%', '') : '0';
            record.course_progress = parseFloat(progressStr) || 0;
            break;
          case 'Course Completion Status':
            record.course_completion_status = value === 'Completed' ? 'Completed' : 'Not Completed';
            break;
          case 'Refresher Requirement':
            record.refresher_requirement = value || '';
            break;
          case 'Recurrence Date':
            record.recurrence_date = value || '';
            break;
          case 'Refresher Status':
            record.refresher_status = value || '';
            break;
          case 'Months to Expire':
            record.months_to_expire = value || '';
            break;
          case 'Course Role':
            record.course_role = value || '';
            break;
          case 'Store ID':
            record['Store ID'] = value || '';
            break;
          default:
            // For all other fields, use the header as key
            if (value !== undefined && value !== null) {
              record[header] = value.toString();
            }
            break;
        }
      });
      
      return record;
    });
    
    console.log('LMS Training data successfully processed for dashboard');
    
    // Return the data as JSON
    return ContentService
      .createTextOutput(JSON.stringify(trainingRecords))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    console.error('Error retrieving LMS Training data:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Failed to retrieve LMS Training data', 
        message: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

/**
 * Sets up the header row for the LMS Training Data sheet
 */
function setupTrainingHeaders(sheet) {
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
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#0369a1'); // Blue background
  headerRange.setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  console.log('LMS Training Data sheet headers set up successfully');
}

/**
 * Test function to verify the script setup - creates sample data
 */
function testTrainingScript() {
  console.log('Testing LMS Training script setup...');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('LMS Training Data');
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('LMS Training Data');
    setupTrainingHeaders(sheet);
  }
  
  // Add sample data if sheet is empty
  if (sheet.getLastRow() <= 1) {
    const sampleData = [
      ['EMP001', 'John Smith', 'john.smith@company.com', 'Active', 'Male', '2023-01-15', 'Sales', 'Sales Associate', 'MGR001', 'Jane Manager', 'Safety', 'Fire Safety Training', 'Online', '2024-03-15', 'Enrolled', 2, '2024-01-10', '2024-01-15', '100%', 'Completed', 'Yes', '2024-01-15', 'Complete', '11', 'Employee', 'STR001'],
      ['EMP002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Active', 'Female', '2023-02-20', 'Operations', 'Team Lead', 'MGR002', 'Mike Supervisor', 'Compliance', 'Data Protection', 'Online', '2024-04-20', 'Enrolled', 3, '2024-02-01', '2024-02-10', '100%', 'Completed', 'Yes', '2024-02-10', 'Complete', '10', 'Employee', 'STR002'],
      ['EMP003', 'Robert Brown', 'robert.brown@company.com', 'Active', 'Male', '2023-03-10', 'IT', 'Developer', 'MGR003', 'Lisa Director', 'Technical', 'Cybersecurity Basics', 'Online', '2024-05-10', 'Enrolled', 4, '2024-03-01', '2024-03-05', '100%', 'Completed', 'Yes', '2024-03-05', 'Complete', '9', 'Employee', 'STR001']
    ];
    
    sampleData.forEach(row => {
      sheet.appendRow(row);
    });
  }
  
  // Test GET function
  const getResult = doGet({});
  console.log('GET Test result:', getResult.getContent());
  
  return 'Test completed successfully';
}

/**
 * Function to get LMS Training statistics (for debugging)
 */
function getTrainingStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('LMS Training Data');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return { totalRecords: 0, completedCourses: 0, departments: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const records = data.slice(1); // Remove header row
  
  const totalRecords = records.length;
  const completedCourses = records.filter(row => row[19] === 'Completed').length; // Course Completion Status
  const departments = [...new Set(records.map(row => row[6]).filter(dept => dept))]; // Department
  
  return {
    totalRecords,
    completedCourses,
    completionRate: Math.round((completedCourses / totalRecords) * 100),
    departments
  };
}

/**
 * Function to clear all LMS Training data (for testing purposes)
 */
function clearTrainingData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('LMS Training Data');
  
  if (sheet) {
    sheet.clear();
    setupTrainingHeaders(sheet);
    console.log('LMS Training data cleared and headers reset');
  }
}