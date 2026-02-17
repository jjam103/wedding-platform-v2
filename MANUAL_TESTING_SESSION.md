# Manual Testing Session - Admin Dashboard

**Date**: January 30, 2026  
**Server**: http://localhost:3000  
**Status**: Dev server running ✅

## Testing Objective

Find real bugs that users will encounter by manually testing the admin dashboard.

## Test Plan

### Phase 1: Authentication & Access (5 minutes)
- [ ] Navigate to http://localhost:3000/admin
- [x] Check if redirected to login or if already authenticated
- [x] Test login flow if needed
- [x] Verify admin dashboard loads with styling

    - Feedback - needs better styling. 

### Phase 2: Core CRUD Operations (20 minutes)

#### Guests Management
    Getting a Filed to fetch guests toas 
- [x] Navigate to /admin/guests
    I am able to navigate to the guest page. WOuld like the add guest modal to be at the top. 
    Also, there's no ability to add guest group, and since guest group is a required field for guests I can't save guests. 
     Don't have the abiliy to add a guest group
- [ ] Click "Add Guest" button
   
- [ ] Fill out form with valid data
- [ ] Submit and verify guest is created
- [ ] Edit an existing guest
- [ ] Try to delete a guest
- [ ] Test form validation (empty fields, invalid email)
- [ ] Test search/filter functionality

#### Events Management
- [x] Navigate to /admin/events
- [x] Create a new event
    I am able to create an event. Event type shouldn't be a required field. values in event type shouldn't be hard coded 


- [ ] Test datetime picker
- [ ] Test location selector
    I do not see the location options on an existig event 
- [ ] Edit an existing event
    Click on an event lets me edit it - but it's not clear that's the way it works. 
- [ ] Delete an event
- [ ] Test "Manage Sections" button
    Clicking on manage sections doesn't work. I get a 404 page. 

    Clicking view on an event takes me to a 404 page

#### Activities Management

- [ ] Navigate to /admin/activities

- [ ] Create a new activity
    I am unable to edit/add activity types. 
    I do not see the location in activity types 
    I cannot save an activity because the location isn't working. 
- [ ] Test capacity tracking
- [ ] Test RSVP settings
- [ ] Edit an activity
- [ ] Check capacity warnings (90%+)

#### Locations Management
- [ ] Navigate to /admin/locations
- [x] Create a location
    I am able ot create a location 
- [ ] Test parent location selector
    I am able to associate with a parent 
- [ ] Try to create circular reference (should fail)
It fails - but I did get this issue:  ## Error Type
Console Error

## Error Message
Location cannot be its own parent


    at LocationManagementPage.useCallback[handleSubmit] (app/admin/locations/page.tsx:68:15)
    at async handleSubmit (components/admin/CollapsibleForm.tsx:145:7)

## Code Frame
  66 |         setEditingLocation(null);
  67 |       } else {
> 68 |         throw new Error(result.error.message);
     |               ^
  69 |       }
  70 |     } catch (err) {
  71 |       throw err;

Next.js version: 16.1.1 (Turbopack)

- [ ] Edit a location
- [ ] Delete a location

#### Vendors Management
- [ ] Navigate to /admin/vendors
- [ ] Create a vendor
    Unable to create a vendor. On the base cost and amount paid I get hte following errors. Base Cost*
20
Expected number, received string

Amount Paid
35
Expected number, received string

Also, I'm not sure if the vendor section is right. You need to have a vendor section to add a vendor. then below that you need to have a  vendor booking section where you select a vendor, select an activity,  which associates a vendor with an activity or   the vendors cost 
- [ ] Test payment tracking
- [ ] Edit vendor details
- [ ] Check payment status indicators

### Phase 3: Advanced Features (15 minutes)

#### Content Pages (CMS)
- [ ] Navigate to /admin/content-pages
- [ ] Create a new page
When trying to save a page I get the following issue: 
new row violates row-level security policy for table "content_pages"
- [ ] Test slug generation
- [ ] Click "Manage Sections"
- [ ] Add a section with rich text
- [ ] Test "Preview as Guest"

#### Accommodations & Room Types
- [ ] Navigate to /admin/accommodations
- [ ] Create an accommodation
I am unable ot create an acomodation. When trying to save I get the following error in the status field.  
Status*

Available
Invalid enum value. Expected 'draft' | 'published', received 'available'
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

