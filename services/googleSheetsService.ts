import type { EmployeeTrainingRecord, MergedData, StoreRecord } from '../types';

// Configuration for Google Apps Script
const GOOGLE_SCRIPT_CONFIG = {
  // Google Apps Script URL - pre-configured for LMS completion sheet
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxQ7L-pUfeX89eAUQyJdKYGPbJQkcMpnqHCLcrq5i7qbfbCqlUeWvg0zSMo6lh8qwbqkQ/exec',
  
  // Timeout for requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

interface GoogleSheetsResponse {
  data: any[];
  headers: string[];
  count: number;
  hasStoreId?: boolean;
  lastUpdated: string;
  error?: boolean;
  message?: string;
}

/**
 * Fetch data from Google Apps Script with retry logic
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = GOOGLE_SCRIPT_CONFIG.MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GOOGLE_SCRIPT_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (retries > 0 && (error instanceof Error && (
      error.name === 'AbortError' || 
      error.message.includes('network') || 
      error.message.includes('fetch')
    ))) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`, error.message);
      await new Promise(resolve => setTimeout(resolve, GOOGLE_SCRIPT_CONFIG.RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Fetch training data from Google Sheets
 */
export async function fetchTrainingDataFromSheets(): Promise<{
  data: (EmployeeTrainingRecord | MergedData)[];
  isMerged: boolean;
  fileName: string;
}> {
  try {
    console.log('🔄 Fetching training data from Google Sheets...');
    
    if (!GOOGLE_SCRIPT_CONFIG.SCRIPT_URL || GOOGLE_SCRIPT_CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      throw new Error('Google Apps Script URL not configured. Please set GOOGLE_SCRIPT_URL in your environment or update the service.');
    }
    
    const url = `${GOOGLE_SCRIPT_CONFIG.SCRIPT_URL}?action=getData&timestamp=${Date.now()}`;
    const response = await fetchWithRetry(url);
    const result: GoogleSheetsResponse = await response.json();
    
    if (result.error) {
      throw new Error(result.message || 'Error fetching data from Google Sheets');
    }
    
    console.log(`✅ Successfully fetched ${result.count} records from Google Sheets`);
    
    // Process the data similar to CSV processing
    const processedData = result.data.map(record => ({
      ...record,
      course_completion_hours: record.course_completion_hours ? parseFloat(record.course_completion_hours) : 0,
      course_progress: record.course_progress ? parseFloat(String(record.course_progress).replace('%', '')) : 0,
      course_completion_status: record.course_completion_status === 'Completed' ? 'Completed' : 'Not Completed',
    }));
    
    // Check if we need to merge with store mapping data
    if (result.hasStoreId) {
      console.log('🔄 Fetching store mapping data...');
      const storeData = await fetchStoreMappingFromSheets();
      
      if (storeData.length > 0) {
        console.log('🔗 Merging training data with store mapping...');
        const storeMap = new Map<string, Omit<StoreRecord, 'Store ID'>>(
          storeData.map(store => [store['Store ID'], { 
            location: store.location, 
            Region: store.Region, 
            AM: store.AM, 
            Trainer: store.Trainer 
          }])
        );
        
        const mergedData: MergedData[] = processedData.map(emp => {
          const storeInfo = emp['Store ID'] ? storeMap.get(emp['Store ID']) : undefined;
          return { ...emp, ...storeInfo };
        });
        
        return {
          data: mergedData,
          isMerged: true,
          fileName: `Google Sheets Data (${new Date(result.lastUpdated).toLocaleString()})`
        };
      }
    }
    
    return {
      data: processedData,
      isMerged: false,
      fileName: `Google Sheets Data (${new Date(result.lastUpdated).toLocaleString()})`
    };
    
  } catch (error) {
    console.error('❌ Error fetching data from Google Sheets:', error);
    throw new Error(`Failed to fetch data from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch store mapping data from Google Sheets
 */
export async function fetchStoreMappingFromSheets(): Promise<StoreRecord[]> {
  try {
    const url = `${GOOGLE_SCRIPT_CONFIG.SCRIPT_URL}?action=getStoreMapping&timestamp=${Date.now()}`;
    const response = await fetchWithRetry(url);
    const result: GoogleSheetsResponse = await response.json();
    
    if (result.error) {
      console.warn('Store mapping not available:', result.message);
      return [];
    }
    
    console.log(`✅ Successfully fetched ${result.count} store mapping records`);
    return result.data;
  } catch (error) {
    console.warn('Warning: Could not fetch store mapping data:', error);
    return [];
  }
}

/**
 * Test connection to Google Apps Script
 */
export async function testGoogleSheetsConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🔍 Testing Google Sheets connection...');
    
    if (!GOOGLE_SCRIPT_CONFIG.SCRIPT_URL || GOOGLE_SCRIPT_CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      return {
        success: false,
        message: 'Google Apps Script URL not configured'
      };
    }
    
    const url = `${GOOGLE_SCRIPT_CONFIG.SCRIPT_URL}?action=health&timestamp=${Date.now()}`;
    const response = await fetchWithRetry(url);
    const result = await response.json();
    
    return {
      success: true,
      message: 'Successfully connected to Google Sheets',
      details: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Get the configured Google Apps Script URL
 */
export function getGoogleScriptUrl(): string {
  return GOOGLE_SCRIPT_CONFIG.SCRIPT_URL;
}

/**
 * Update the Google Apps Script URL (useful for testing different deployments)
 */
export function setGoogleScriptUrl(url: string): void {
  GOOGLE_SCRIPT_CONFIG.SCRIPT_URL = url;
  console.log('📝 Updated Google Apps Script URL:', url);
}