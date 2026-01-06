# Testing Guide - Simplified Role System

## Quick Test URLs

Use these URLs to test the new simplified role-based access system:

### 🧪 Test Scenarios

#### 1. Employee View Test
```
http://localhost:5173/?id=EMP001
```
**Expected Result:**
- Personal employee dashboard
- Shows only this employee's courses
- Displays completion stats and progress

**What to Check:**
- [ ] Employee name and code displayed correctly
- [ ] Course list shows all assigned courses
- [ ] Completion percentage calculated correctly
- [ ] No other employee data visible

---

#### 2. Manager View Test
```
http://localhost:5173/?id=H2595
```
**Expected Result:**
- Team hierarchy dashboard
- Shows direct reports section
- Shows indirect reports section
- Displays team statistics

**What to Check:**
- [ ] Manager info displayed in header
- [ ] Direct reports listed with correct hierarchy
- [ ] Indirect reports shown separately
- [ ] Team completion stats calculated
- [ ] Expandable employee cards work

---

#### 3. Trainer View Test (Regular Trainer)
```
http://localhost:5173/?id=H1761
```
**Expected Result:**
- Store-based employee list
- Only shows employees from assigned stores
- Displays trainer statistics

**What to Check:**
- [ ] Only assigned store employees visible
- [ ] Store list shown in header
- [ ] Completion stats for assigned employees
- [ ] Expandable course details work

---

#### 4. Full Access Test (E-Learning Specialist)
```
http://localhost:5173/?id=H541
```
**Expected Result:**
- Shows ALL employees (full access)
- "Full Access" badge displayed
- All stores visible

**What to Check:**
- [ ] All employees from all stores visible
- [ ] "Full Access" badge shown in header
- [ ] Statistics include all data

---

#### 5. Admin Dashboard Test
```
http://localhost:5173/
```
**Expected Result:**
- Full dashboard with all charts
- Multi-select filters
- All analytics visible

**What to Check:**
- [ ] All charts render correctly
- [ ] Filters work properly
- [ ] Statistics show total company data

---

#### 6. Invalid ID Test
```
http://localhost:5173/?id=INVALID123
```
**Expected Result:**
- Warning message: "ID 'INVALID123' not found"
- Admin dashboard shown below warning

**What to Check:**
- [ ] Yellow warning box displayed
- [ ] Clear error message shown
- [ ] Admin dashboard still accessible
- [ ] No crashes or errors

---

## Role Detection Priority Testing

Test IDs that might match multiple roles:

### Test Case: ID that is both Employee and Manager
```
http://localhost:5173/?id=H2595
```
**Expected:** Should show Employee View (higher priority) if H2595 has training records

### Test Case: ID that is Employee, Manager, AND Trainer
**Expected:** Should show Employee View (highest priority)

---

## Data Validation Tests

### Test with Store ID
1. Upload CSV with `Store ID` column
2. Test trainer view
3. **Expected:** Store-based filtering works

### Test without Store ID
1. Upload CSV without `Store ID` column
2. Test trainer view
3. **Expected:** Shows appropriate warning or all data

---

## Console Tests

Open browser DevTools (F12) and check:

### 1. Check Role Detection
```javascript
// Paste in console after page loads:
console.log('Current Role:', /* should show detected role */);
console.log('User ID:', /* should show ID from URL */);
```

### 2. Check Data Loading
```javascript
// Should see no errors about:
// - Type mismatches
// - Undefined properties
// - Failed data loading
```

---

## Mobile Responsive Testing

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**What to Check:**
- [ ] All views render correctly
- [ ] Cards are responsive
- [ ] Tables scroll horizontally if needed
- [ ] Touch interactions work

---

## Performance Tests

### Load Time Test
1. Open DevTools Network tab
2. Load dashboard with large dataset
3. **Expected:** Loads in < 3 seconds

### Filter Performance Test
1. Apply multiple filters
2. **Expected:** Updates in < 1 second

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Common Issues & Solutions

### Issue: Blank Screen
**Solution:** 
1. Check browser console for errors
2. Verify data file exists
3. Check if CSV has required columns

### Issue: Wrong View Showing
**Solution:**
1. Verify ID in URL matches expected format
2. Check role detection priority
3. Ensure data includes required fields

### Issue: "ID Not Found" Error
**Solution:**
1. Verify ID exists in data
2. Check for case sensitivity (EMP001 vs emp001)
3. Ensure data has been loaded

### Issue: Trainer Shows All Data
**Solution:**
1. Check if ID is E-Learning Specialist, Training Head, or HR Head
2. Verify Store ID exists in data
3. Check store mapping configuration

---

## Regression Testing Checklist

After any changes, verify:
- [ ] All four views render correctly
- [ ] URL parameter parsing works
- [ ] Role detection logic correct
- [ ] Data filtering works for each role
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Filters still work in admin view
- [ ] Theme toggle works
- [ ] Admin panel accessible

---

## Automated Testing Commands

```bash
# Run development server
npm run dev

# Build production version
npm run build

# Preview production build
npm run preview

# Check TypeScript errors
npx tsc --noEmit
```

---

## Test Data Verification

Ensure your test data includes:

### Required Columns
- `employee_code` (for employee view)
- `employee_name`
- `course_name`
- `course_completion_status`
- `reporting_manager_code` (for manager view)
- `Store ID` (for trainer view)

### Optional Columns
- `designation`
- `department`
- `course_category`
- `course_progress`
- `completion_date`

---

## Success Criteria

✅ **Test Passes If:**
1. All four role views render without errors
2. Role detection works correctly with priority
3. Data filtering is accurate for each role
4. Invalid IDs show appropriate error messages
5. Admin dashboard accessible without URL parameter
6. No console errors or warnings
7. Mobile responsive on all screen sizes
8. Performance is acceptable (< 3s load time)

---

## Report Issues

If you find bugs, document:
1. URL used
2. Expected behavior
3. Actual behavior
4. Browser and version
5. Console errors (if any)
6. Screenshots

---

**Happy Testing! 🧪**
