import React, { useState, useEffect } from 'react';
import { getDataSourceStatus, updateDataSourceConfig, fetchTrainingDataWithFallback } from '../services/alternativeDataService';
import type { DataSource } from '../services/alternativeDataService';

interface DataSourceConfigProps {
  onDataLoaded?: (data: any[], source: string) => void;
}

const DataSourceConfig: React.FC<DataSourceConfigProps> = ({ onDataLoaded }) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; count?: number }>>({});
  const [publicCsvUrl, setPublicCsvUrl] = useState('');

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = () => {
    const sources = getDataSourceStatus();
    setDataSources(sources);
    
    // Load saved public CSV URL
    const savedUrl = localStorage.getItem('lms_public_csv_url');
    if (savedUrl) {
      setPublicCsvUrl(savedUrl);
    }
  };

  const testDataSource = async (sourceId: string) => {
    setTesting(sourceId);
    setTestResults(prev => ({ ...prev, [sourceId]: { success: false, message: 'Testing...' } }));

    try {
      const result = await fetchTrainingDataWithFallback();
      
      setTestResults(prev => ({
        ...prev,
        [sourceId]: {
          success: true,
          message: `✅ Success! Loaded ${result.data.length} records from ${result.source}`,
          count: result.data.length
        }
      }));

      if (onDataLoaded) {
        onDataLoaded(result.data, result.source);
      }

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [sourceId]: {
          success: false,
          message: `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const updatePublicCsvUrl = () => {
    if (publicCsvUrl.trim()) {
      updateDataSourceConfig('publicCSV', {
        url: publicCsvUrl.trim(),
        status: 'active'
      });
      
      localStorage.setItem('lms_public_csv_url', publicCsvUrl.trim());
      loadDataSources();
      
      alert('Public CSV URL saved successfully!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'configured': return '🟡';
      case 'unavailable': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        📊 Data Source Configuration
      </h3>

      <div className="space-y-6">
        {/* Google Sheets Configuration */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Google Sheets</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time data via Apps Script
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStatusIcon('active')}</span>
              <button
                onClick={() => testDataSource('googleSheets')}
                disabled={testing === 'googleSheets'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {testing === 'googleSheets' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
          
          <div className="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
            https://script.google.com/macros/s/AKfycbz...
          </div>
          
          {testResults.googleSheets && (
            <div className={`mt-2 p-2 rounded text-sm ${
              testResults.googleSheets.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {testResults.googleSheets.message}
            </div>
          )}
        </div>

        {/* Public CSV URL Configuration */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Public CSV URL</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Direct CSV file from any public URL
                </p>
              </div>
            </div>
            <span className="text-2xl">{getStatusIcon(publicCsvUrl ? 'active' : 'configured')}</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="url"
                value={publicCsvUrl}
                onChange={(e) => setPublicCsvUrl(e.target.value)}
                placeholder="https://example.com/data.csv"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={updatePublicCsvUrl}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Save URL
              </button>
            </div>
            
            {publicCsvUrl && (
              <button
                onClick={() => testDataSource('publicCSV')}
                disabled={testing === 'publicCSV'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {testing === 'publicCSV' ? 'Testing...' : 'Test CSV URL'}
              </button>
            )}
          </div>
          
          {testResults.publicCSV && (
            <div className={`mt-2 p-2 rounded text-sm ${
              testResults.publicCSV.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {testResults.publicCSV.message}
            </div>
          )}
        </div>

        {/* Cloud Sync Configuration */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">☁️</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Cloud Sync Upload</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload files that sync across devices
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStatusIcon('configured')}</span>
              <button
                onClick={() => testDataSource('cloudSync')}
                disabled={testing === 'cloudSync'}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {testing === 'cloudSync' ? 'Testing...' : 'Test Local Storage'}
              </button>
            </div>
          </div>
          
          {testResults.cloudSync && (
            <div className={`mt-2 p-2 rounded text-sm ${
              testResults.cloudSync.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {testResults.cloudSync.message}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h4>
          <div className="flex space-x-3">
            <button
              onClick={() => testDataSource('all')}
              disabled={testing !== null}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              🔄 Test All Sources
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('lms_training_data');
                alert('Local cache cleared!');
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              🗑️ Clear Cache
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Setup Instructions
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>1. <strong>Google Sheets:</strong> Deploy the improved Apps Script code</li>
            <li>2. <strong>Public CSV:</strong> Upload your CSV to GitHub/CDN and use the direct URL</li>
            <li>3. <strong>Cloud Sync:</strong> Upload files through the admin panel for cross-device access</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DataSourceConfig;