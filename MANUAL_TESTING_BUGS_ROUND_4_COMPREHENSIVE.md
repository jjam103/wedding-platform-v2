# Manual Testing Bugs - Round 4 (Comprehensive)

**Date**: February 2, 2026  
**Testing Session**: Comprehensive system-wide testing

## Critical Issues (Blocking Core Functionality)

### 1. RSVP Loading Error ❌ CRITICAL
**Error**: `Failed to fetch activity RSVPs`  
**Location**: `components/admin/InlineRSVPEditor.tsx:87:15`  
**Impact**: Cannot view or manage guest RSVPs  
**Status**: Needs investigation - API may be returning error

---

### 2. Guest Layout Cookie Error ❌ CRITICAL
**Error**: `nextCookies.get is not a function`  
**Location**: `app/guest/layout.tsx:16:47`  
**Impact**: Guest portal completely broken  
**Root Cause**: Using deprecated `createServerComponentClient({ cookies })`  
**Fix**: Update to `@supabase/ssr` pattern

---

### 3. Transportation Page - RLS Error ❌ CRITICAL
**Error**: `permission denied for table users`  
**API Response**: 
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "permission denied for table users",
    "details": {"code": "42501"}
  }
}
```
**Impact**: Transportation page completely broken  
**Root Cause**: RLS policy issue or incorrect table access

---

### 4. Vendors Page - Events API 500 Error ❌ CRITICAL
**Error**: `Failed to fetch events: 500 "Internal Server Error"`  
**Location**: `app/admin/vendors/page.tsx:164:17`  
**Impact**: Cannot load vendor bookings page  
**Root Cause**: `/api/admin/events?pageSize=1000` returning 500 error

---

## High Priority Issues

### 5. Photos Page - Validation Error ⚠️ HIGH
**Error**: 
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid filter parameters",
    "details": [{
      "expected": "'event' | 'activity' | 'accommodation' | 'memory'",
      "received": "null",
      "code": "invalid_type",
      "path": ["page_type"]
    }]
  }
}
```
**Impact**: Photos page not displaying any photos  
**Root Cause**: API expecting page_type parameter but receiving null

---

### 6. System Settings Table Missing ⚠️ HIGH
**Error**: `Could not find the table 'public.system_settings' in the schema cache`  
**Impact**: Settings functionality broken  
**Root Cause**: Missing database table or migration not applied

---

### 7. Admin Users Page Missing ⚠️ HIGH
**Issue**: Navigation shows "Admin Users" but page doesn't exist  
**Impact**: Cannot manage admin users  
**Root Cause**: Page not implemented despite navigation link

---

### 8. Event Location Dropdown Empty ⚠️ HIGH
**Issue**: Location dropdown not populating when creating/editing events  
**Impact**: Cannot assign locations to events  
**Root Cause**: No locations exist OR locations not loading  
**Note**: User reports "No location exists"

---

### 9. Event Detail Page - No Content ⚠️ HIGH
**Issue**: Event detail page shows no information  
**Impact**: Cannot view event details  
**Note**: User reports "there's a related activity" but it's not showing

---

### 10. Accommodation Location Not Working ⚠️ HIGH
**Issue**: Location field not working on accommodations  
**Impact**: Cannot assign locations to accommodations  
**Related**: Same issue as event locations

---

### 11. Accommodation Event Link Missing ⚠️ HIGH
**Issue**: Accommodations not showing link to related event  
**Impact**: Cannot see event-accommodation relationships  
**Root Cause**: UI not displaying event relationship

---

## Medium Priority Issues (UX/Feature Requests)

### 12. Home Page Section Editor UX 💡 MEDIUM
**Request**: Section editor should be on same page, not separate page  
**Current**: Clicking "Manage Sections" opens new page  
**Desired**: Inline section editor like content pages  
**Reference**: Content pages have inline section editing

---

### 13. Room Types Navigation 💡 MEDIUM
**Request**: Room types should be nested under accommodations  
**Current**: Separate navigation  
**Desired**: Hierarchical navigation structure  
**Benefit**: Better organization and discoverability

---

### 14. Draft Content Preview 💡 MEDIUM
**Request**: Ability to preview draft content pages, draft activities, draft events, and draft accomodations 
**Current**: No preview for draft content  
**Desired**: Preview button for draft pages  
**Benefit**: Review content before publishing

---

## Issue Categories

### Cookie/Auth Issues (2)
- Guest layout cookie error
- (RSVP error may be auth-related)

### RLS/Permission Issues (2)
- Transportation users table permission
- System settings table missing

### API/Validation Issues (3)
- Photos page validation error
- Vendors events API 500 error
- RSVP loading error

### Missing Features/Pages (2)
- Admin users page
- Draft content preview

### Data Loading Issues (4)
- Event location dropdown
- Accommodation location
- Event detail page content
- Accommodation event link

### UX Improvements (2)
- Home page section editor inline
- Room types navigation hierarchy

---

## Priority Fix Order

### Immediate (Blocks Core Features)
1. **Guest Layout Cookie Error** - Entire guest portal broken
2. **Transportation RLS Error** - Page completely broken
3. **Vendors Events API Error** - Page completely broken
4. **RSVP Loading Error** - RSVP management broken

### High Priority (Major Features Broken)
5. **Photos Page Validation** - Photo management broken
6. **System Settings Table** - Settings broken
7. **Event Location Dropdown** - Event creation broken
8. **Accommodation Location** - Accommodation creation broken
9. **Event Detail Page** - Event viewing broken

### Medium Priority (Missing Features)
10. **Admin Users Page** - Create missing page
11. **Accommodation Event Link** - Add UI for relationship
12. **Draft Content Preview** - Add preview functionality

### Low Priority (UX Improvements)
13. **Home Page Section Editor** - Make inline
14. **Room Types Navigation** - Improve hierarchy

---

## Root Cause Analysis

### Pattern 1: Cookie Compatibility (2 instances)
**Files Affected**:
- `app/guest/layout.tsx` (confirmed)
- Possibly RSVP API routes (already fixed in Round 3)

**Solution**: Systematic audit of all files using `createServerComponentClient`

### Pattern 2: RLS Policies (2 instances)
**Issues**:
- Transportation accessing `users` table
- System settings table access

**Solution**: Review and fix RLS policies, ensure proper table access

### Pattern 3: API Validation (2 instances)
**Issues**:
- Photos API expecting page_type
- Events API returning 500

**Solution**: Fix API validation schemas and error handling

### Pattern 4: Missing Data/Features (5 instances)
**Issues**:
- No locations exist
- Event detail page empty
- Admin users page missing
- System settings table missing
- Accommodation event link missing

**Solution**: Create missing features, seed data, implement UI

---

## Testing Checklist

### Critical Fixes
- [ ] Guest portal loads without cookie errors
- [ ] Transportation page loads without RLS errors
- [ ] Vendors page loads without API errors
- [ ] RSVP expansion works without errors

### High Priority Fixes
- [ ] Photos page displays photos correctly
- [ ] System settings page works
- [ ] Event location dropdown populates
- [ ] Accommodation location works
- [ ] Event detail page shows content

### Feature Implementation
- [ ] Admin users page exists and works
- [ ] Accommodation shows event link
- [ ] Draft content preview works

### UX Improvements
- [ ] Home page has inline section editor
- [ ] Room types navigation improved

---

## Files to Investigate/Fix

### Immediate Priority
1. `app/guest/layout.tsx` - Cookie error
2. `app/admin/transportation/page.tsx` - RLS error
3. `app/api/admin/events/route.ts` - 500 error
4. `app/api/admin/guests/[id]/rsvps/route.ts` - Already fixed?

### High Priority
5. `app/admin/photos/page.tsx` - Validation error
6. `app/admin/settings/page.tsx` - System settings
7. `app/admin/events/page.tsx` - Location dropdown
8. `app/admin/accommodations/page.tsx` - Location field
9. `app/event/[slug]/page.tsx` - Event detail page

### Feature Implementation
10. `app/admin/admin-users/page.tsx` - Create page
11. `app/admin/home-page/page.tsx` - Inline section editor
12. Database migrations - System settings table

---

## Next Steps

1. **Fix critical cookie error in guest layout** (blocks entire guest portal)
2. **Fix transportation RLS error** (page completely broken)
3. **Fix vendors events API error** (page completely broken)
4. **Investigate RSVP loading error** (may be related to API fixes)
5. **Fix photos page validation** (photo management broken)
6. **Create system settings table** (settings broken)
7. **Fix location dropdowns** (event/accommodation creation broken)
8. **Implement missing features** (admin users, event links, preview)
9. **UX improvements** (inline editors, navigation)

---

## Notes

- Many issues are interconnected (cookie pattern, RLS policies)
- Some issues may be data-related (no locations exist)
- Need to verify which fixes from Round 3 are actually working
- Consider creating seed data for testing (locations, etc.)
- May need database migrations for missing tables

---

## Related Documents

- `MANUAL_TESTING_BUGS_ROUND_3.md` - Previous round issues
- `MANUAL_TESTING_BUGS_ROUND_3_FIXES.md` - Previous fixes
- `MANUAL_TESTING_BUGS_ROUND_2_FIXES.md` - Round 2 fixes
- `API_COOKIES_FIX_AND_UX_IMPROVEMENT.md` - Cookie fix patterns
