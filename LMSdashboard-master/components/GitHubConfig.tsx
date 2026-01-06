import React, { useState } from 'react';
import { testGitHubConnection, fetchTrainingDataFromGitHub } from '../services/githubService';
import type { TrainingRecord } from '../services/githubService';

interface GitHubConfigProps {
  onDataLoad: (data: TrainingRecord[]) => void;
  onError: (error: string) => void;
}

export default function GitHubConfig({ onDataLoad, onError }: GitHubConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success?: boolean;
    message?: string;
    recordCount?: number;
  }>({});

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus({});
    
    try {
      const result = await testGitHubConnection();
      setConnectionStatus(result);
      
      if (result.success) {
        // Auto-load data after successful connection test
        setTimeout(() => {
          handleLoadData();
        }, 1000);
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `Connection test failed: ${(error as Error).message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLoadData = async () => {
    setIsLoading(true);
    
    try {
      const data = await fetchTrainingDataFromGitHub();
      onDataLoad(data);
      setConnectionStatus({
        success: true,
        message: `Successfully loaded ${data.length} training records from GitHub!`,
        recordCount: data.length
      });
    } catch (error) {
      const errorMessage = `Failed to load data from GitHub: ${(error as Error).message}`;
      onError(errorMessage);
      setConnectionStatus({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Load Data from GitHub Repository
        </h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📁 Local CSV File Testing
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Currently configured to load data from a local CSV file for testing purposes.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 font-mono text-xs">
              /public/data/lms-completion.csv
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 This will later be configured to fetch from your GitHub repository automatically.
            </p>
          </div>

          {/* Connection Status */}
          {connectionStatus.message && (
            <div className={`p-4 rounded-lg border ${
              connectionStatus.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
            }`}>
              <div className="flex items-center">
                <span className="mr-2">
                  {connectionStatus.success ? '✅' : '❌'}
                </span>
                <span className="text-sm font-medium">
                  {connectionStatus.message}
                </span>
              </div>
              {connectionStatus.recordCount && (
                <div className="mt-2 text-xs opacity-75">
                  📊 {connectionStatus.recordCount} training records available
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              {isTesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing Connection...
                </>
              ) : (
                <>
                  🔍 Test GitHub Connection
                </>
              )}
            </button>

            <button
              onClick={handleLoadData}
              disabled={isLoading || isTesting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading Data...
                </>
              ) : (
                <>
                  📥 Load Data from GitHub
                </>
              )}
            </button>
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              📋 Testing Instructions
            </h4>
            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
              <li>The sample CSV file is already placed in the public/data folder</li>
              <li>Click "Test Connection" to verify the local file loading works</li>
              <li>Click "Load Data" to populate the dashboard with sample data</li>
              <li>Once verified, we can configure it for your actual GitHub repository</li>
            </ol>
            
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> Currently using a local test file. Replace your sample data in public/data/lms-completion.csv to test with your actual data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}