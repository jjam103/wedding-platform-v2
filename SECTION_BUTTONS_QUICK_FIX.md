# Section Buttons 404 - Quick Fix Summary

## Issue

"Manage Sections" buttons in multiple admin pages navigate to non-existent routes, causing 404 errors.

## Affected Pages

1. ✅ **Events** - Fixed (`app/admin/events/page.tsx`)
2. **Activities** - Needs fix (`app/admin/activities/page.tsx`)
3. **Accommodations** - Needs fix (`app/admin/accommodations/page.tsx`)
4. **Room Types** - Needs fix (`app/admin/accommodations/[id]/room-types/page.tsx`)
5. **Content Pages** - Needs fix (`app/admin/content-pages/page.tsx`)

## Quick Fix Applied to Events Page

```typescript
// Commented out the handler
// const handleManageSections = useCallback((event: Event) => {
//   router.push(`/admin/events/${event.id}/sections`);
// }, [router]);

// Commented out the button
{/* TODO: Implement sections management page
<Button onClick={...}>Manage Sections</Button>
*/}
```

## Remaining Work

Apply the same pattern to the other 4 pages:
- Comment out `handleManageSections` function
- Comment out the "Manage Sections" button
- Add TODO comment for future implementation

## Alternative: Complete Implementation

Instead of commenting out, could implement proper section management pages:
- Create `/admin/events/[id]/sections/page.tsx`
- Create `/admin/activities/[id]/sections/page.tsx`
- Create `/admin/accommodations/[id]/sections/page.tsx`
- Create `/admin/room-types/[id]/sections/page.tsx`
- Create `/admin/content-pages/[id]/sections/page.tsx`

Each would use the `SectionEditor` component that already exists.

## Recommendation

For now: Comment out buttons (5 minutes)
Later: Implement proper section pages (2-3 hours)

## Status

- [x] Events page fixed
- [ ] Apply same fix to remaining 4 pages
- [ ] Test all pages
- [ ] Move on to testing improvements implementation
