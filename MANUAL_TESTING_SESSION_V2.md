# Manual Testing Session V2 - Updated Checklist

**Date**: January 30, 2026  
**Status**: 6/8 bugs fixed, ready for continued testing  
**Dev Server**: http://localhost:3000/admin

## Testing Status Overview

### ✅ Fixed and Ready to Test (6 bugs)
1. Number field validation (vendors, activities, accommodations)
2. Accommodation status enum mismatch
3. Content pages RLS policy (requires script execution)
4. LocationSelector not showing options
5. Error handling improvements
6. Event type (confirmed working as designed)

### 🔄 Newly Implemented (1 feature)
7. Guest groups feature (COMPLETE - ready for testing)

### ⚠️ Still Pending (1 bug)
8. Manage sections 404 error (requires route creation)

---

## Pre-Testing Setup

### Required Steps Before Testing

1. **Apply RLS Fix for Content Pages**
   ```bash
   node scripts/fix-content-pages-rls.mjs
   ```
   This fixes the content pages RLS policy to allow authenticated users to create pages.

2. **Verify Dev Server is Running**
   - Navigate to http://localhost:3000/admin
   - Should see admin dashboard

3. **Login Credentials**
   - Use your existing admin account
   - If needed, create admin user with: `node scripts/create-admin-user.mjs`

---

## Testing Checklist

### 1. Guest Groups Management ✨ NEW FEATURE

**Purpose**: Test the newly implemented guest groups feature

**Steps**:
1. Navigate to `/admin/guest-groups`
2. Click "Add Group"
3. Fill in:
   - Name: "Smith Family"
   - Description: "Bride's family from California"
4. Click "Create"
5. Verify group appears in table
6. Click on group row to edit
7. Change name to "Smith-Johnson Family"
8. Click "Update"
9. Verify name updated in table
10. Try to delete group (should work if no guests assigned)

**Expected Results**:
- ✅ Can create new guest groups
- ✅ Can edit existing groups
- ✅ Can delete groups without guests
- ✅ Cannot delete groups with guests (shows error)
- ✅ Guest count displays correctly

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 2. Guest Creation with Groups ✨ FIXED

**Purpose**: Verify guests can now be created with group selection

**Steps**:
1. Navigate to `/admin/guests`
2. Click "Add Guest"
3. Verify "Group" dropdown shows available groups
4. Select "Smith Family" from dropdown
5. Fill in:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john.smith@example.com"
   - Age Type: "Adult"
   - Guest Type: "Wedding Guest"
6. Click "Create"
7. Verify guest appears in table with group name

**Expected Results**:
- ✅ Group dropdown shows all available groups
- ✅ Can select a group
- ✅ Guest saves successfully
- ✅ Group name displays in guests table

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 3. Vendor Creation with Numbers ✅ FIXED

**Purpose**: Verify number fields now accept numeric input

**Steps**:
1. Navigate to `/admin/vendors`
2. Click "Add Vendor"
3. Fill in:
   - Name: "Costa Rica Catering"
   - Category: "Catering"
   - Base Cost: 5000
   - Amount Paid: 2500
4. Click "Create"
5. Verify vendor appears in table

**Expected Results**:
- ✅ Number fields accept numeric input
- ✅ No validation errors
- ✅ Vendor saves successfully
- ✅ Amounts display correctly in table

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 4. Accommodation Creation ✅ FIXED

**Purpose**: Verify accommodation status enum is correct

**Steps**:
1. Navigate to `/admin/accommodations`
2. Click "Add Accommodation"
3. Fill in:
   - Name: "Beachfront Villa"
   - Type: "Villa"
   - Status: "Draft" (should be available)
   - Capacity: 8
   - Total Rooms: 4
   - Price Per Night: 500
4. Click "Create"
5. Verify accommodation appears in table
6. Edit accommodation and change status to "Published"
7. Verify status updates correctly

**Expected Results**:
- ✅ Status dropdown shows "Draft" and "Published"
- ✅ Can create accommodation with "Draft" status
- ✅ Can update status to "Published"
- ✅ Status badge displays correctly in table

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 5. Content Page Creation ✅ FIXED (requires RLS fix)

**Purpose**: Verify content pages can be created after RLS fix

**Prerequisites**: Must run `node scripts/fix-content-pages-rls.mjs` first

**Steps**:
1. Navigate to `/admin/content-pages`
2. Click "Add Page"
3. Fill in:
   - Title: "Travel Information"
   - Slug: "travel-info"
   - Type: "info"
   - Status: "Published"
4. Click "Create"
5. Verify page appears in table

**Expected Results**:
- ✅ No RLS policy error
- ✅ Page saves successfully
- ✅ Page appears in table

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 6. Event Location Selection ✅ FIXED

**Purpose**: Verify location dropdown shows options

**Steps**:
1. Navigate to `/admin/events`
2. Click "Create New Event"
3. Click location dropdown
4. Verify locations are visible
5. Select a location
6. Fill in other required fields
7. Save event
8. Edit event
9. Verify location dropdown still shows options and current selection

**Expected Results**:
- ✅ Location dropdown shows all locations
- ✅ Can select a location
- ✅ Location saves correctly
- ✅ Location displays when editing

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 7. Activity Location Selection ✅ FIXED

**Purpose**: Verify location dropdown shows options in activities

**Steps**:
1. Navigate to `/admin/activities`
2. Click "Add Activity"
3. Click location dropdown
4. Verify locations are visible
5. Select a location
6. Fill in:
   - Name: "Beach Volleyball"
   - Type: "Activity"
   - Capacity: 20
   - Cost Per Person: 25
7. Save activity
8. Edit activity
9. Verify location dropdown still works

**Expected Results**:
- ✅ Location dropdown shows all locations
- ✅ Can select a location
- ✅ Location saves correctly
- ✅ Location displays when editing

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 8. Location Error Handling ✅ FIXED

**Purpose**: Verify errors show as toast messages, not console errors

**Steps**:
1. Navigate to `/admin/locations`
2. Create a location: "Costa Rica" (Country)
3. Create a child location: "Guanacaste" (Region, Parent: Costa Rica)
4. Try to edit "Costa Rica" and set parent to "Guanacaste" (circular reference)
5. Verify error shows as toast message
6. Check browser console - should not have error thrown

**Expected Results**:
- ✅ Error displays as toast message
- ✅ Toast message is user-friendly
- ✅ No console errors
- ✅ Form doesn't submit with invalid data

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### 9. Manage Sections Navigation ⚠️ STILL BROKEN

**Purpose**: Document that this feature is still not implemented

**Steps**:
1. Navigate to `/admin/events`
2. Click "Manage Sections" on any event
3. Observe 404 error

**Expected Results**:
- ❌ Gets 404 error (known issue)

**Status**: Feature not yet implemented. Options:
- Create sections management routes
- Remove "Manage Sections" buttons until ready

**Bug Tracking**:
- [x] Bug confirmed: Manage Sections leads to 404
- [x] Severity: HIGH - Prevents managing event sections
- [x] Requires: Route creation at `/admin/events/[id]/sections`

---

## Additional Testing Areas

### Navigation Testing

**Purpose**: Verify all navigation links work

**Steps**:
1. Click through all sidebar navigation items
2. Verify each page loads without 404
3. Check that active page is highlighted in sidebar

**Expected Results**:
- ✅ All navigation links work
- ✅ No 404 errors
- ✅ Active page highlighted correctly

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### Data Table Testing

**Purpose**: Verify data tables work correctly

**Steps**:
1. Test sorting on various columns
2. Test filtering on filterable columns
3. Test search functionality
4. Test pagination
5. Test row selection
6. Test bulk delete

**Expected Results**:
- ✅ Sorting works correctly
- ✅ Filtering works correctly
- ✅ Search finds relevant results
- ✅ Pagination works
- ✅ Can select multiple rows
- ✅ Bulk delete works

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### Form Validation Testing

**Purpose**: Verify form validation works correctly

**Steps**:
1. Try to submit forms with missing required fields
2. Try to submit forms with invalid data (e.g., invalid email)
3. Verify validation messages display
4. Verify form doesn't submit with invalid data

**Expected Results**:
- ✅ Required field validation works
- ✅ Data type validation works
- ✅ Validation messages are clear
- ✅ Invalid forms don't submit

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### Real-Time Updates Testing

**Purpose**: Verify real-time subscriptions work

**Steps**:
1. Open `/admin/guests` in two browser tabs
2. In tab 1, create a new guest
3. In tab 2, verify toast notification appears
4. In tab 2, verify guest list updates automatically

**Expected Results**:
- ✅ Toast notification appears in other tabs
- ✅ Data refreshes automatically
- ✅ No manual refresh needed

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### CSV Import/Export Testing

**Purpose**: Verify CSV functionality works

**Steps**:
1. Navigate to `/admin/guests`
2. Click "Export CSV"
3. Verify CSV file downloads
4. Open CSV and verify data is correct
5. Modify CSV (add a new guest)
6. Click "Import CSV" and select modified file
7. Verify new guest appears in table

**Expected Results**:
- ✅ CSV exports successfully
- ✅ CSV contains correct data
- ✅ CSV imports successfully
- ✅ Imported data appears in table
- ✅ Validation errors show clearly

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### Mobile Responsiveness Testing

**Purpose**: Verify UI works on mobile devices

**Steps**:
1. Open browser dev tools
2. Switch to mobile view (iPhone, Android)
3. Test navigation (hamburger menu)
4. Test forms (scrolling, input focus)
5. Test tables (horizontal scroll)

**Expected Results**:
- ✅ Sidebar collapses on mobile
- ✅ Forms are usable on mobile
- ✅ Tables scroll horizontally
- ✅ Touch targets are large enough (44px minimum)

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

### Accessibility Testing

**Purpose**: Verify keyboard navigation and screen reader support

**Steps**:
1. Navigate using only keyboard (Tab, Enter, Escape)
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Test with screen reader (if available)

**Expected Results**:
- ✅ All elements keyboard accessible
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ ARIA labels present

**Bug Tracking**:
- [ ] Bug found: _______________
- [ ] Severity: _______________
- [ ] Steps to reproduce: _______________

---

## Bug Reporting Template

When you find a bug, document it using this template:

### Bug #[NUMBER]: [SHORT DESCRIPTION]

**Page**: /admin/[page-name]  
**Severity**: CRITICAL | HIGH | MEDIUM | LOW  

**Issue**: [Describe what's wrong]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happens]

**Error Message** (if any):
```
[Paste error message here]
```

**Screenshots** (if applicable):
[Attach screenshots]

**Browser**: [Chrome/Firefox/Safari/Edge]  
**OS**: [macOS/Windows/Linux]

---

## Testing Progress Tracker

### Session 1 - Core Functionality
- [ ] Guest groups management
- [ ] Guest creation with groups
- [ ] Vendor creation with numbers
- [ ] Accommodation creation
- [ ] Content page creation
- [ ] Event location selection
- [ ] Activity location selection
- [ ] Location error handling

### Session 2 - Advanced Features
- [ ] Navigation testing
- [ ] Data table testing
- [ ] Form validation testing
- [ ] Real-time updates testing
- [ ] CSV import/export testing

### Session 3 - Polish
- [ ] Mobile responsiveness testing
- [ ] Accessibility testing
- [ ] Performance testing
- [ ] Cross-browser testing

---

## Known Issues

### Issue #1: Manage Sections 404
- **Status**: Not implemented
- **Workaround**: Don't click "Manage Sections" buttons
- **Fix Required**: Create sections management routes

### Issue #2: Content Pages RLS
- **Status**: Fixed (requires script execution)
- **Workaround**: Run `node scripts/fix-content-pages-rls.mjs`
- **Fix Required**: Apply RLS fix to database

---

## Testing Notes

Use this space to document observations, patterns, or concerns:

```
[Your notes here]
```

---

## Summary Report

After completing testing, fill out this summary:

**Total Bugs Found**: ___  
**Critical**: ___  
**High**: ___  
**Medium**: ___  
**Low**: ___  

**Most Critical Issues**:
1. _______________
2. _______________
3. _______________

**Overall Assessment**:
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major fixes
- [ ] Not ready for production

**Recommended Next Steps**:
1. _______________
2. _______________
3. _______________

---

## Files Modified in This Session

1. `components/admin/GroupedNavigation.tsx` - Added guest groups to navigation
2. `app/admin/guests/page.tsx` - Fixed API endpoint for fetching groups
3. `MANUAL_TESTING_SESSION_V2.md` - This updated testing document

## Files Created Previously

1. `schemas/groupSchemas.ts` - Group data schemas
2. `services/groupService.ts` - Group service methods
3. `app/api/admin/guest-groups/route.ts` - Guest groups API (GET, POST)
4. `app/api/admin/guest-groups/[id]/route.ts` - Guest groups API (GET, PUT, DELETE)
5. `app/admin/guest-groups/page.tsx` - Guest groups management UI

---

**Happy Testing! 🧪**
