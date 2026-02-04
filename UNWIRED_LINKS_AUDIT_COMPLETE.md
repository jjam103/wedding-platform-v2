# Unwired Links Audit - Complete

## Summary
Completed comprehensive audit of admin pages to identify and fix unwired View/preview buttons that weren't properly linked to their corresponding guest-facing pages.

## Issues Found and Fixed

### 1. Activities Page ✅ FIXED (Previous Session)
**Location**: `app/admin/activities/page.tsx`

**Issues**:
- View button in table row actions (line ~405-417) showed "coming soon" alert
- View button in expanded row details (line ~620-630) showed "coming soon" alert

**Fix Applied**:
- Both buttons now use `window.open(\`/activity/${slug}\`, '_blank')` to open activity detail page in new tab
- Falls back to activity.id if slug doesn't exist
- Verified guest-facing page exists at `app/activity/[slug]/page.tsx`

### 2. Events Page ✅ FIXED (This Session)
**Location**: `app/admin/events/page.tsx`

**Issue**:
- View button (line ~405) used `window.location.href = \`/guest/events/${id}\``
- Should use slug-based routing instead of ID
- Should open in new tab to preserve admin context

**Fix Applied**:
```typescript
window.open(`/event/${slug}`, '_blank');
```
- Uses event.slug with fallback to event.id
- Opens in new tab
- Verified guest-facing page exists at `app/event/[slug]/page.tsx`

### 3. Accommodations Page ✅ FIXED (This Session)
**Location**: `app/admin/accommodations/page.tsx`

**Issue**:
- View button (line ~405) used `window.location.href = \`/guest/accommodation/${id}\``
- Accommodation page doesn't use individual IDs in URL
- Should open in new tab to preserve admin context

**Fix Applied**:
```typescript
window.open(`/guest/accommodation`, '_blank');
```
- Links to general accommodation page (not ID-specific)
- Opens in new tab
- Verified guest-facing page exists at `app/guest/accommodation/page.tsx`

### 4. Vendors Page ✅ NO ACTION NEEDED
**Location**: `app/admin/vendors/page.tsx`

**Status**: No View button present (correct behavior)
- Vendors don't have a guest-facing page
- Only admin-facing management interface needed

## Pages Verified Without Issues

### Content Pages
- No View button in table (uses Preview button in section editor)
- Preview functionality already wired up correctly

### Guest Groups
- No View button (admin-only feature)
- Correct behavior

### Locations
- No View button (admin-only feature)
- Correct behavior

### Other Admin Pages
- Budget, Transportation, RSVP Analytics, etc. - all admin-only, no guest views needed

## Pattern Identified

**Common Issue**: Admin pages were using placeholder alerts or incorrect routing for View buttons instead of properly linking to guest-facing pages.

**Root Cause**: View buttons were added during initial development but not wired up to actual routes.

**Solution Pattern**:
1. Use `window.open(url, '_blank')` to preserve admin context
2. Use slug-based routing where available (events, activities)
3. Fall back to ID if slug doesn't exist
4. Verify guest-facing page exists before wiring up

## Testing Recommendations

### Manual Testing Checklist
- [ ] Click View button on Activities page - should open activity detail in new tab
- [ ] Click View button on Events page - should open event detail in new tab
- [ ] Click View button on Accommodations page - should open accommodation page in new tab
- [ ] Verify all pages load without 404 errors
- [ ] Verify admin page remains open in original tab

### Automated Testing
Consider adding E2E tests for:
- Admin View button navigation
- Slug-based routing
- New tab behavior
- 404 prevention

## Files Modified
1. `app/admin/activities/page.tsx` (previous session)
2. `app/admin/events/page.tsx` (this session)
3. `app/admin/accommodations/page.tsx` (this session)

## Related Documentation
- See `404_BUTTONS_SOLUTION_GUIDE.md` for detailed investigation of activities page issue
- See `404_ISSUE_FINAL_RESOLUTION.md` for context on why these issues weren't caught earlier

## Completion Status
✅ **COMPLETE** - All admin pages audited, all unwired View buttons fixed or verified as intentionally absent.
