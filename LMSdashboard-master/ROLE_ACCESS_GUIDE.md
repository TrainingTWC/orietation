# Role-Based Access Control Guide

## Overview
The Employee Training Dashboard now supports intelligent role-based access control with a **single unified URL parameter**: `?id=`

The system automatically detects the role based on the ID provided:

1. **Admin View** (No ID parameter - Full Dashboard)
2. **Employee View** (ID matches an employee code)
3. **Manager View** (ID has people reporting to them)
4. **Trainer View** (ID exists in store mapping as trainer/leadership)

---

## How It Works

### Single URL Parameter: `?id=`

Simply append `?id=YOUR_ID` to the dashboard URL, and the system will automatically determine which view to show based on who that ID belongs to.

**Examples:**
```
?id=EMP001          → Employee View (if EMP001 is an employee)
?id=H2595           → Manager View (if H2595 has direct reports)
?id=H1761           → Trainer View (if H1761 is a trainer in store mapping)
(no parameter)      → Admin View (full dashboard)
```

### Role Detection Priority

If an ID matches multiple roles, the system uses this priority order:

1. **Employee** (Highest Priority - Most Specific)
2. **Manager** (Has people reporting to them)
3. **Trainer** (Exists in store mapping)
4. **Admin** (Default - No ID or ID not found)

---

## Access Levels

### 1. Admin View
**Access:** No URL parameters required

**Features:**
- Full dashboard with all analytics
- Course completion charts
- Employee performance tracking
- Regional and store-level analytics
- Multi-select filters for all dimensions

**URL:** 
```
https://trainingtwc.github.io/LMSdashboard/
```

---

### 2. Employee View
**Access:** Use `?id=EMPLOYEE_CODE`

**Features:**
- Personal training dashboard
- Individual course progress
- Completion statistics
- Course details grouped by category
- Personal profile information

**URL Example:**
```
?id=EMP001
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=EMP001
```

**Detection:** System checks if the ID exists as an `employee_code` in the data.

---

### 3. Manager View
**Access:** Use `?id=MANAGER_CODE`

**Features:**
- **Hierarchical team view** (recursive)
- Shows all direct reports
- Shows all indirect reports (subordinates of subordinates)
- Team aggregate statistics
- Visual distinction between direct and indirect reports
- Expandable employee cards with course details
- Performance color coding:
  - 🟢 Green: ≥80% completion
  - 🟡 Yellow: 60-79% completion
  - 🔴 Red: <60% completion

**URL Example:**
```
?id=H2595
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=H2595
```

**Detection:** System checks if any employee has this ID as their `reporting_manager_code`.

**How it works:**
- Uses `reporting_manager_code` field to build hierarchy
- Recursively finds all subordinates at all levels
- Example: Area Manager sees Store Managers AND all Baristas/Supervisors

---

### 4. Trainer View
**Access:** Use `?id=TRAINER_CODE`

**Features:**
- **Store-based access control**
- Trainers see only their assigned stores' employees
- **E-Learning Specialist** sees ALL data (full access)
- **Training Head** sees ALL data (full access)
- **HR Head** sees ALL data (full access)
- Team statistics and performance metrics
- Employee list with course details
- Store assignment visibility

**URL Example:**
```
?id=H1761
```

**Full URL:**
```
https://trainingtwc.github.io/LMSdashboard/?id=H1761
```

**Detection:** System checks if the ID exists in `storeMapping.ts` as:
- Trainer
- E-Learning Specialist
- Training Head
- HR Head

---

## Role Hierarchy & Access Matrix

| Role | Example IDs | Access Level | Stores Visible | Data Scope |
|------|-------------|--------------|----------------|------------|
| **Trainer** | H1761, H701, H1697, etc. | Store-specific | Assigned stores only | Employees in assigned stores |
| **E-Learning Specialist** | H541 | Full access | All stores | All employee data |
| **Training Head** | H3237 | Full access | All stores | All employee data |
| **HR Head** | H2081 | Full access | All stores | All employee data |

---

## Use Cases

### Scenario 1: Employee wants to check personal progress
**Action:** Navigate to `?id=EMP123`
**Result:** Personal dashboard with individual course progress and completion stats

---

### Scenario 2: Manager wants to see team hierarchy
**Action:** Navigate to `?id=H2595`
**Result:** Sees all direct reports (Store Managers) AND indirect reports (Baristas, Supervisors) in the region

---

### Scenario 3: Trainer wants to check their team
**Action:** Navigate to `?id=H1761`
**Result:** Sees all employees from assigned stores: S001, S002, S004, S006, S007, S009, S012, S014, S021, S031

---

### Scenario 4: E-Learning Specialist needs to review all training
**Action:** Navigate to `?id=H541`
**Result:** Full access - sees ALL employees across ALL stores with "Full Access" badge

---

### Scenario 5: Training Head wants company-wide insights
**Action:** Navigate to `?id=H3237`
**Result:** Full access - sees ALL employees across ALL stores with "Full Access" badge

---

### Scenario 6: Admin wants full dashboard analytics
**Action:** Navigate to base URL (no parameters)
**Result:** Full admin dashboard with all charts, filters, and analytics

---

## Data Source

All role views use the **same data source**: `lms-completion.json` (merged data)

The data is merged with store mapping information to enable:
- Store-based filtering for trainers
- Regional analytics
- Area manager hierarchies
- Location-based reporting

---

## Technical Implementation

### Data Flow:
1. **URL Parameter Detection**: App.tsx checks for single `?id=` parameter
2. **Role Detection**: `detectRole()` function checks:
   - Is ID an employee? (exists in `employee_code`)
   - Is ID a manager? (exists in `reporting_manager_code`)
   - Is ID a trainer? (exists in `storeMapping.ts`)
3. **Priority Resolution**: If ID matches multiple roles, uses priority order
4. **View Rendering**: Renders appropriate view component
5. **Data Filtering**: Each view filters data according to role permissions

### File Structure:
```
components/
  ├── TrainerView.tsx      (Trainer-specific view)
  ├── ManagerView.tsx      (Hierarchical manager view)
  ├── EmployeeView.tsx     (Individual employee view)
  └── TabbedDashboard.tsx  (Admin full dashboard)

data/
  └── storeMapping.ts      (Store and role mappings)

types.ts                   (Type definitions)
App.tsx                    (Main routing with role detection)
```

### Role Detection Function:
```typescript
const detectRole = (id: string, data: any[]): 'employee' | 'manager' | 'trainer' | null => {
  // Check if ID exists as an employee
  const isEmployee = data.some(record => record.employee_code === id);
  
  // Check if ID has people reporting to them (manager)
  const isManager = data.some(record => record.reporting_manager_code === id);
  
  // Check if ID exists in store mapping as trainer or leadership role
  const isTrainer = storeMappingData.some(store => 
    store.Trainer === id || 
    store['E-Learning Specialist'] === id || 
    store['Training Head'] === id || 
    store['HR Head'] === id
  );
  
  // Priority: Employee > Manager > Trainer
  if (isEmployee) return 'employee';
  if (isManager) return 'manager';
  if (isTrainer) return 'trainer';
  
  return null;
};
```

---

## Error Handling

### ID Not Found
If the provided ID doesn't match any role, the system will:
1. Show a warning message: "The ID 'XXXXX' was not found in the system"
2. Display the full admin dashboard below the warning
3. Allow the user to verify and correct the ID

### Missing Data Fields
If required data fields are missing:
- **Manager View**: Requires `reporting_manager_code` field
- **Trainer View**: Requires `Store ID` field
- System will show appropriate error messages

---

## Security Notes

⚠️ **Important:** URL parameters are visible and can be manipulated. This system is designed for:
- Internal use within trusted networks
- Quick access without complex authentication
- Training management and self-service reporting

For production environments with sensitive data, consider:
- Adding authentication layer
- Server-side access control validation
- Encrypted tokens instead of plain IDs
- Session management

---

## Quick Reference

### New Simplified URL System

| Role Type | URL Format | Example | Detection Method |
|-----------|------------|---------|------------------|
| Admin | (no parameter) | `https://example.com/` | Default when no ID |
| Employee | `?id=CODE` | `?id=EMP001` | ID exists as employee_code |
| Manager | `?id=CODE` | `?id=H2595` | ID exists as reporting_manager_code |
| Trainer | `?id=CODE` | `?id=H1761` | ID exists in store mapping |

### Benefits of Single Parameter System

✅ **Simplicity**: One parameter to rule them all  
✅ **Flexibility**: Same link format for everyone  
✅ **Intelligence**: Automatic role detection  
✅ **Priority**: Clear hierarchy when ID has multiple roles  
✅ **Error Handling**: Graceful fallback to admin view  

---

## Troubleshooting

### Problem: ID not recognized
**Solution:** 
1. Verify the ID exists in your CSV data
2. Check spelling and case sensitivity
3. Ensure data has been merged with store mapping
4. Check browser console for errors

### Problem: Wrong view showing
**Solution:**
1. Check role detection priority order
2. If ID has multiple roles, higher priority role will show
3. Verify store mapping data is up to date

### Problem: No data showing in Trainer View
**Solution:**
1. Ensure CSV includes `Store ID` column
2. Verify store IDs match between data and store mapping
3. Check trainer is assigned to stores in `storeMapping.ts`

---

## Support

For questions or issues:
1. Check the store mapping in `data/storeMapping.ts`
2. Verify employee data has correct `Store ID` field
3. Ensure CSV merge has been performed for full functionality
4. Contact the development team for access issues

---

**Last Updated:** October 24, 2025  
**Version:** 3.0 - Simplified Single Parameter System
