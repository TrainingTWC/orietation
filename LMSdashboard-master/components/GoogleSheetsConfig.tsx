import React, { useState, useEffect } from 'react';
import { testGoogleSheetsConnection, setGoogleScriptUrl, getGoogleScriptUrl } from '../services/googleSheetsService';
import { Spinner } from './Spinner';

interface GoogleSheetsConfigProps {
  onDataFetch: (data: any[], isMerged: boolean, fileName: string) => void;
  onError: (error: string) => void;
}

const GoogleSheetsConfig: React.FC<GoogleSheetsConfigProps> = ({ onDataFetch, onError }) => {
  const [scriptUrl, setScriptUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  useEffect(() => {
    // Check if URL is already configured
    const currentUrl = getGoogleScriptUrl();
    if (currentUrl && currentUrl !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      setScriptUrl(currentUrl);
      setIsConfigured(true);
    }
  }, []);

  const handleTest = async () => {
    if (!scriptUrl.trim()) {
      onError('Please enter a Google Apps Script URL');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');
    setStatusMessage('');

    try {
      // Update the URL in the service
      setGoogleScriptUrl(scriptUrl.trim());
      
      const result = await testGoogleSheetsConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        setStatusMessage(result.message);
        setIsConfigured(true);
      } else {
        setConnectionStatus('error');
        setStatusMessage(result.message);
        setIsConfigured(false);
      }
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Connection test failed');
      setIsConfigured(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoadData = async () => {
    if (!isConfigured) {
      onError('Please test and configure the connection first');
      return;
    }

    setIsConnecting(true);
    try {
      const { fetchTrainingDataFromSheets } = await import('../services/googleSheetsService');
      const result = await fetchTrainingDataFromSheets();
      
      onDataFetch(result.data, result.isMerged, result.fileName);
      setStatusMessage(`Successfully loaded ${result.data.length} records from Google Sheets`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      onError(errorMessage);
      setConnectionStatus('error');
      setStatusMessage(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-full">
              <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.7 3H4.3C3.582 3 3 3.582 3 4.3v15.4c0 .718.582 1.3 1.3 1.3h15.4c.718 0 1.3-.582 1.3-1.3V4.3c0-.718-.582-1.3-1.3-1.3zM18.4 19.7H5.6V5.6h12.8v14.1z"/>
                <path d="M7 9h10v1.5H7zM7 12h10v1.5H7zM7 15h10v1.5H7z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">Connect to Google Sheets</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Connect your Google Sheets to automatically pull the latest employee training data.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Setup Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 dark:text-blue-300 text-sm">
            <li>Open your Google Sheets with employee training data</li>
            <li>Go to <strong>Extensions → Apps Script</strong></li>
            <li>Delete any existing code and paste the provided Apps Script code</li>
            <li>Update the <code>CONFIG</code> section with your sheet names</li>
            <li>Save the project and click <strong>Deploy → New Deployment</strong></li>
            <li>Choose <strong>Web app</strong>, set execute as <strong>Me</strong>, and access to <strong>Anyone</strong></li>
            <li>Copy the deployment URL and paste it below</li>
          </ol>
        </div>

        {/* URL Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="scriptUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Google Apps Script Deployment URL
            </label>
            <input
              id="scriptUrl"
              type="url"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              disabled={isConnecting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleTest}
              disabled={isConnecting || !scriptUrl.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-300 flex items-center justify-center"
            >
              {isConnecting ? (
                <>
                  <Spinner />
                  <span className="ml-2">Testing Connection...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test Connection
                </>
              )}
            </button>

            <button
              onClick={handleLoadData}
              disabled={!isConfigured || isConnecting}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-300 flex items-center justify-center"
            >
              {isConnecting ? (
                <>
                  <Spinner />
                  <span className="ml-2">Loading Data...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Load Data from Sheets
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-xl ${
              connectionStatus === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : connectionStatus === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            }`}>
              <div className="flex items-center">
                {connectionStatus === 'success' && (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {connectionStatus === 'error' && (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-medium">{statusMessage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsConfig;