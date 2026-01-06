import { githubUploadService } from './githubUploadService';
import { fetchTrainingDataFromGoogleSheets } from './dataService';
import { fetchTrainingDataWithFallback } from './alternativeDataService';

export interface DataPersistence {
  hasStoredData: boolean;
  lastUpdated: string | null;
  fileName: string | null;
}

export class DataPersistenceService {
  private static readonly STORAGE_KEY = 'lms_training_data';
  private static readonly METADATA_KEY = 'lms_data_metadata';

  /**
   * Save training data to localStorage
   */
  static saveData(data: any[], fileName: string): void {
    try {
      const metadata = {
        fileName,
        lastUpdated: new Date().toISOString(),
        recordCount: data.length
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  /**
   * Load training data from localStorage
   */
  static loadData(): { data: any[] | null; metadata: any | null } {
    try {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      const metadataStr = localStorage.getItem(this.METADATA_KEY);

      const data = dataStr ? JSON.parse(dataStr) : null;
      const metadata = metadataStr ? JSON.parse(metadataStr) : null;

      return { data, metadata };
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return { data: null, metadata: null };
    }
  }

  /**
   * Check if there's stored data available
   */
  static getDataPersistenceInfo(): DataPersistence {
    const { metadata } = this.loadData();
    
    return {
      hasStoredData: !!metadata,
      lastUpdated: metadata?.lastUpdated || null,
      fileName: metadata?.fileName || null
    };
  }

  /**
   * Clear stored data
   */
  static clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.METADATA_KEY);
  }

  /**
   * Check for updates from GitHub and load latest data
   */
  static async checkForUpdates(): Promise<{ hasUpdates: boolean; data?: any[] }> {
    try {
      // Check if GitHub is configured
      if (!githubUploadService.isConfigured()) {
        return { hasUpdates: false };
      }

      // Get list of CSV files from GitHub
      const files = await githubUploadService.listDataFiles();
      if (files.length === 0) {
        return { hasUpdates: false };
      }

      // Get the latest file (sorted by name which includes timestamp)
      const latestFile = files.sort((a, b) => b.name.localeCompare(a.name))[0];
      
      // Check if this is newer than our stored data
      const { metadata } = this.loadData();
      const storedFileName = metadata?.fileName;

      if (storedFileName === latestFile.name) {
        return { hasUpdates: false };
      }

      // Download and parse the latest file
      if (latestFile.download_url) {
        const response = await fetch(latestFile.download_url);
        const csvText = await response.text();
        
        // Parse CSV (simple implementation)
        const data = this.parseCSV(csvText);
        
        // Save to localStorage
        this.saveData(data, latestFile.name);
        
        return { hasUpdates: true, data };
      }

      return { hasUpdates: false };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { hasUpdates: false };
    }
  }

  /**
   * Simple CSV parser
   */
  private static parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  }

  /**
   * Auto-load data with multiple fallback options
   * Tries Google Sheets first, then alternative sources
   */
  static async autoLoadData(): Promise<{ data: any[] | null; source: 'googleSheets' | 'none'; fileName?: string; lastModified?: Date }> {
    try {
      // First, try to load local files served by the dev/build server (public/data)
      // This makes it easy to run the app locally by dropping the JSON/CSV into public/data/
      try {
        // Try JSON first
        const jsonResp = await fetch('/data/lms-completion.json', { cache: 'no-store' });
        if (jsonResp.ok) {
          const jsonData = await jsonResp.json();
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            // Try to get the last modified date from GitHub (works for public repos)
            let lastModified: Date | null = null;
            try {
              const fetchedDate = await githubUploadService.getFileLastModified('public/data/lms-completion.json');
              if (fetchedDate) {
                lastModified = new Date(fetchedDate);
              }
            } catch (e) {
              console.error('Error fetching last modified date from GitHub:', e);
            }
            
            this.saveData(jsonData, 'Local JSON Data');
            return { 
              data: jsonData, 
              source: 'googleSheets', 
              fileName: 'Local JSON Data',
              lastModified: lastModified || undefined
            };
          }
        }
      } catch (e) {
        // ignore and continue to CSV fallback
      }

      try {
        // Try CSV fallback
        const csvResp = await fetch('/data/lms-completion.csv', { cache: 'no-store' });
        if (csvResp.ok) {
          const csvText = await csvResp.text();
          if (csvText && csvText.trim().length > 0) {
            const parsed = this.parseCSV(csvText);
            if (parsed && parsed.length > 0) {
              // Try to get the last modified date from GitHub (works for public repos)
              let lastModified: Date | null = null;
              try {
                lastModified = await githubUploadService.getFileLastModified('public/data/lms-completion.csv');
              } catch (e) {
                console.warn('Could not fetch last modified date from GitHub:', e);
              }
              
              this.saveData(parsed, 'Local CSV Data');
              return { 
                data: parsed, 
                source: 'googleSheets', 
                fileName: 'Local CSV Data',
                lastModified: lastModified || undefined
              };
            }
          }
        }
      } catch (e) {
        // ignore and fall through to other sources
      }

      // First try the primary Google Sheets service
      try {
        const googleSheetsData = await fetchTrainingDataFromGoogleSheets();

        if (googleSheetsData && googleSheetsData.length > 0) {
          this.saveData(googleSheetsData, 'Google Sheets Data');

          return { 
            data: googleSheetsData, 
            source: 'googleSheets',
            fileName: 'Google Sheets (Live Data)'
          };
        }
      } catch (error) {
        console.warn('⚠️ Primary Google Sheets failed, trying fallback options:', error);
      }
      
      // Try alternative data sources with multiple fallbacks
      try {
        const fallbackResult = await fetchTrainingDataWithFallback();
        
        if (fallbackResult.data && fallbackResult.data.length > 0) {
          this.saveData(fallbackResult.data, `${fallbackResult.source} Data`);
          
          return { 
            data: fallbackResult.data, 
            source: 'googleSheets', // Keep as googleSheets for UI consistency
            fileName: `${fallbackResult.source} (${new Date(fallbackResult.timestamp).toLocaleString()})`
          };
        }
      } catch (error) {
        console.error('❌ All data sources failed:', error);
      }
      
      // If GitHub fails, return no data
      return { data: null, source: 'none' };
      
    } catch (error) {
      console.error('❌ GitHub repository loading failed:', error);
      return { data: null, source: 'none' };
    }
  }
}

export const dataPersistenceService = DataPersistenceService;