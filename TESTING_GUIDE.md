# MC Functionality Testing Guide

## Overview
This guide provides step-by-step instructions for testing the MC (Motor Carrier) functionality implementation. Testing should be performed with both admin and employee accounts.

---

## Prerequisites

1. **Database Setup**
   - At least 2-3 MC numbers created in the database
   - Admin user with `mcAccess: []` (empty array = all access)
   - Employee user with `mcNumberId` set and `mcAccess: ["mc-1", "mc-2"]`
   - Test data (loads, drivers, trucks) assigned to different MCs

2. **Test Accounts**
   - Admin account: `admin@test.com` / password
   - Employee (single MC): `employee1@test.com` / password
   - Employee (multi MC): `employee2@test.com` / password

---

## Admin Testing Scenarios

### Scenario 1: View All MCs (Default)
**Expected Behavior**: Admin sees all data from all MCs

1. Log in as admin
2. Navigate to `/dashboard/loads`
3. **Verify**: McViewSelector in header shows "All MCs" with checkmark icon
4. **Verify**: Load list shows loads from all MC numbers
5. **Verify**: MC badges display next to load numbers
6. Navigate to `/dashboard/drivers`
7. **Verify**: Driver list shows drivers from all MCs
8. **Verify**: MC badges display next to driver names

**Pass Criteria**:
- ✅ McViewSelector shows "All MCs"
- ✅ All loads visible regardless of MC
- ✅ All drivers visible regardless of MC
- ✅ MC badges display correctly

### Scenario 2: Filter by Single MC
**Expected Behavior**: Admin sees only data from selected MC

1. Click McViewSelector dropdown
2. Select a specific MC (e.g., "MC 123456")
3. **Verify**: Page refreshes
4. **Verify**: McViewSelector shows selected MC number
5. **Verify**: Load list shows only loads from selected MC
6. **Verify**: All MC badges show the same MC number
7. Navigate to `/dashboard/drivers`
8. **Verify**: Driver list shows only drivers from selected MC
9. Navigate back to `/dashboard/loads`
10. **Verify**: MC selection persists (still showing selected MC)

**Pass Criteria**:
- ✅ McViewSelector updates to show selected MC
- ✅ Only loads from selected MC visible
- ✅ Only drivers from selected MC visible
- ✅ Selection persists across page navigation
- ✅ All MC badges show same MC number

### Scenario 3: Filter by Multiple MCs
**Expected Behavior**: Admin sees data from multiple selected MCs

1. Click McViewSelector dropdown
2. Click "Select Multiple..."
3. **Verify**: Checkbox popover opens
4. Check 2-3 MC numbers
5. Click "Apply" button
6. **Verify**: Page refreshes
7. **Verify**: McViewSelector shows "X MCs" with filter icon
8. **Verify**: Load list shows loads from all selected MCs
9. **Verify**: MC badges show different MC numbers (from selected set)
10. Navigate to `/dashboard/drivers`
11. **Verify**: Driver list shows drivers from selected MCs only

**Pass Criteria**:
- ✅ Multi-select popover works correctly
- ✅ McViewSelector shows "X MCs"
- ✅ Only data from selected MCs visible
- ✅ MC badges show multiple different MCs
- ✅ Selection persists across navigation

### Scenario 4: Create Load with MC Assignment
**Expected Behavior**: Admin can assign MC when creating load

1. Ensure a specific MC is selected (Scenario 2)
2. Navigate to `/dashboard/loads`
3. Click "New Load" button
4. **Verify**: Form opens
5. **Verify**: MC selector field is visible and enabled
6. **Verify**: Current selected MC is pre-filled
7. Change MC to a different one
8. Fill in required fields (customer, pickup, delivery, etc.)
9. Submit form
10. **Verify**: Success toast appears
11. **Verify**: New load appears in list
12. **Verify**: Load has the MC you selected in the form
13. Switch McViewSelector to "All MCs"
14. **Verify**: New load is visible
15. **Verify**: MC badge shows the MC you assigned

**Pass Criteria**:
- ✅ MC selector visible and enabled for admin
- ✅ Can change MC in form
- ✅ Load created with selected MC
- ✅ MC badge shows correct MC

### Scenario 5: Switch Between View Modes
**Expected Behavior**: Smooth transitions between view modes

1. Start with "All MCs" view
2. Switch to single MC
3. **Verify**: Smooth transition, no errors
4. Switch to multi-MC
5. **Verify**: Smooth transition, no errors
6. Switch back to "All MCs"
7. **Verify**: Smooth transition, no errors
8. Check browser console
9. **Verify**: No JavaScript errors

**Pass Criteria**:
- ✅ All transitions work smoothly
- ✅ No console errors
- ✅ Data updates correctly each time
- ✅ Loading states show during transitions

---

## Employee Testing Scenarios

### Scenario 6: Employee with Single MC Access
**Expected Behavior**: Employee sees only their assigned MC data

1. Log in as employee with single MC
2. Navigate to `/dashboard/loads`
3. **Verify**: McViewSelector shows single MC badge (read-only)
4. **Verify**: No dropdown or selection controls
5. **Verify**: Load list shows only loads from employee's MC
6. **Verify**: All MC badges show same MC number
7. Navigate to `/dashboard/drivers`
8. **Verify**: Driver list shows only drivers from employee's MC
9. Try to access loads from different MC via URL manipulation
10. **Verify**: Still only see assigned MC data

**Pass Criteria**:
- ✅ McViewSelector shows read-only badge
- ✅ No way to change MC view
- ✅ Only assigned MC data visible
- ✅ Cannot access other MC data

### Scenario 7: Employee with Multi-MC Access
**Expected Behavior**: Employee sees combined data from all assigned MCs

1. Log in as employee with multiple MCs in `mcAccess`
2. Navigate to `/dashboard/loads`
3. **Verify**: McViewSelector shows multiple MC badges (read-only)
4. **Verify**: No dropdown or selection controls
5. **Verify**: Load list shows loads from all assigned MCs
6. **Verify**: MC badges show different MC numbers (from assigned set)
7. Navigate to `/dashboard/drivers`
8. **Verify**: Driver list shows drivers from all assigned MCs

**Pass Criteria**:
- ✅ McViewSelector shows multiple badges
- ✅ No selection controls
- ✅ Data from all assigned MCs visible
- ✅ MC badges show all assigned MCs

### Scenario 8: Employee Creates Load
**Expected Behavior**: Load automatically assigned to employee's default MC

1. Log in as employee
2. Navigate to `/dashboard/loads`
3. Click "New Load" button
4. **Verify**: Form opens
5. **Verify**: MC selector is hidden or disabled
6. Fill in required fields
7. Submit form
8. **Verify**: Success toast appears
9. **Verify**: New load appears in list
10. **Verify**: Load has employee's default MC
11. **Verify**: MC badge shows employee's MC

**Pass Criteria**:
- ✅ MC selector hidden or disabled
- ✅ Load created successfully
- ✅ Load assigned to employee's default MC
- ✅ Cannot override MC assignment

### Scenario 9: Employee Tries to Override MC (API Test)
**Expected Behavior**: API rejects attempt to set different MC

1. Log in as employee
2. Open browser DevTools > Network tab
3. Navigate to `/dashboard/loads`
4. Click "New Load" button
5. Fill in form
6. Before submitting, intercept request in DevTools
7. Modify request body to include `mcNumberId: "different-mc-id"`
8. Send modified request
9. **Verify**: API returns 403 Forbidden error
10. **Verify**: Error message: "Employees can only create records under their assigned MC number"

**Pass Criteria**:
- ✅ API rejects request with 403 status
- ✅ Clear error message returned
- ✅ No data created
- ✅ Security enforced at API level

### Scenario 10: Employee Cannot See Other MC Data
**Expected Behavior**: Data isolation enforced

1. Log in as employee (MC-1 assigned)
2. Note a load ID from MC-2 (from admin account or database)
3. Try to access load directly: `/dashboard/loads/[load-id-from-mc-2]`
4. **Verify**: Load not found or access denied
5. Try API directly: `GET /api/loads?id=[load-id-from-mc-2]`
6. **Verify**: Load not in response
7. Try to access driver from MC-2
8. **Verify**: Driver not accessible

**Pass Criteria**:
- ✅ Cannot access loads from other MCs
- ✅ Cannot access drivers from other MCs
- ✅ API enforces data isolation
- ✅ No data leakage

---

## Edge Cases & Error Scenarios

### Scenario 11: Cookie Expiration
**Expected Behavior**: MC selection persists for 30 days

1. Log in as admin
2. Select a specific MC
3. Close browser completely
4. Wait 1 minute
5. Open browser and navigate to app
6. **Verify**: Still logged in (if session valid)
7. **Verify**: MC selection persisted
8. Check cookies in DevTools
9. **Verify**: `currentMcNumberId` cookie exists
10. **Verify**: Cookie max-age is 30 days (2592000 seconds)

**Pass Criteria**:
- ✅ MC selection persists across browser restarts
- ✅ Cookie has correct expiration
- ✅ No need to re-select MC

### Scenario 12: Invalid MC in Cookie
**Expected Behavior**: System handles invalid MC gracefully

1. Log in as admin
2. Open DevTools > Application > Cookies
3. Manually edit `currentMcNumberId` to invalid value
4. Refresh page
5. **Verify**: No error, defaults to "All MCs" or first accessible MC
6. **Verify**: McViewSelector shows correct state

**Pass Criteria**:
- ✅ No JavaScript errors
- ✅ Graceful fallback to valid state
- ✅ User can continue using app

### Scenario 13: User with No MC Assignment
**Expected Behavior**: Should not be possible, but handle gracefully

1. Create test user with `mcNumberId: null` and `mcAccess: []`
2. Log in as this user
3. Navigate to `/dashboard/loads`
4. **Verify**: McViewSelector shows "No MC assigned" or similar
5. **Verify**: No data visible (or appropriate message)
6. Try to create load
7. **Verify**: Form validation prevents submission or API rejects

**Pass Criteria**:
- ✅ Clear message about missing MC assignment
- ✅ Cannot create records without MC
- ✅ No crashes or errors

### Scenario 14: Network Error During MC Switch
**Expected Behavior**: Error handling and recovery

1. Log in as admin
2. Open DevTools > Network tab
3. Set network throttling to "Offline"
4. Try to switch MC in McViewSelector
5. **Verify**: Error toast appears
6. **Verify**: MC selection doesn't change
7. Set network back to "Online"
8. Try switching MC again
9. **Verify**: Works correctly

**Pass Criteria**:
- ✅ Error message shown to user
- ✅ State doesn't change on error
- ✅ Can retry after network restored
- ✅ No data corruption

---

## Performance Testing

### Scenario 15: Large Dataset Performance
**Expected Behavior**: Queries remain fast with MC filtering

1. Ensure database has 1000+ loads across multiple MCs
2. Log in as admin
3. Select "All MCs" view
4. Navigate to `/dashboard/loads`
5. **Verify**: Page loads in < 2 seconds
6. Switch to single MC
7. **Verify**: Page loads in < 1 second
8. Switch to multi-MC (3-4 MCs selected)
9. **Verify**: Page loads in < 1.5 seconds
10. Check Network tab for API response times

**Pass Criteria**:
- ✅ All MCs view: < 2 seconds
- ✅ Single MC view: < 1 second
- ✅ Multi-MC view: < 1.5 seconds
- ✅ No N+1 query issues

---

## Regression Testing

### Scenario 16: Existing Features Still Work
**Expected Behavior**: MC changes don't break existing functionality

1. Test load creation (all fields)
2. Test load editing
3. Test load deletion
4. Test driver creation
5. Test driver editing
6. Test truck assignment
7. Test dispatch board
8. Test fleet board
9. Test analytics pages
10. Test reports generation

**Pass Criteria**:
- ✅ All existing features work
- ✅ No regressions introduced
- ✅ Data integrity maintained

---

## Browser Compatibility

### Scenario 17: Cross-Browser Testing
**Expected Behavior**: Works in all major browsers

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

For each browser:
1. Log in as admin
2. Test MC switching (all modes)
3. Test load creation with MC assignment
4. Verify cookies work correctly
5. Check console for errors

**Pass Criteria**:
- ✅ Works in Chrome/Edge
- ✅ Works in Firefox
- ✅ Works in Safari
- ✅ No browser-specific issues

---

## Mobile Responsiveness

### Scenario 18: Mobile View
**Expected Behavior**: MC selector works on mobile

1. Open app in mobile view (DevTools device emulation)
2. Log in as admin
3. **Verify**: McViewSelector visible and usable
4. Try switching MCs
5. **Verify**: Dropdown works on mobile
6. Try multi-select popover
7. **Verify**: Popover works on mobile
8. Test on actual mobile device if available

**Pass Criteria**:
- ✅ McViewSelector visible on mobile
- ✅ Dropdown works correctly
- ✅ Multi-select popover usable
- ✅ No layout issues

---

## Test Results Template

```markdown
## Test Results - [Date]

### Admin Scenarios
- [ ] Scenario 1: View All MCs - PASS/FAIL
- [ ] Scenario 2: Filter by Single MC - PASS/FAIL
- [ ] Scenario 3: Filter by Multiple MCs - PASS/FAIL
- [ ] Scenario 4: Create Load with MC Assignment - PASS/FAIL
- [ ] Scenario 5: Switch Between View Modes - PASS/FAIL

### Employee Scenarios
- [ ] Scenario 6: Single MC Access - PASS/FAIL
- [ ] Scenario 7: Multi-MC Access - PASS/FAIL
- [ ] Scenario 8: Employee Creates Load - PASS/FAIL
- [ ] Scenario 9: Employee Tries to Override MC - PASS/FAIL
- [ ] Scenario 10: Cannot See Other MC Data - PASS/FAIL

### Edge Cases
- [ ] Scenario 11: Cookie Expiration - PASS/FAIL
- [ ] Scenario 12: Invalid MC in Cookie - PASS/FAIL
- [ ] Scenario 13: No MC Assignment - PASS/FAIL
- [ ] Scenario 14: Network Error - PASS/FAIL

### Performance
- [ ] Scenario 15: Large Dataset - PASS/FAIL

### Regression
- [ ] Scenario 16: Existing Features - PASS/FAIL

### Compatibility
- [ ] Scenario 17: Cross-Browser - PASS/FAIL
- [ ] Scenario 18: Mobile - PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

---

## Quick Smoke Test (5 minutes)

If time is limited, run this quick smoke test:

1. ✅ Log in as admin
2. ✅ Verify McViewSelector shows "All MCs"
3. ✅ Switch to single MC
4. ✅ Verify data filters correctly
5. ✅ Create a load
6. ✅ Verify MC badge shows on new load
7. ✅ Log out
8. ✅ Log in as employee
9. ✅ Verify McViewSelector shows read-only badge
10. ✅ Verify only assigned MC data visible
11. ✅ Create a load
12. ✅ Verify load has employee's MC

If all 12 steps pass, core functionality is working.

---

## Reporting Issues

When reporting issues, include:
1. **Scenario number** (e.g., "Scenario 3: Filter by Multiple MCs")
2. **User role** (Admin/Employee)
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Screenshots** (if applicable)
7. **Browser console errors** (if any)
8. **Network tab** (if API related)

---

**Testing Date**: _____________  
**Tested By**: _____________  
**Environment**: _____________  
**Status**: ⏳ Pending / ✅ Complete

