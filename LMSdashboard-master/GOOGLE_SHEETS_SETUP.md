# Google Sheets Integration Setup Guide

## 🚀 Overview
This guide will help you set up Google Sheets integration for your Employee Training Dashboard, allowing you to pull data directly from Google Sheets instead of uploading CSV files.

## 📋 Prerequisites
- A Google account with access to Google Sheets
- Your employee training data in a Google Sheets spreadsheet
- Basic familiarity with Google Apps Script

## 🔧 Step-by-Step Setup

### Step 1: Prepare Your Google Sheets

1. **Open your Google Sheets** with employee training data
2. **Ensure your data has proper headers** in the first row, such as:
   - `employee_code`
   - `employee_name`
   - `department`
   - `course_name`
   - `course_completion_status`
   - `course_completion_hours`
   - `course_progress`
   - `date_of_joining`
   - `Store ID` (optional, for advanced analytics)

3. **Create a Store Mapping sheet** (optional):
   - Sheet name: `Store_Mapping`
   - Columns: `Store ID`, `location`, `Region`, `AM`, `Trainer`

### Step 2: Set Up Google Apps Script

1. **In your Google Sheets, go to:**
   ```
   Extensions → Apps Script
   ```

2. **Delete any existing code** in the script editor

3. **Copy and paste** the entire content from `google-apps-script.js` (provided in your project files)

4. **Update the CONFIG section** at the top of the script:
   ```javascript
   const CONFIG = {
     // Change this to match your actual sheet name
     DATA_SHEET_NAME: 'Employee_Training_Data',
     
     // Change this if you have a store mapping sheet
     STORE_MAPPING_SHEET_NAME: 'Store_Mapping',
     
     // Add your frontend URLs here
     ALLOWED_ORIGINS: [
       'http://localhost:3012',
       'https://yourdomain.com'  // Add your production domain
     ]
   };
   ```

5. **Save the project** (Ctrl+S or Cmd+S)

6. **Give your project a name** (click "Untitled project" at the top)

### Step 3: Test the Script

1. **Run the setup function:**
   - In the Apps Script editor, select `setupScript` from the function dropdown
   - Click the ▶ Run button
   - Grant necessary permissions when prompted

2. **Check the execution log:**
   - Go to View → Execution Transcript
   - Verify that your sheets are detected and data is readable

### Step 4: Deploy as Web App

1. **Click Deploy → New Deployment**

2. **Choose settings:**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required for your React app to access it)

3. **Click Deploy**

4. **Copy the deployment URL** - it will look like:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

5. **Important:** Save this URL - you'll need it for the frontend!

### Step 5: Configure Frontend

1. **Add the URL to your environment variables:**
   ```bash
   # In your .env.local file
   GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Step 6: Test the Integration

1. **Open your React dashboard**
2. **Click "Connect Google Sheets"** tab
3. **Paste your deployment URL**
4. **Click "Test Connection"**
5. **If successful, click "Load Data from Sheets"**

## 🔧 Troubleshooting

### Common Issues:

#### ❌ "Script not found" or 404 errors
- Ensure your deployment URL is correct
- Make sure the web app is deployed with "Anyone" access
- Try redeploying the script

#### ❌ "Permission denied" errors
- Check that the script execution permission is set to "Me"
- Ensure you've granted all required permissions
- Try running the `setupScript` function again

#### ❌ "Sheet not found" errors
- Verify your sheet names in the CONFIG section match your actual Google Sheets tab names
- Check for extra spaces or special characters in sheet names

#### ❌ Data format issues
- Ensure your first row contains proper column headers
- Check that date fields are in a consistent format
- Verify numeric fields don't contain text

### Testing Commands:

You can test your setup using these Apps Script functions:

```javascript
// Test basic connectivity
setupScript()

// Test data fetching
testScript()
```

## 🔄 Updating Data

Once set up, your dashboard will always pull the latest data from Google Sheets. Simply:

1. Update your Google Sheets with new data
2. Refresh your dashboard
3. Click "Load Data from Sheets" to get the latest information

## 🔒 Security Notes

- The Apps Script runs with your Google account permissions
- Only people with the deployment URL can access your data
- Consider using a dedicated Google account for production deployments
- Regularly review your Apps Script execution logs

## 📊 Data Format Examples

### Employee Training Data Sheet:
```
employee_code | employee_name | department | course_name | course_completion_status | date_of_joining
EMP001       | John Doe      | Sales      | Safety 101  | Completed               | 2024-01-15
EMP002       | Jane Smith    | Marketing  | Sales Training | Not Completed        | 2024-02-01
```

### Store Mapping Sheet (Optional):
```
Store ID | location      | Region | AM          | Trainer
ST001    | Downtown Store| North  | Alice Brown | Bob Wilson
ST002    | Mall Location | South  | Carol Davis | Dave Johnson
```

## 🎉 Success!

Once everything is working, you'll have:
- ✅ Real-time data sync from Google Sheets
- ✅ Automatic store mapping integration
- ✅ All the same analytics and filtering capabilities
- ✅ AI-powered insights from Gemini
- ✅ No need to manually upload CSV files

Your dashboard will now automatically pull the latest data from your Google Sheets every time you load it!