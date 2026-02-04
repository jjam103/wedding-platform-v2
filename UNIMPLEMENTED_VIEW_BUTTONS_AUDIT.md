# Unimplemented View Buttons Audit

## Summary

Audit completed to identify View buttons and navigation links that haven't been properly wired up to open guest-facing pages.

**Date**: February 2, 2026  
**Status**: 2 issues found, 2 already fixed

---

## Issues Found

### 1. Events Admin Page - View Button ❌

**File**: `app/admin/events/page.tsx`  
**Line**: ~371  
**Current Implementation**:
```typescript
<Button
  variant="secondary"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/guest/events/${(row as Event).id}`;
  }}
>
  View
</Button>
```

**Issue**: Uses `window.location.href` which navigates in the same tab instead of opening in a new tab.

**Expected Behavior**: Should open guest-facing event page in new tab using `window.open(..., '_blank')`

**Recommended Fix**:
```typescript
<Button
  variant="secondary"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    const slug = (row as Event).slug || (row as Event).id;
    window.open(`/event/${slug}`, '_blank');
  }}
  title="View event detail page"
>
  View
</Button>
```

**Guest Route**: `/event/[slug]/page.tsx` (exists and is fully implemented)

---

### 2. Accommodations Admin Page - View Button ❌

**File**: `app/admin/accommodations/page.tsx`  
**Line**: ~334  
**Current Implementation**:
```typescript
<Button
  variant="secondary"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/guest/accommodation/${(row as Accommodation).id}`;
  }}
>
  View
</Button>
```

**Issue**: Uses `window.location.href` which navigates in the same tab instead of opening in a new tab.

**Expected Behavior**: Should open guest-facing accommodation page in new tab using `window.open(..., '_blank')`

**Recommended Fix**:
```typescript
<Button
  variant="secondary"
  size="sm"
  onClick={(e) => {
    e.stopPropagation();
    window.open(`/guest/accommodation/${(row as Accommodation).id}`, '_blank');
  }}
  title="View accommodation detail page"
>
  View
</Button>
```

**Guest Route**: ⚠️ **ROUTE MISMATCH** - `/guest/accommodation/page.tsx` exists but is for logged-in guest's own accommodation, not a detail page for viewing any accommodation by ID.

**Additional Issue**: There is no guest-facing accommodation detail page that accepts an ID parameter. The admin View button is trying to navigate to a route that doesn't exist in the expected format.

**Possible Solutions**:
1. Create a new route `/accommodation/[id]/page.tsx` for viewing accommodation details
2. Remove the View button if there's no guest-facing detail page
3. Navigate to a different page (e.g., accommodations list)

---

## Already Fixed ✅

### 1. Activities Admin Page - View Buttons ✅

**File**: `app/admin/activities/page.tsx`  
**Lines**: ~410, ~624  
**Status**: Fixed in previous session

Both View buttons (table row and expanded row) now correctly use:
```typescript
window.open(`/activity/${slug}`, '_blank');
```

**Guest Route**: `/activity/[slug]/page.tsx` ✅

---

### 2. Content Pages Admin Page - View Button ✅

**File**: `app/admin/content-pages/page.tsx`  
**Lines**: Multiple locations  
**Status**: Already implemented correctly

Uses correct pattern:
```typescript
window.open(`/custom/${page.slug}`, '_blank')
```

**Guest Route**: `/[type]/[slug]/page.tsx` (dynamic route) ✅

---

## Intentionally Not Implemented

### Notifications Button (TopBar)

**File**: `components/admin/TopBar.tsx`  
**Status**: Intentionally shows "coming soon" label  
**Reason**: Notifications feature not yet built - this is expected behavior

---

## Pattern Analysis

### Correct Pattern ✅
```typescript
<Button
  onClick={(e) => {
    e.stopPropagation();
    window.open(`/path/${slug}`, '_blank');
  }}
  title="View [entity] detail page"
>
  View
</Button>
```

### Incorrect Pattern ❌
```typescript
<Button
  onClick={(e) => {
    e.stopPropagation();
    window.location.href = `/path/${id}`;
  }}
>
  View
</Button>
```

**Why it matters**:
- `window.location.href` navigates away from admin dashboard (loses context)
- `window.open(..., '_blank')` opens in new tab (preserves admin context)
- Better UX for admins who want to preview while continuing to manage

---

## Verification Results

Routes verified:
- [x] `/event/[slug]/page.tsx` - Event detail page ✅ EXISTS
- [x] `/guest/accommodation/[id]/page.tsx` - ❌ DOES NOT EXIST
  - Found: `/guest/accommodation/page.tsx` (logged-in guest's own accommodation only)
  - Missing: Public accommodation detail page by ID

**Critical Finding**: The Accommodations View button is pointing to a non-existent route. This needs to be addressed before fixing the button behavior.

---

## Recommended Actions

### Immediate Fixes
1. **Fix Events View button** ✅ - Change to `window.open` with new tab (route exists)

### Requires Decision
2. **Accommodations View button** ⚠️ - Route doesn't exist, need to decide:
   - Option A: Create `/accommodation/[id]/page.tsx` guest-facing detail page
   - Option B: Remove View button (no guest-facing page needed)
   - Option C: Navigate to different page (e.g., `/guest/accommodation` - their own room)

### Follow-up
3. **Add E2E tests** - Test View button navigation for all admin pages
4. **Update test coverage** - Ensure regression tests catch this pattern
5. **Document pattern** - Add to code conventions for future admin pages

---

## Testing Checklist

After fixes are applied:
- [ ] Events View button opens in new tab
- [ ] Accommodations View button opens in new tab
- [ ] No 404 errors on guest pages
- [ ] Admin dashboard remains open in original tab
- [ ] All View buttons have consistent behavior
- [ ] E2E tests pass for navigation flows

---

## Related Documentation

- **Previous Fix**: `404_BUTTONS_SOLUTION_GUIDE.md` - Activities View buttons
- **Test Files**: 
  - `app/admin/events/page.guestView.test.tsx`
  - `app/admin/accommodations/page.guestView.test.tsx`
  - `app/admin/activities/page.guestView.test.tsx`
  - `app/admin/content-pages/page.guestView.test.tsx`
