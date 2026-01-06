# GitHub Integration Setup

## Overview
This dashboard now includes automatic CSV file synchronization with your GitHub repository. When enabled, any CSV files uploaded through the admin panel will be automatically saved to your GitHub repository and synchronized across all devices.

## Features

### 🔄 Automatic File Sync
- Uploaded CSV files are automatically committed to your GitHub repository
- Files are stored in the `public/data/` directory with timestamps
- No need to re-upload files when accessing from different devices

### 💾 Data Persistence
- Training data is automatically saved to browser localStorage
- App checks for newer files from GitHub on startup
- Seamless fallback to local storage if GitHub is unavailable

### 🔒 Secure Token Management
- GitHub Personal Access Token stored locally in browser
- Token is never shared with external services
- Easy setup with step-by-step instructions

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set expiration to "No expiration" or your preferred duration
4. Select these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token" and copy the token

### 2. Configure the Dashboard

1. Access the admin panel in your dashboard
2. Click "Setup GitHub" button in the file upload area
3. Paste your GitHub Personal Access Token
4. Click "Test Connection" to verify
5. Click "Save & Enable Auto-Upload"

## How It Works

1. **File Upload**: When you upload a CSV file through the admin panel:
   - File is processed and displayed in the dashboard immediately
   - File is automatically uploaded to GitHub repository
   - File is saved to localStorage for offline access

2. **Auto-Loading**: When you open the dashboard:
   - App checks GitHub for the latest CSV files
   - Downloads and displays the most recent data
   - Falls back to localStorage if GitHub is unavailable

3. **Cross-Device Sync**: 
   - Upload a file on any device with GitHub configured
   - Open the dashboard on another device
   - Latest data is automatically loaded from GitHub

## File Storage Structure

```
public/data/
├── lms-completion-2025-01-15T10-30-45-123Z.csv
├── lms-completion-2025-01-20T14-22-11-456Z.csv
└── (other timestamped CSV files)
```

## Security Notes

- Your GitHub token is stored only in your browser's localStorage
- The token is used exclusively for uploading files to your repository
- No external services have access to your token or data
- You can revoke the token at any time from GitHub settings

## Troubleshooting

### Connection Failed
- Verify your GitHub token has the correct permissions
- Check that the token hasn't expired
- Ensure your repository name matches: `TrainingTWC/LMSdashboard`

### Files Not Syncing
- Check your internet connection
- Verify the GitHub token is still valid
- Look for error messages in the browser console

### Data Not Loading
- The app will automatically fall back to localStorage
- You can manually upload a CSV file if auto-sync fails
- Check the data source indicator in the header

## Benefits

✅ **No Re-uploads**: Upload once, access everywhere
✅ **Automatic Backup**: All data safely stored in GitHub
✅ **Team Collaboration**: Multiple admins can update data
✅ **Version History**: GitHub keeps track of all changes
✅ **Offline Access**: Works even without internet connection