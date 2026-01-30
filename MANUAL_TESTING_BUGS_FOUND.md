# Manual Testing - Critical Bugs Found

**Date**: January 30, 2026  
**Tester**: User  
**Total Bugs**: 8 critical/blocking issues

## Bug #1: Guest Group Required but No Way to Create ⛔ BLOCKING

**Page**: /admin/guests  
**Severity**: CRITICAL - Prevents creating any guests  

**Issue**: Guest group is a required field for guests, but there's no UI to create guest groups.

**Steps to Reproduce**:
1. Navigate to /admin/guests
2. Click "Add Guest"
3. Try to fill form - no guest group selector available
4. Cannot save guest

**Root Cause**: Missing guest groups management page/feature

**Fix Required**: 
- Add guest groups API route
- Add guest groups management page
- Add guest group selector to guest form

---

## Bug #2: Number Fields Validation Error ⛔ BLOCKING

**Page**: /admin/vendors  
**Severity**: CRITICAL - Prevents creating vendors  

**Error**:
```
Base Cost: Expected number, received string
Amount Paid: Expected number, received string
```

**Steps to Reproduce**:
1. Navigate to /admin/vendors
2. Fill form with Base Cost: 20, Amount Paid: 35
3. Submit form
4. Get validation error

**Root Cause**: HTML input type="number" returns string, Zod expects number

**Fix Required**: Convert string to number in form submission or schema

---

## Bug #3: Content Pages RLS Policy Error ⛔ BLOCKING

**Page**: /admin/content-pages  
**Severity**: CRITICAL - Prevents creating content pages  

**Error**:
```
new row violates row-level security policy for table "content_pages"
```

**Steps to Reproduce**:
1. Navigate to /admin/content-pages
2. Create a new page
3. Try to save
4. Get RLS policy error

**Root Cause**: Missing or incorrect RLS policy for content_pages table

**Fix Required**: Update RLS policies to allow authenticated users to insert

---

## Bug #4: Accommodation Status Enum Mismatch ⛔ BLOCKING

**Page**: /admin/accommodations  
**Severity**: CRITICAL - Prevents creating accommodations  

**Error**:
```
Status: Invalid enum value. Expected 'draft' | 'published', received 'available'
```

**Steps to Reproduce**:
1. Navigate to /admin/accommodations
2. Try to create accommodation
3. Select status "Available"
4. Get validation error

**Root Cause**: Form has "available" option but schema expects "draft" | "published"

**Fix Required**: Update form options to match schema OR update schema to include "available"

---

## Bug #5: Manage Sections 404 Error ⛔ BLOCKING

**Page**: /admin/events  
**Severity**: CRITICAL - Prevents managing event sections  

**Error**: 404 page when clicking "Manage Sections"

**Steps to Reproduce**:
1. Navigate to /admin/events
2. Click "Manage Sections" on an event
3. Get 404 error

**Root Cause**: Route doesn't exist or incorrect URL

**Expected**: /admin/events/[id]/sections  
**Actual**: Likely incorrect route

**Fix Required**: Create sections management page or fix route

---

## Bug #6: View Event 404 Error ⛔ BLOCKING

**Page**: /admin/events  
**Severity**: HIGH - Prevents viewing event details  

**Error**: 404 page when clicking "View" on an event

**Steps to Reproduce**:
1. Navigate to /admin/events
2. Click "View" on an event
3. Get 404 error

**Root Cause**: View route doesn't exist

**Fix Required**: Create event view page or remove "View" button

---

## Bug #7: Location Selector Not Showing Options 🔴 HIGH

**Page**: /admin/activities, /admin/events  
**Severity**: HIGH - Prevents setting location  

**Issue**: Location selector doesn't show location options when editing

**Steps to Reproduce**:
1. Navigate to /admin/events or /admin/activities
2. Edit an existing item
3. Location field doesn't show current location

**Root Cause**: LocationSelector not loading/displaying data correctly

**Fix Required**: Debug LocationSelector component data loading

---

## Bug #8: Error Handling Throws Instead of Toast 🟡 MEDIUM

**Page**: /admin/locations  
**Severity**: MEDIUM - Poor UX  

**Error**: Console error instead of user-friendly toast

**Example**:
```
Error: Location cannot be its own parent
at LocationManagementPage.useCallback[handleSubmit]
```

**Steps to Reproduce**:
1. Navigate to /admin/locations
2. Try to create circular reference
3. Get console error instead of toast

**Root Cause**: Error thrown instead of caught and displayed as toast

**Fix Required**: Catch errors and show toast messages

---

## Why Tests Didn't Catch These

### 1. Guest Groups Missing
- **Why Missed**: Tests mock data, don't test full user workflow
- **Gap**: No E2E test for "create guest from scratch"
- **Fix**: Add E2E test for complete guest creation flow

### 2. Number Field Validation
- **Why Missed**: Tests pass numbers directly, not through HTML forms
- **Gap**: Unit tests don't test HTML input behavior
- **Fix**: Add integration tests that simulate form submission

### 3. RLS Policy Error
- **Why Missed**: Tests use admin client that bypasses RLS
- **Gap**: No RLS policy tests for content_pages
- **Fix**: Add RLS integration tests for all tables

### 4. Enum Mismatch
- **Why Missed**: Tests use correct enum values
- **Gap**: No test validating form options match schema
- **Fix**: Add contract tests for form options vs schema

### 5-6. 404 Errors
- **Why Missed**: No E2E tests for navigation flows
- **Gap**: Missing E2E tests for button clicks and navigation
- **Fix**: Add E2E tests for all navigation paths

### 7. LocationSelector
- **Why Missed**: Component tests mock data successfully
- **Gap**: No integration test with real data loading
- **Fix**: Add integration tests for data-dependent components

### 8. Error Handling
- **Why Missed**: Tests check for error returns, not UI display
- **Gap**: No tests for error toast display
- **Fix**: Add tests for error UI feedback

---

## Test Coverage Gaps Identified

1. **E2E User Workflows** - Need complete user journey tests
2. **Form Submission Integration** - Need tests with real HTML forms
3. **RLS Policy Testing** - Need tests for all table policies
4. **Navigation Testing** - Need tests for all routes and links
5. **Error UI Testing** - Need tests for toast/error display
6. **Data Loading Integration** - Need tests for components with API calls

---

## Priority Fix Order

1. ⛔ **Bug #1**: Add guest groups feature (30-60 min)
2. ⛔ **Bug #2**: Fix number field validation (5 min)
3. ⛔ **Bug #3**: Fix content pages RLS (10 min)
4. ⛔ **Bug #4**: Fix accommodation status enum (5 min)
5. ⛔ **Bug #5**: Fix/create sections management route (15 min)
6. ⛔ **Bug #6**: Fix/remove event view route (10 min)
7. 🔴 **Bug #7**: Fix LocationSelector data loading (15 min)
8. 🟡 **Bug #8**: Improve error handling (10 min)

**Total Estimated Time**: 2-3 hours

---

## Next Steps

1. Fix all blocking bugs (Bugs #1-6)
2. Add E2E tests to prevent regression
3. Add integration tests for form submissions
4. Add RLS policy tests
5. Document testing gaps and improvements needed
