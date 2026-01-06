// Configuration for Google Sheets Apps Script
const GOOGLE_SHEETS_CONFIG = {
  // Your deployed Google Apps Script web app URL (IMPROVED VERSION)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx30BwvNa8ytrOLRrOEZWbNQLeElEvU2QmuPl3dYQ1I6iACiIooe__6WdAsglxk514sUQ/exec',
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

export interface TrainingRecord {
  employee_code: string;
  employee_name: string;
  email: string;
  employee_status: string;
  gender: string;
  date_of_joining: string;
  department: string;
  designation: string;
  reporting_manager_code: string;
  reporting_manager_name: string;
  course_category: string;
  course_name: string;
  course_type: string;
  course_end_date: string;
  enrollment_status: string;
  course_completion_hours: string;
  course_enrolment_date: string;
  course_completion_date: string;
  course_progress: string;
  course_completion_status: string;
  refresher_requirement: string;
  recurrence_date: string;
  refresher_status: string;
  months_to_expire: string;
  course_role: string;
  'Store ID': string;
}

/**
 * Fetches training data from Google Sheets via Apps Script
 * @returns Promise<TrainingRecord[]> Array of training records
 */
export async function fetchTrainingDataFromGoogleSheets(): Promise<TrainingRecord[]> {
  let lastError: Error | null = null;
  
  // Check if Apps Script URL is configured
  if (GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
    throw new Error('Google Apps Script URL not configured. Please deploy the Apps Script and update APPS_SCRIPT_URL in googleSheetsService.ts');
  }
  
  // Retry logic for Google Apps Script
  for (let attempt = 1; attempt <= GOOGLE_SHEETS_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Attempting to fetch data from Google Sheets (attempt ${attempt}/${GOOGLE_SHEETS_CONFIG.MAX_RETRIES})`);
      console.log(`📍 URL: ${GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GOOGLE_SHEETS_CONFIG.TIMEOUT);
      
      const response = await fetch(GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Google Apps Script request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      console.log('📊 Google Sheets Response:', responseData);
      
      if (!responseData) {
        throw new Error('Empty response from Google Apps Script');
      }
      
      if (responseData.error || !responseData.success) {
        throw new Error(`Google Apps Script error: ${responseData.error || responseData.message || 'Unknown error'}`);
      }
      
      if (!Array.isArray(responseData.data)) {
        throw new Error(`Invalid response format from Google Apps Script - expected data array, got: ${typeof responseData.data}`);
      }
      
      console.log(`✅ Successfully fetched data from Google Sheets`);
      console.log(`📊 Records received: ${responseData.data.length}`);
      console.log(`🕒 Data timestamp: ${responseData.timestamp || 'unknown'}`);
      
      // Validate and transform data
      const validatedData = validateTrainingData(responseData.data);
      
      console.log(`✅ Validated ${validatedData.length} training records from Google Sheets`);
      
      return validatedData;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Google Sheets attempt ${attempt} failed:`, error);
      
      if (attempt < GOOGLE_SHEETS_CONFIG.MAX_RETRIES) {
        console.log(`⏳ Retrying Google Sheets in ${GOOGLE_SHEETS_CONFIG.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, GOOGLE_SHEETS_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  throw new Error(`Failed to fetch data from Google Sheets after ${GOOGLE_SHEETS_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
}

/**
 * Validates and transforms raw data from Google Sheets
 */
function validateTrainingData(data: any[]): TrainingRecord[] {
  const validatedRecords: TrainingRecord[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    
    try {
      // Check for required fields
      if (!record.employee_code || !record.employee_name) {
        console.warn(`⚠️ Record ${i + 1} missing required fields, skipping`);
        continue;
      }
      
      // Transform and clean the data
      const trainingRecord: TrainingRecord = {
        employee_code: String(record.employee_code || '').trim(),
        employee_name: String(record.employee_name || '').trim(),
        email: String(record.email || '').trim(),
        employee_status: String(record.employee_status || '').trim(),
        gender: String(record.gender || '').trim(),
        date_of_joining: String(record.date_of_joining || '').trim(),
        department: String(record.department || '').trim(),
        designation: String(record.designation || '').trim(),
        reporting_manager_code: String(record.reporting_manager_code || '').trim(),
        reporting_manager_name: String(record.reporting_manager_name || '').trim(),
        course_category: String(record.course_category || '').trim(),
        course_name: String(record.course_name || '').trim(),
        course_type: String(record.course_type || '').trim(),
        course_end_date: String(record.course_end_date || '').trim(),
        enrollment_status: String(record.enrollment_status || '').trim(),
        course_completion_hours: String(record.course_completion_hours || '').trim(),
        course_enrolment_date: String(record.course_enrolment_date || '').trim(),
        course_completion_date: String(record.course_completion_date || '').trim(),
        course_progress: String(record.course_progress || '').trim(),
        course_completion_status: String(record.course_completion_status || '').trim(),
        refresher_requirement: String(record.refresher_requirement || '').trim(),
        recurrence_date: String(record.recurrence_date || '').trim(),
        refresher_status: String(record.refresher_status || '').trim(),
        months_to_expire: String(record.months_to_expire || '').trim(),
        course_role: String(record.course_role || '').trim(),
        'Store ID': String(record['Store ID'] || record.store_id || '').trim()
      };
      
      validatedRecords.push(trainingRecord);
      
    } catch (error) {
      console.warn(`⚠️ Error processing record ${i + 1}:`, error);
      continue;
    }
  }
  
  return validatedRecords;
}

/**
 * Submits new training data to Google Sheets
 * @param records Array of training records to submit
 */
export async function submitTrainingDataToGoogleSheets(records: Partial<TrainingRecord>[]): Promise<boolean> {
  try {
    console.log(`📤 Submitting ${records.length} records to Google Sheets`);
    
    const response = await fetch(GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'submit',
        data: records
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Successfully submitted ${records.length} records to Google Sheets`);
      return true;
    } else {
      throw new Error(result.error || 'Unknown error during submission');
    }
    
  } catch (error) {
    console.error('❌ Error submitting data to Google Sheets:', error);
    throw error;
  }
}

/**
 * Updates the Google Apps Script URL configuration
 * @param url The deployed Google Apps Script web app URL
 */
export function updateAppsScriptUrl(url: string): void {
  // This would typically update a configuration file or environment variable
  // For now, users need to manually update the APPS_SCRIPT_URL constant
  console.log(`📝 Please update APPS_SCRIPT_URL to: ${url}`);
}

/**
 * Gets the current configuration status
 */
export function getConfigurationStatus(): {
  isConfigured: boolean;
  url: string;
  message: string;
} {
  const isConfigured = !GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE');
  
  return {
    isConfigured,
    url: GOOGLE_SHEETS_CONFIG.APPS_SCRIPT_URL,
    message: isConfigured 
      ? 'Google Sheets integration is configured and ready to use'
      : 'Please deploy the Google Apps Script and update the APPS_SCRIPT_URL'
  };
}

// Legacy function name for backward compatibility
export const fetchTrainingDataFromGitHub = fetchTrainingDataFromGoogleSheets;