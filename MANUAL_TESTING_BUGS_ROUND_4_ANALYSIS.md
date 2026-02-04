# Manual Testing Bugs - Round 4 Analysis

**Date**: February 2, 2026  
**Status**: Analysis Complete - Ready for Fixes

## Issues Identified from User's Second Report

### 1. Photos Not Showing Preview Images ⚠️ HIGH PRIORITY

**Problem**: Photos page shows "Image unavailable" placeholders instead of actual images

**Root Cause Analysis**:
- Photos are being uploaded to B2 storage successfully
- Photo URLs are being stored in database
- BUT: Images are not loading in the browser (404 or CORS errors likely)

**Possible Causes**:
1. **CDN Configuration Issue**: B2 CDN domain not configured correctly
2. **CORS Policy**: B2 bucket CORS not allowing browser requests
3. **URL Generation**: Photo URLs not using correct CDN domain
4. **B2 Health Check**: Storage health check showing issues

**Files to Investigate**:
- `services/b2Service.ts` - Check `generateCDNUrl()` function
- `app/api/admin/storage/health/route.ts` - Check health endpoint
- Environment variables: `B2_CDN_DOMAIN`, `CLOUDFLARE_CDN_URL`
- B2 bucket CORS configuration

**Fix Strategy**:
1. Check B2 health endpoint response
2. Verify CDN domain configuration
3. Test photo URL generation
4. Check browser console for actual error (404, CORS, etc.)
5. Verify B2 bucket CORS policy allows GET requests from app domain

---

### 2. Vendor Booking Form - Duplicate Dropdowns ❌ CRITICAL

**Problem**: Activity and Event dropdowns appear TWICE in the vendor booking form

**Root Cause**: Looking at `app/admin/vendors/page.tsx` line 700-720:
```typescript
bookingFormFields: VendorFormField[] = [
  // ... other fields ...
  {
    name: 'activityId',
    label: 'Activity (Optional)',
    type: 'select',
    required: false,
    options: [
      { label: 'Select Activity (Optional)', value: '' },
      ...activities.map(a => ({ label: a.name, value: a.id })),
    ],
  },
  {
    name: 'eventId',
    label: 'Event (Optional)',
    type: 'select',
    required: false,
    options: [
      { label: 'Select Event (Optional)', value: '' },
      ...events.map(e => ({ label: e.name, value: e.id })),
    ],
  },
  // ... more fields ...
]
```

**The Issue**: The form fields array is defined correctly, but there may be:
1. Duplicate field definitions in the array
2. CollapsibleForm component rendering fields twice
3. React key issues causing duplicate renders

**Fix Strategy**:
1. Search for duplicate field definitions in `bookingFormFields`
2. Check if `CollapsibleForm` is rendering fields correctly
3. Verify no duplicate keys in field array
4. Check if form is being rendered multiple times

---

### 3. Vendor Booking - Total Cost Calculation ⚠️ HIGH PRIORITY

**Problem**: Total cost should support flexible calculation:
- Flat rate pricing
- Per-guest pricing (base cost × guest count)
- Discount schedules by guest type

**Current Implementation**: 
- `totalCost` is a manual input field
- No automatic calculation based on pricing model
- No support for discount schedules

**Desired Behavior**:
```typescript
// Flat rate
totalCost = baseCost

// Per guest
totalCost = baseCost * guestCount

// Tiered (discount schedules)
if (guestCount < 50) totalCost = baseCost * guestCount
else if (guestCount < 100) totalCost = baseCost * guestCount * 0.9
else totalCost = baseCost * guestCount * 0.8
```

**Fix Strategy**:
1. Add `useEffect` to calculate `totalCost` automatically
2. Watch `pricingModel`, `guestCount`, and vendor's `baseCost`
3. Make `totalCost` field read-only (calculated)
4. Add discount schedule configuration (future enhancement)

---

### 4. RSVP Toggle Console Error ❌ CRITICAL

**Error**: `Failed to fetch activity RSVPs`  
**Location**: `components/admin/InlineRSVPEditor.tsx:87:15`

**Analysis of Code**:
```typescript
// Line 87 in InlineRSVPEditor.tsx
const response = await fetch(`/api/admin/guests/${guestId}/rsvps`);
const result = await response.json();

if (!result.success) {
  throw new Error(result.error?.message || 'Failed to load RSVPs');
}
```

**API Route**: `app/api/admin/guests/[id]/rsvps/route.ts`

**Possible Causes**:
1. **Cookie Pattern Issue**: API route uses `@supabase/ssr` pattern correctly
2. **Database Query Error**: One of the Supabase queries failing
3. **RLS Policy Issue**: User doesn't have permission to read RSVPs
4. **Data Format Issue**: API returning data in unexpected format

**Fix Strategy**:
1. Check browser network tab for actual API response
2. Add better error logging to API route
3. Test API endpoint directly
4. Verify RLS policies on `activity_rsvps`, `event_rsvps`, `guest_accommodations`

---

### 5. Draft Content Preview - Feature Request 💡 MEDIUM

**Request**: Ability to preview draft content pages, activities, events, accommodations

**Current State**: No preview functionality exists

**Implementation Plan**:
1. Add "Preview" button to draft items in admin tables
2. Create preview modal or route (e.g., `/admin/preview/[type]/[id]`)
3. Render content as it would appear to guests
4. Add "Publish" button in preview
5. Support for:
   - Content pages
   - Activities
   - Events
   - Accommodations

**Files to Create/Update**:
- `app/admin/preview/[type]/[id]/page.tsx` - Preview page
- `components/admin/PreviewModal.tsx` - Preview modal component
- Update admin pages to add preview buttons

---

### 6. System Settings Table Impact Assessment ⚠️ HIGH

**Error**: `Could not find the table 'public.system_settings' in the schema cache`

**Impact Assessment Needed**:
1. **Find all references** to `system_settings` table
2. **Determine if table is needed** or if references should be removed
3. **Create migration** if table is needed
4. **Remove references** if table is not needed

**Search Strategy**:
```bash
# Find all references to system_settings
grep -r "system_settings" --include="*.ts" --include="*.tsx" --include="*.sql"
```

**Possible Outcomes**:
- **Option A**: Create `system_settings` table with migration
- **Option B**: Remove all references and use alternative approach
- **Option C**: Table exists but RLS policies blocking access

---

### 7. Admin Users Page Missing ⚠️ HIGH

**Issue**: Navigation shows "Admin Users" but page doesn't exist

**Current State**:
- Service exists: `services/adminUserService.ts` ✓
- API routes exist: `app/api/admin/admin-users/route.ts` ✓
- Component exists: `components/admin/AdminUserManager.tsx` ✓
- **Page missing**: `app/admin/admin-users/page.tsx` ✗

**Fix**: Create the missing page file that uses existing components

---

### 8. Location Dropdown Empty ⚠️ HIGH

**Issue**: Location dropdown not populating in events/accommodations forms

**User Report**: "No location exists"

**Possible Causes**:
1. **No Data**: No locations in database (need seed data)
2. **API Error**: `/api/admin/locations` not returning data
3. **Component Issue**: `LocationSelector` not receiving/displaying data
4. **RLS Policy**: Locations table RLS blocking access

**Fix Strategy**:
1. Check if locations exist in database
2. Test `/api/admin/locations` API endpoint
3. Verify `LocationSelector` component props
4. Check RLS policies on `locations` table
5. Create seed data if needed

---

### 9. Event Detail Page - No Content ⚠️ HIGH

**Issue**: Event detail page shows no information

**Page**: `app/event/[slug]/page.tsx`

**Possible Causes**:
1. **Slug Routing**: Event slug not matching URL
2. **Data Loading**: Event data not being fetched
3. **Related Activities**: Activities not being loaded
4. **Component Rendering**: Page component not rendering data

**Fix Strategy**:
1. Verify page exists and is implemented
2. Check slug generation and routing
3. Test data loading logic
4. Verify related activities query

---

### 10. Accommodation Location Not Working ⚠️ HIGH

**Issue**: Location field not working on accommodations

**Related**: Same as Issue #8 (Location Dropdown Empty)

**Fix**: Same fix as location dropdown issue

---

### 11. Accommodation Event Link Missing ⚠️ HIGH

**Issue**: Accommodations not showing link to related event

**Current State**: Database has `event_id` foreign key, but UI doesn't display it

**Fix Strategy**:
1. Add event relationship display to accommodation UI
2. Show event name and date
3. Add "View Event" button/link
4. Update `app/admin/accommodations/page.tsx`

---

## Priority Fix Order

### Phase 1: Critical Blocking Issues (Do First)
1. **Vendor Booking Duplicate Dropdowns** - Breaks vendor booking form
2. **RSVP Toggle Error** - Breaks RSVP management
3. **Photos Not Loading** - Breaks photo gallery

### Phase 2: High Priority Data Issues
4. **Location Dropdown Empty** - Blocks event/accommodation creation
5. **Event Detail Page Empty** - Blocks event viewing
6. **System Settings Table** - Assess and fix
7. **Admin Users Page Missing** - Create page

### Phase 3: Feature Enhancements
8. **Vendor Booking Cost Calculation** - Improve UX
9. **Accommodation Event Link** - Add missing UI
10. **Draft Content Preview** - New feature

---

## Testing Checklist

### After Each Fix
- [ ] Test in browser manually
- [ ] Check browser console for errors
- [ ] Verify API responses in network tab
- [ ] Test with different data scenarios
- [ ] Verify no regressions in related features

### Before Marking Complete
- [ ] All critical issues fixed
- [ ] All high priority issues fixed
- [ ] User can complete core workflows
- [ ] No console errors
- [ ] Documentation updated

---

## Next Steps

1. **Start with vendor booking duplicate dropdowns** (easiest to fix)
2. **Fix RSVP error** (check API response)
3. **Fix photos not loading** (check B2 configuration)
4. **Fix location dropdown** (check data and API)
5. **Create admin users page** (use existing components)
6. **Assess system settings** (search codebase)
7. **Fix event detail page** (check data loading)
8. **Add accommodation event link** (UI enhancement)
9. **Implement cost calculation** (UX improvement)
10. **Add draft preview** (new feature)

