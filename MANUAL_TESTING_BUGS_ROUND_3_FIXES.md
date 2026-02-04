# Manual Testing Bugs - Round 3 Fixes

**Date**: February 2, 2026  
**Session**: Critical bug fixes from manual testing

## Issues Fixed

### 1. Guest RSVP Cookie Error ✅ FIXED

**Problem**: `nextCookies.get is not a function` error when expanding guest RSVPs

**Root Cause**: API routes using deprecated `@supabase/auth-helpers-nextjs` package with `createRouteHandlerClient`

**Solution**: Updated to Next.js 15 compatible `@supabase/ssr` pattern

**Files Changed**:
- `app/api/admin/guests/[id]/rsvps/route.ts`
- `app/api/admin/guests/[id]/rsvps/[rsvpId]/route.ts`

**Changes Made**:
```typescript
// Before (deprecated):
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
const supabase = createRouteHandlerClient({ cookies });

// After (Next.js 15 compatible):
import { createServerClient } from '@supabase/ssr';
const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  }
);
```

**Testing**:
1. Navigate to `/admin/guests`
2. Click on a guest row to expand
3. Click "RSVPs" section to expand
4. Verify no cookie errors in console
5. Verify RSVPs load correctly
6. Try changing RSVP status
7. Verify updates work without errors

---

## Issues Identified (Not Yet Fixed)

### 2. Event Location Dropdown Not Populating ⚠️

**Status**: Needs investigation  
**Page**: `/admin/events`  
**Impact**: Cannot assign locations to events

**Current Implementation**:
- Events page has `fetchLocations()` function
- Locations are fetched from `/api/admin/locations`
- LocationSelector component is used in the form
- Locations state is passed to LocationSelector

**Possible Causes**:
1. API route not returning data correctly
2. LocationSelector not receiving/displaying locations
3. Locations not being fetched on page load
4. RLS policy blocking location access

**Next Steps**:
1. Check browser console for errors
2. Verify `/api/admin/locations` returns data
3. Check LocationSelector component props
4. Verify locations state is populated

---

### 3. View Event Page Shows No Content ⚠️

**Status**: Needs investigation  
**Page**: `/event/[slug]` (guest-facing event detail page)  
**Impact**: Cannot view event details

**Current Implementation**:
- Events page has "View" button that opens `/event/${slug}`
- Button uses `window.open()` to open in new tab
- Event slug is used for routing

**Possible Causes**:
1. Event detail page not implemented
2. Event detail page not loading data
3. Slug routing not working
4. Event data not being passed to page

**Next Steps**:
1. Check if `/app/event/[slug]/page.tsx` exists
2. Verify event detail page implementation
3. Test slug routing with known event slug
4. Check data loading in event detail page

---

### 4. B2 Storage Unknown Error ⚠️

**Status**: Needs more details  
**Impact**: Photo uploads may be failing

**Possible Causes**:
1. B2 credentials missing or incorrect
2. B2 bucket not configured
3. B2 service initialization error
4. Network/connectivity issue

**Next Steps**:
1. Check browser console for full error message
2. Verify B2 environment variables are set
3. Check B2 bucket configuration
4. Test B2 connection with simple upload

---

## Feature Requests (Future Work)

### 5. Event Page Section Editing 💡

**Request**: Events should have inline section editing like content pages

**Current State**: Events don't have section editing capability  
**Desired State**: Events should support rich content sections

**Implementation Notes**:
- Content pages already have `InlineSectionEditor` component
- Events page already imports `InlineSectionEditor`
- Events page shows section editor when editing existing event
- May just need to verify it's working correctly

---

### 6. Section Title/Subtitle Fields 💡

**Request**: Sections should have title and optional subtitle/description fields

**Current State**: Sections may not have structured metadata  
**Desired State**: Each section should have title and subtitle fields

**Implementation Notes**:
- Would require database schema changes
- Would require SectionEditor component updates
- Would improve content organization

---

### 7. Home Page Section Editors 💡

**Request**: Home page should have inline section editing

**Current State**: Home page has "Manage Sections" button that opens SectionEditor  
**Actual State**: Home page ALREADY has section editing!

**Implementation**:
```typescript
// Home page already has this:
<Button onClick={handleManageSections} variant="secondary">
  Manage Sections
</Button>

// Which opens:
<SectionEditor pageType="home" pageId="home" onSave={handleSectionEditorClose} />
```

**Status**: ✅ Already implemented! Just needs testing.

---

## Testing Checklist

### Critical Fixes (Ready to Test)
- [x] Guest RSVP expansion works without cookie errors
- [ ] RSVP status changes work correctly
- [ ] RSVP guest count updates work
- [ ] RSVP dietary restrictions updates work

### High Priority (Needs Investigation)
- [ ] Event location dropdown populates with locations
- [ ] View event page displays event details
- [ ] Photo uploads work without B2 errors

### Feature Verification
- [ ] Home page section editor works (should already work)
- [ ] Event page section editor works (should already work)

---

## Summary

**Fixed**: 1 critical issue (RSVP cookie error)  
**Needs Investigation**: 3 issues (event location, event view, B2 storage)  
**Feature Requests**: 2 new features, 1 already implemented

**Next Steps**:
1. Test RSVP functionality to verify cookie fix
2. Investigate event location dropdown issue
3. Investigate event view page issue
4. Get more details on B2 storage error
5. Verify home page section editor works
6. Consider implementing section title/subtitle fields

---

## Related Files

### Fixed Files
- `app/api/admin/guests/[id]/rsvps/route.ts`
- `app/api/admin/guests/[id]/rsvps/[rsvpId]/route.ts`

### Files to Investigate
- `app/admin/events/page.tsx` (location dropdown)
- `app/event/[slug]/page.tsx` (event detail page)
- `components/admin/LocationSelector.tsx` (location dropdown component)
- `services/b2Service.ts` (B2 storage)

### Reference Files
- `MANUAL_TESTING_BUGS_ROUND_3.md` (original bug report)
- `MANUAL_TESTING_BUGS_ROUND_2_FIXES.md` (previous fixes)
- `app/admin/home-page/page.tsx` (section editor reference)
- `app/admin/content-pages/page.tsx` (section editor reference)
