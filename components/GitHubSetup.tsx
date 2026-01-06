import React, { useState, useEffect } from 'react';
import { githubUploadService } from '../services/githubUploadService';

interface GitHubSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

const GitHubSetup: React.FC<GitHubSetupProps> = ({ isOpen, onClose, onSetupComplete }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if token is already stored
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
      setToken(storedToken);
      githubUploadService.setToken(storedToken);
    }
  }, []);

  const testConnection = async () => {
    if (!token.trim()) {
      setErrorMessage('Please enter a GitHub token');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      githubUploadService.setToken(token);
      const isConnected = await githubUploadService.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        localStorage.setItem('github_token', token);
      } else {
        setConnectionStatus('error');
        setErrorMessage('Invalid token or insufficient permissions');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    if (connectionStatus === 'success') {
      onSetupComplete();
      onClose();
    } else {
      setErrorMessage('Please test the connection first');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">GitHub Integration Setup</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 Automatic File Sync</h3>
              <p className="text-blue-700 text-sm">
                Connect your GitHub account to automatically save uploaded CSV files to your repository. 
                This ensures your data persists across devices and deployments.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Step 1: Create a GitHub Personal Access Token</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>1.</strong> Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Settings → Personal Access Tokens</a></p>
                  <p><strong>2.</strong> Click "Generate new token (classic)"</p>
                  <p><strong>3.</strong> Set expiration to "No expiration" or your preferred duration</p>
                  <p><strong>4.</strong> Select these scopes:</p>
                  <ul className="ml-4 space-y-1">
                    <li>• <code className="bg-gray-200 px-1 rounded">repo</code> (Full control of private repositories)</li>
                    <li>• <code className="bg-gray-200 px-1 rounded">workflow</code> (Update GitHub Action workflows)</li>
                  </ul>
                  <p><strong>5.</strong> Click "Generate token" and copy the token</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Step 2: Enter Your Token</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Personal Access Token
                    </label>
                    <input
                      type="password"
                      id="token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={testConnection}
                    disabled={isTestingConnection || !token.trim()}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTestingConnection ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Testing Connection...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>

                  {connectionStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>✅ Connection successful! You can now upload files to GitHub.</span>
                    </div>
                  )}

                  {connectionStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>❌ {errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">🔒 Security Note</h4>
              <p className="text-yellow-700 text-sm">
                Your token is stored locally in your browser and is only used to upload files to your GitHub repository. 
                It's never shared with external services.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                disabled={connectionStatus !== 'success'}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Save & Enable Auto-Upload
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubSetup;