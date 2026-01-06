# LMS Completion Sheet - Google Apps Script Setup

## 📊 Your Sheet Configuration

**Sheet Name:** `LMS completion`

**Columns (26 total):**
1. `employee_code`
2. `employee_name` 
3. `email`
4. `employee_status`
5. `gender`
6. `date_of_joining`
7. `department`
8. `designation`
9. `reporting_manager_code`
10. `reporting_manager_name`
11. `course_category`
12. `course_name`
13. `course_type`
14. `course_end_date`
15. `enrollment_status`
16. `course_completion_hours`
17. `course_enrolment_date`
18. `course_completion_date`
19. `course_progress`
20. `course_completion_status`
21. `refresher_requirement`
22. `recurrence_date`
23. `refresher_status`
24. `months_to_expire`
25. `course_role`
26. `Store ID`

## 🚀 Quick Setup Steps

### Step 1: Open Google Apps Script
1. In your Google Sheets with "LMS completion" data
2. Go to **Extensions → Apps Script**
3. Delete any existing code

### Step 2: Paste the Script
1. Copy the entire `google-apps-script.js` code I provided
2. Paste it into the Apps Script editor
3. Save the project (Ctrl+S)

### Step 3: Test the Setup
1. Select `setupScript` from the function dropdown
2. Click the ▶ Run button
3. Grant permissions when prompted
4. Check the execution log to verify your columns are detected

### Step 4: Deploy as Web App
1. Click **Deploy → New Deployment**
2. Choose **Web app**
3. Set **Execute as: Me**
4. Set **Who has access: Anyone**
5. Click **Deploy**
6. **Copy the deployment URL**

### Step 5: Configure Your Dashboard
1. Add the URL to your `.env.local` file:
   ```
   GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
2. Restart your development server: `npm run dev`
3. Go to your dashboard and click "Connect Google Sheets"
4. Paste the URL and test the connection

## 🔧 Special Features for Your Data

The script is specifically configured for your LMS completion data:

### ✅ **Automatic Data Processing:**
- **Dates**: Converts all date fields to consistent format
- **Progress**: Handles percentage values (removes % sign)
- **Hours**: Converts completion hours to numbers
- **Status**: Standardizes completion status values
- **Numbers**: Handles months_to_expire as integers

### ✅ **Enhanced Store Integration:**
- Detects your "Store ID" column automatically
- Enables advanced analytics with store mapping
- Supports regional and area manager analysis

### ✅ **Comprehensive Column Support:**
- All 26 columns are properly handled
- Special processing for LMS-specific fields
- Maintains data integrity during transfer

## 📊 Expected Data Format Examples

Your Google Sheets should have data like:

```
employee_code | employee_name | department | course_name | course_completion_status | course_progress | Store ID
EMP001       | John Doe      | Sales      | Safety 101  | Completed               | 100%           | ST001
EMP002       | Jane Smith    | Marketing  | Excel Basic | Not Completed           | 75%            | ST002
```

## 🔍 Troubleshooting

### ❌ If you get "Sheet not found" error:
- Make sure your sheet is named exactly: `LMS completion`
- Check for extra spaces or different capitalization

### ❌ If columns aren't detected:
- Ensure your first row contains the exact column headers
- Run `setupScript` to verify all columns are found

### ❌ If data looks wrong:
- Check that dates are in a recognizable format
- Ensure course_progress contains numbers or percentages
- Verify course_completion_status uses "Completed" or "Not Completed"

## ✅ Success Indicators

When everything works correctly, you should see:
- ✅ All 26 columns detected in the setup log
- ✅ Connection test passes in your dashboard
- ✅ Data loads with proper formatting
- ✅ Charts and analytics work normally
- ✅ Store ID integration enables enhanced features

The script is optimized for your specific LMS completion data structure!