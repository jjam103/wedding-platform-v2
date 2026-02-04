# Manual Testing Bugs - Round 4 Fixes (Phase 2)

**Date**: February 2, 2026  
**Session**: Continuing fixes from user's second bug report

## Issues from User's Second Report

### Issue 1: Photos Not Showing Preview Images

**Status**: NEEDS INVESTIGATION  
**Priority**: HIGH

**Problem**: Photos show "Image unavailable" placeholder instead of actual images

**Investigation Needed**:
1. Check B2 storage health endpoint
2. Verify CDN configuration
3. Test photo URL generation
4. Check browser console for actual errors (404, CORS, etc.)

**Next Steps**:
- User should check browser console for specific error
- Check `/api/admin/storage/health` endpoint response
- Verify `B2_CDN_DOMAIN` environment variable is set correctly
- Test if photos load when accessing URL directly

---

### Issue 2: Vendor Booking - Duplicate Dropdowns

**Status**: NEEDS USER CLARIFICATION  
**Priority**: CRITICAL

**Problem**: Activity and Event dropdowns appear twice in vendor booking form

**Analysis**: 
- Reviewed `app/admin/vendors/page.tsx`
- Field definitions are correct - no duplicates in `bookingFormFields` array
- Only one `CollapsibleForm` component is rendered
- Fields are defined once each:
  - `activityId` (line 641-650)
  - `eventId` (line 651-660)

**Possible Causes**:
1. **CollapsibleForm Component Issue**: The `CollapsibleForm` component might be rendering fields twice
2. **React Key Issue**: Missing or duplicate keys causing double renders
3. **State Issue**: Form state causing re-renders with duplicate fields
4. **Browser Cache**: Old cached version showing duplicates

**Questions for User**:
1. Do you see TWO separate "Activity" dropdowns and TWO separate "Event" dropdowns?
2. Or do you see the same dropdown appearing twice in different locations?
3. Can you provide a screenshot showing the duplicate dropdowns?
4. Does refreshing the page (hard refresh: Cmd+Shift+R) fix the issue?

**If Issue Persists**:
- Need to investigate `CollapsibleForm` component
- Check if `DynamicForm` (used by CollapsibleForm) is rendering fields twice
- Add unique keys to form fields

---

### Issue 3: Vendor Booking - Total Cost Calculation

**Status**: READY TO FIX  
**Priority**: HIGH

**Problem**: Total cost should calculate automatically based on pricing model

**Current Behavior**: `totalCost` is a manual input field

**Desired Behavior**:
- **Flat Rate**: `totalCost = vendor.baseCost`
- **Per Guest**: `totalCost = vendor.baseCost * guestCount`
- **Tiered**: Apply discount schedules based on guest count

**Fix Strategy**:
1. Add `useEffect` to calculate total cost automatically
2. Watch `vendorId`, `pricingModel`, and `guestCount` changes
3. Fetch vendor's `baseCost` when vendor selected
4. Make `totalCost` field read-only (calculated value)
5. Show calculation formula to user

**Implementation**:
```typescript
// Add to VendorsPage component
useEffect(() => {
  if (selectedBooking?.vendorId && selectedBooking?.pricingModel) {
    const vendor = vendors.find(v => v.id === selectedBooking.vendorId);
    if (!vendor) return;

    let calculatedCost = 0;
    if (selectedBooking.pricingModel === 'flat_rate') {
      calculatedCost = vendor.baseCost;
    } else if (selectedBooking.pricingModel === 'per_guest' && selectedBooking.guestCount) {
      calculatedCost = vendor.baseCost * selectedBooking.guestCount;
    }

    // Update form data with calculated cost
    setSelectedBooking(prev => prev ? { ...prev, totalCost: calculatedCost } : null);
  }
}, [selectedBooking?.vendorId, selectedBooking?.pricingModel, selectedBooking?.guestCount, vendors]);
```

**Note**: This requires modifying how `CollapsibleForm` handles calculated fields

---

### Issue 4: RSVP Toggle Console Error

**Status**: NEEDS INVESTIGATION  
**Priority**: CRITICAL

**Error**: `Failed to fetch activity RSVPs`  
**Location**: `components/admin/InlineRSVPEditor.tsx:87:15`

**Analysis**:
- API route exists: `app/api/admin/guests/[id]/rsvps/route.ts`
- API uses correct `@supabase/ssr` pattern
- Component makes correct API call

**Possible Causes**:
1. **API Returning Error**: Database query failing
2. **RLS Policy Issue**: User doesn't have permission
3. **Data Format Issue**: API returning unexpected format
4. **Network Error**: Request failing before reaching API

**Investigation Steps**:
1. Check browser Network tab for actual API response
2. Look for HTTP status code (401, 403, 500, etc.)
3. Check response body for error details
4. Verify user is authenticated

**Questions for User**:
1. What is the exact error message in the browser console?
2. What HTTP status code does the API return? (check Network tab)
3. Does the error occur for all guests or specific guests?
4. Can you expand the RSVP section without errors, or does it error immediately?

---

### Issue 5: Draft Content Preview

**Status**: FEATURE REQUEST  
**Priority**: MEDIUM

**Request**: Ability to preview draft content pages, activities, events, accommodations

**Implementation Plan**:
1. Add "Preview" button to draft items in admin tables
2. Create preview route: `/admin/preview/[type]/[id]`
3. Render content as it would appear to guests
4. Add "Publish" button in preview
5. Support all entity types

**Files to Create**:
- `app/admin/preview/[type]/[id]/page.tsx`
- `components/admin/PreviewButton.tsx`

**Files to Update**:
- `app/admin/content-pages/page.tsx`
- `app/admin/activities/page.tsx`
- `app/admin/events/page.tsx`
- `app/admin/accommodations/page.tsx`

---

### Issue 6: System Settings Table

**Status**: NEEDS ASSESSMENT  
**Priority**: HIGH

**Error**: `Could not find the table 'public.system_settings' in the schema cache`

**Action Required**: Search codebase for all references to `system_settings`

**Commands to Run**:
```bash
# Find all references
grep -r "system_settings" --include="*.ts" --include="*.tsx" --include="*.sql" .

# Check if table exists in migrations
ls supabase/migrations/ | grep system_settings
```

**Possible Outcomes**:
1. **Create Table**: If table is needed, create migration
2. **Remove References**: If table is not needed, remove all references
3. **Fix RLS**: If table exists but RLS blocking access

---

### Issue 7: Admin Users Page Missing

**Status**: READY TO FIX  
**Priority**: HIGH

**Problem**: Navigation shows "Admin Users" but page doesn't exist

**Solution**: Create `app/admin/admin-users/page.tsx`

**Existing Resources**:
- ✓ Service: `services/adminUserService.ts`
- ✓ API: `app/api/admin/admin-users/route.ts`
- ✓ Component: `components/admin/AdminUserManager.tsx`
- ✗ Page: `app/admin/admin-users/page.tsx` (MISSING)

**Fix**: Create page that uses `AdminUserManager` component

---

### Issue 8: Location Dropdown Empty

**Status**: NEEDS INVESTIGATION  
**Priority**: HIGH

**Problem**: Location dropdown not populating in events/accommodations forms

**User Report**: "No location exists"

**Investigation Steps**:
1. Check if locations exist in database:
   ```sql
   SELECT COUNT(*) FROM locations;
   SELECT * FROM locations LIMIT 5;
   ```

2. Test API endpoint:
   ```bash
   curl http://localhost:3000/api/admin/locations
   ```

3. Check RLS policies on `locations` table

4. Verify `LocationSelector` component is receiving data

**Possible Fixes**:
- Create seed data if no locations exist
- Fix API if returning error
- Fix RLS policies if blocking access
- Fix component if not displaying data

---

### Issue 9: Event Detail Page - No Content

**Status**: NEEDS INVESTIGATION  
**Priority**: HIGH

**Problem**: Event detail page shows no information

**Page**: `app/event/[slug]/page.tsx`

**Investigation Steps**:
1. Verify page file exists
2. Check if event data is being loaded
3. Verify slug routing works
4. Check if related activities are loaded

**Possible Causes**:
1. Page not fully implemented
2. Slug mismatch
3. Data loading error
4. Component rendering issue

---

### Issue 10: Accommodation Location Not Working

**Status**: SAME AS ISSUE #8  
**Priority**: HIGH

**Problem**: Location field not working on accommodations

**Fix**: Same as location dropdown issue (#8)

---

### Issue 11: Accommodation Event Link Missing

**Status**: READY TO FIX  
**Priority**: HIGH

**Problem**: Accommodations not showing link to related event

**Current State**: Database has `event_id` foreign key, but UI doesn't display it

**Fix Strategy**:
1. Update accommodation table columns to show event
2. Add "View Event" button/link
3. Show event name and date
4. Update `app/admin/accommodations/page.tsx`

---

## Summary of Actions Needed

### Immediate Fixes (Can Do Now)
1. ✓ Create admin users page
2. ✓ Add accommodation event link to UI
3. ✓ Implement total cost calculation (with limitations)

### Needs User Input
1. ❓ Vendor booking duplicate dropdowns - need screenshot/clarification
2. ❓ RSVP error - need actual error message from console
3. ❓ Photos not loading - need browser console error
4. ❓ Location dropdown - need to check if data exists

### Needs Investigation
1. 🔍 System settings table - search codebase
2. 🔍 Event detail page - check implementation
3. 🔍 Location dropdown - check data and API

### Feature Requests (Lower Priority)
1. 💡 Draft content preview - new feature to implement

---

## Next Steps

1. **Ask user for clarifications** on:
   - Vendor booking duplicate dropdowns (screenshot?)
   - RSVP error (exact error message?)
   - Photos not loading (browser console error?)
   - Location dropdown (do locations exist in database?)

2. **Create fixes that are ready**:
   - Admin users page
   - Accommodation event link
   - Total cost calculation

3. **Investigate issues**:
   - System settings table references
   - Event detail page implementation
   - Location data and API

4. **Plan feature implementations**:
   - Draft content preview

