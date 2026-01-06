import React, { useCallback, useState, useEffect } from 'react';
import { githubUploadService } from '../services/githubUploadService';
import GitHubSetup from './GitHubSetup';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  error: string | null;
  // FIX: Added title and description to props to make the component more reusable and fix type error in parent component.
  title: string;
  description: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, error, title, description }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isGitHubConfigured, setIsGitHubConfigured] = useState(false);
  const [showGitHubSetup, setShowGitHubSetup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if GitHub is already configured
    const token = localStorage.getItem('github_token');
    if (token) {
      githubUploadService.setToken(token);
      setIsGitHubConfigured(true);
    }
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileUpload = async (file: File) => {
    // First process the file locally
    onFileUpload(file);
    
    // Then try to upload to GitHub if configured
    if (isGitHubConfigured) {
      setIsUploading(true);
      setUploadSuccess(false);
      setUploadError(null);
      
      try {
        await githubUploadService.uploadTrainingData(file);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Upload to GitHub failed');
        setTimeout(() => setUploadError(null), 5000);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [isGitHubConfigured]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">{description}</p>
      </div>

      {/* GitHub Integration Status */}
      <div className="w-full mb-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isGitHubConfigured ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                GitHub Auto-Upload: {isGitHubConfigured ? 'Enabled' : 'Not Configured'}
              </span>
              {isUploading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Uploading to GitHub...</span>
                </div>
              )}
              {uploadSuccess && (
                <div className="flex items-center space-x-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Uploaded to GitHub!</span>
                </div>
              )}
              {uploadError && (
                <div className="flex items-center space-x-1 text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowGitHubSetup(true)}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isGitHubConfigured ? 'Reconfigure' : 'Setup GitHub'}
            </button>
          </div>
        </div>
      </div>
      <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-brand-primary bg-brand-primary/10 scale-105 shadow-lg' 
              : 'border-slate-300 dark:border-slate-600 hover:border-brand-primary/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <div 
              className="flex flex-col items-center justify-center pt-8 pb-8"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
          >
            <div className="mb-6 p-4 bg-brand-primary/10 rounded-full">
              <svg className="w-12 h-12 text-brand-primary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
            </div>
            <p className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-brand-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">CSV files supported • Maximum 10MB</p>
          </div>
          <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".csv" />
        </label>
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-400 font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* GitHub Setup Modal */}
      <GitHubSetup
        isOpen={showGitHubSetup}
        onClose={() => setShowGitHubSetup(false)}
        onSetupComplete={() => {
          setIsGitHubConfigured(true);
          setShowGitHubSetup(false);
        }}
      />
    </div>
  );
};

export default FileUpload;