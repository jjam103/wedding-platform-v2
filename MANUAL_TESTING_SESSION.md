# Manual Testing Session - Admin Dashboard

**Date**: January 30, 2026  
**Server**: http://localhost:3000  
**Status**: Dev server running ✅

## Testing Objective

Find real bugs that users will encounter by manually testing the admin dashboard.

## Test Plan

### Phase 1: Authentication & Access (5 minutes)
- [ ] Navigate to http://localhost:3000/admin
- [ ] Check if redirected to login or if already authenticated
- [ ] Test login flow if needed
- [ ] Verify admin dashboard loads with styling

### Phase 2: Core CRUD Operations (20 minutes)

#### Guests Management
- [ ] Navigate to /admin/guests
- [ ] Click "Add Guest" button
- [ ] Fill out form with valid data
- [ ] Submit and verify guest is created
- [ ] Edit an existing guest
- [ ] Try to delete a guest
- [ ] Test form validation (empty fields, invalid email)
- [ ] Test search/filter functionality

#### Events Management
- [ ] Navigate to /admin/events
- [ ] Create a new event
- [ ] Test datetime picker
- [ ] Test location selector
- [ ] Edit an existing event
- [ ] Delete an event
- [ ] Test "Manage Sections" button

#### Activities Management
- [ ] Navigate to /admin/activities
- [ ] Create a new activity
- [ ] Test capacity tracking
- [ ] Test RSVP settings
- [ ] Edit an activity
- [ ] Check capacity warnings (90%+)

#### Locations Management
- [ ] Navigate to /admin/locations
- [ ] Create a location
- [ ] Test parent location selector
- [ ] Try to create circular reference (should fail)
- [ ] Edit a location
- [ ] Delete a location

#### Vendors Management
- [ ] Navigate to /admin/vendors
- [ ] Create a vendor
- [ ] Test payment tracking
- [ ] Edit vendor details
- [ ] Check payment status indicators

### Phase 3: Advanced Features (15 minutes)

#### Content Pages (CMS)
- [ ] Navigate to /admin/content-pages
- [ ] Create a new page
- [ ] Test slug generation
- [ ] Click "Manage Sections"
- [ ] Add a section with rich text
- [ ] Test "Preview as Guest"

#### Accommodations & Room Types
- [ ] Navigate to /admin/accommodations
- [ ] Create an accommodation
- [ ] Click "Room Types" button
- [ ] Add a room type
- [ ] Test capacity tracking
- [ ] Assign guests to rooms

#### Budget Dashboard
- [ ] Navigate to /admin/budget
- [ ] Check if totals calculate correctly
- [ ] Verify vendor costs display
- [ ] Check subsidy calculations

#### Photo Management
- [ ] Navigate to /admin/photos
- [ ] Check pending photos count
- [ ] Test photo moderation (approve/reject)
- [ ] Upload a new photo (if possible)

### Phase 4: UI/UX Issues (10 minutes)

#### Navigation
- [ ] Test sidebar navigation
- [ ] Check grouped navigation expand/collapse
- [ ] Test mobile responsive (resize browser)
- [ ] Check breadcrumbs

#### Forms
- [ ] Test CollapsibleForm expand/collapse
- [ ] Check unsaved changes warning
- [ ] Test form validation messages
- [ ] Check error feedback display

#### Data Tables
- [ ] Test sorting columns
- [ ] Test filtering
- [ ] Test pagination
- [ ] Test search
- [ ] Test row selection

#### Toasts & Notifications
- [ ] Check success toasts after create/update
- [ ] Check error toasts on failures
- [ ] Verify toast auto-dismiss

### Phase 5: Edge Cases & Errors (10 minutes)

- [ ] Try to submit forms with missing required fields
- [ ] Try to create duplicate entries
- [ ] Test with very long text inputs
- [ ] Test with special characters in inputs
- [ ] Try to delete items that are referenced elsewhere
- [ ] Test browser back button behavior
- [ ] Test page refresh during form editing

## Bug Tracking Template

For each bug found, document:

```markdown
### Bug #X: [Short Description]

**Page**: /admin/[page-name]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Screenshots/Errors**: Any console errors or visual issues

**Fix Priority**: Immediate / High / Medium / Low
```

## Testing Notes

### Environment
- Browser: [Your browser]
- Screen size: [Your screen resolution]
- Database: [Test/Dev database]

### Observations
[Add notes as you test]

## Bugs Found

[Document bugs here as you find them]

---

## Quick Reference

**Dev Server**: http://localhost:3000  
**Admin Dashboard**: http://localhost:3000/admin  
**Stop Server**: Use Kiro's process control to stop process ID 3

**Key Pages to Test**:
- /admin - Dashboard
- /admin/guests - Guest management
- /admin/events - Event management
- /admin/activities - Activity management
- /admin/locations - Location hierarchy
- /admin/vendors - Vendor management
- /admin/accommodations - Accommodation management
- /admin/content-pages - CMS
- /admin/budget - Budget dashboard
- /admin/photos - Photo moderation
- /admin/emails - Email management
- /admin/transportation - Transportation manifests
- /admin/audit-logs - Audit logs
- /admin/rsvp-analytics - RSVP analytics

