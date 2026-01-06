import React, { useState } from 'react';

interface AdminPanelProps {
  onLogout: () => void;
  onFileUpload: (file: File) => void;
}

export default function AdminPanel({ onLogout, onFileUpload }: AdminPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a CSV file only.'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would upload to your server/GitHub
      // For now, we'll just trigger the file upload to replace local data
      onFileUpload(file);
      
      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${file.name}. The dashboard data has been updated.`
      });
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload file. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
              Admin Panel
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Manage LMS completion data and dashboard settings
            </p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            🚪 Logout
          </button>
        </header>

        {/* Upload Section */}
        <div className="space-y-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              📊 Update LMS Data
            </h2>
            
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                    : 'border-slate-300 dark:border-slate-600 hover:border-brand-primary hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-4">
                  <div className="bg-brand-primary/10 w-20 h-20 rounded-full mx-auto flex items-center justify-center">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    ) : (
                      <span className="text-brand-primary text-3xl">📁</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {isUploading ? 'Uploading CSV File...' : 'Upload New LMS Data'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {isUploading 
                        ? 'Please wait while we process your file...' 
                        : 'Drag and drop your CSV file here or click to select'
                      }
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Supported format: CSV files with LMS completion data
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Status */}
              {uploadStatus.type && (
                <div className={`p-4 rounded-xl border ${
                  uploadStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex items-center">
                    <span className="mr-2">
                      {uploadStatus.type === 'success' ? '✅' : '❌'}
                    </span>
                    <p className="font-medium">{uploadStatus.message}</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  📋 Upload Instructions
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-disc list-inside">
                  <li>Ensure your CSV file contains all required LMS completion columns</li>
                  <li>The file will replace the existing dashboard data immediately</li>
                  <li>All users will see the updated data after the upload completes</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Backup your current data before uploading new files</li>
                </ul>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              ⚙️ System Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Dashboard Status</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">Active and operational</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-2xl mr-3">💾</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Data Source</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">Local CSV file</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}