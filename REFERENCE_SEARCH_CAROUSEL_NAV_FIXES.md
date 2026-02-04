# Reference Search, Carousel, and Navigation Fixes

**Date**: February 2, 2026
**Status**: ✅ Complete

## Issues Fixed

### 1. Navigation Regression - Sidebar Still Showing ✅

**Problem**: AdminLayout was still using the old Sidebar component instead of the new TopNavigation component that was implemented in the recent migration.

**Root Cause**: The AdminLayout component hadn't been updated to use TopNavigation after the navigation migration.

**Solution**:
- Removed Sidebar import and usage from AdminLayout
- Removed TopBar component (no longer needed with TopNavigation)
- Removed pending photos count logic (not needed in new nav)
- Simplified layout to just TopNavigation + content area
- Kept keyboard shortcuts functionality

**Files Modified**:
- `components/admin/AdminLayout.tsx` - Replaced Sidebar with TopNavigation

**Changes**:
```typescript
// BEFORE: Used Sidebar + TopBar
<Sidebar currentSection={currentSection} pendingPhotosCount={pendingPhotosCount} />
<div className="lg:pl-64">
  <TopBar />
  <main>...</main>
</div>

// AFTER: Uses TopNavigation only
<TopNavigation />
<main>...</main>
```

---

### 2. Photo Carousel Not Advancing ✅

**Problem**: The carousel autoplay wasn't working - photos weren't advancing automatically in loop or carousel mode.

**Root Cause**: The useEffect dependency array was missing `currentIndex`, which prevented the interval from being recreated when the index changed. This caused the interval to become stale and stop advancing.

**Solution**:
- Added `currentIndex` to the useEffect dependency array
- Extended autoplay to work for both 'loop' and 'carousel' modes (not just 'loop')
- This ensures the interval is properly recreated on each advance

**Files Modified**:
- `components/guest/PhotoGallery.tsx` - Fixed autoplay useEffect

**Changes**:
```typescript
// BEFORE: Missing currentIndex dependency
useEffect(() => {
  if (displayMode === 'loop' && photos.length > 1) {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }
}, [displayMode, photos.length, autoplaySpeed]);

// AFTER: Added currentIndex dependency and extended to carousel
useEffect(() => {
  if ((displayMode === 'loop' || displayMode === 'carousel') && photos.length > 1) {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, autoplaySpeed);
    return () => clearInterval(interval);
  }
}, [displayMode, photos.length, autoplaySpeed, currentIndex]);
```

---

### 3. Reference Search Still Failing ✅

**Problem**: Reference search was failing with database errors when searching for references in the Section Editor.

**Root Cause**: The API route was checking for `deleted_at` column on the `accommodations` table, but that table doesn't have soft delete support (no `deleted_at` column). Only events, activities, content_pages, photos, rsvps, sections, and columns have soft delete columns.

**Solution**:
- Removed `deleted_at` check from accommodations query
- Added error logging for each entity type search
- Kept `deleted_at` checks for tables that have it (events, activities, content_pages)
- Added proper error handling to continue searching other types even if one fails

**Files Modified**:
- `app/api/admin/references/search/route.ts` - Fixed deleted_at checks

**Database Schema**:
```
Tables WITH deleted_at:
- events ✅
- activities ✅
- content_pages ✅
- photos ✅
- rsvps ✅
- sections ✅
- columns ✅

Tables WITHOUT deleted_at:
- accommodations ❌
- locations ❌
- guests ❌
- guest_groups ❌
```

**Changes**:
```typescript
// Events, Activities, Content Pages: Keep deleted_at check
.is('deleted_at', null)

// Accommodations: Remove deleted_at check
// (no .is('deleted_at', null) call)

// Added error logging for debugging
if (eventsError) {
  console.error('Events search error:', eventsError);
}
```

---

## Testing Performed

### Navigation
- ✅ Top navigation displays correctly on desktop
- ✅ Mobile hamburger menu works
- ✅ Tab switching works
- ✅ Sub-navigation displays under active tab
- ✅ Active states highlight correctly
- ✅ No sidebar visible

### Photo Carousel
- ✅ Loop mode advances automatically at configured speed
- ✅ Carousel mode advances automatically
- ✅ Manual navigation buttons work
- ✅ Captions display below images (not overlaid)
- ✅ Caption toggle works
- ✅ Autoplay speed configuration works (1-10 seconds)

### Reference Search
- ✅ Search returns events
- ✅ Search returns activities
- ✅ Search returns content pages
- ✅ Search returns accommodations
- ✅ No database errors
- ✅ Results display correctly in picker
- ✅ Clicking result adds reference block

---

## Technical Details

### Why the Carousel Wasn't Advancing

The issue was a React hooks dependency problem. When you use `setInterval` inside a `useEffect`, the interval callback captures the current values of variables at the time it's created. If those values change but the interval isn't recreated, the callback continues using the old values.

In our case:
1. Interval is created with `currentIndex = 0`
2. Interval fires, updates `currentIndex` to 1
3. But the interval callback still has the old closure with `currentIndex = 0`
4. Next time it fires, it tries to update from 0 again, not from 1
5. This causes the carousel to get stuck

**Solution**: Add `currentIndex` to the dependency array so the interval is recreated each time the index changes, ensuring the callback always has the latest value.

### Why Reference Search Was Failing

The Supabase query builder throws an error when you try to filter on a column that doesn't exist. The accommodations table was created before the soft delete feature was added, so it doesn't have a `deleted_at` column.

The migration `048_add_soft_delete_columns.sql` only added `deleted_at` to:
- content_pages
- sections
- columns
- events
- activities
- photos
- rsvps

But NOT to:
- accommodations
- locations
- guests
- guest_groups

**Solution**: Only check `deleted_at` on tables that have the column.

---

## Files Changed

1. `components/admin/AdminLayout.tsx` - Navigation fix
2. `components/guest/PhotoGallery.tsx` - Carousel autoplay fix
3. `app/api/admin/references/search/route.ts` - Reference search fix

---

## Verification Steps

To verify these fixes work:

1. **Navigation**: Visit any admin page and confirm top nav is visible, no sidebar
2. **Carousel**: Create a section with photo gallery in loop/carousel mode, confirm it advances
3. **Reference Search**: Open Section Editor, click "Add Reference Block", search for any entity type

---

## Related Issues

- Previous fix attempts removed `deleted_at` checks but didn't add error logging
- The carousel issue was masked by the fact that manual navigation still worked
- Navigation regression happened during the top nav migration but wasn't caught in testing

---

## Prevention

To prevent similar issues:

1. **Navigation**: Update all layout components when migrating navigation patterns
2. **Carousel**: Always include state variables in useEffect dependencies when using intervals
3. **Reference Search**: Check database schema before adding column filters in queries
4. **Testing**: Add E2E tests for autoplay features and reference search workflows
