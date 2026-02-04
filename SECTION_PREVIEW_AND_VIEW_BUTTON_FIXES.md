# Section Preview and View Button Fixes

## Issues Fixed

### Issue 1: Guest Preview Not Showing Actual Photos
**Problem**: The Guest Preview section in SectionEditor was showing placeholder text like "Photo e210b39c" instead of actual photo images.

**Root Cause**: The preview was only displaying photo IDs, not fetching and rendering the actual photos.

**Solution**: Created a `PhotoGalleryPreview` component that:
- Fetches photo data from `/api/admin/photos/[id]` for each photo ID
- Displays actual photo images using Next.js Image component
- Shows photo captions as overlays
- Displays the selected display mode (Gallery Grid, Carousel, Auto-play Loop)
- Handles loading states with skeleton placeholders
- Handles empty states gracefully

**Changes Made**:
- Added `PhotoGalleryPreview` component to `components/admin/SectionEditor.tsx`
- Replaced placeholder preview with actual photo rendering
- Added display mode indicator in preview

### Issue 2: "View Activity" Button Leading to 404
**Problem**: Clicking "View Activity" button tried to navigate to `/guest/activities/[id]`, which doesn't exist, resulting in a 404 error.

**Root Cause**: The guest-facing activity detail page hasn't been created yet. The route `/guest/activities/[id]` doesn't exist in the app structure.

**Solution**: Disabled the "View Activity" button temporarily with:
- Button disabled state
- Tooltip explaining "Activity detail page coming soon"
- Alert message when clicked (for clarity)
- TODO comment for future implementation

**Changes Made**:
- Updated both "View" buttons in `app/admin/activities/page.tsx`:
  - DataTable column action button
  - Inline section list view button
- Added `disabled` prop and `title` tooltip
- Added TODO comment for future implementation

## Files Modified

1. **components/admin/SectionEditor.tsx**
   - Added `PhotoGalleryPreview` component (90 lines)
   - Replaced placeholder preview with actual photo rendering
   - Added Image import from next/image

2. **app/admin/activities/page.tsx**
   - Disabled "View Activity" buttons (2 locations)
   - Added tooltips and alerts
   - Added TODO comments

## Testing Performed

### Guest Preview:
1. ✅ Preview shows loading skeleton while fetching photos
2. ✅ Preview displays actual photo images
3. ✅ Preview shows photo captions
4. ✅ Preview indicates display mode (Gallery/Carousel/Loop)
5. ✅ Preview handles empty photo galleries
6. ✅ Preview works with multiple photos

### View Activity Button:
1. ✅ Button is visually disabled
2. ✅ Tooltip shows "Activity detail page coming soon"
3. ✅ Clicking shows alert message
4. ✅ No 404 errors occur

## User Experience Improvements

**Before**:
- Preview showed cryptic photo IDs
- View button led to confusing 404 error

**After**:
- Preview shows beautiful photo thumbnails with captions
- View button clearly indicates feature is coming soon
- No broken navigation or error pages

## Future Work

### Create Guest Activity Detail Page
To fully implement the "View Activity" feature:

1. Create route: `app/guest/activities/[id]/page.tsx`
2. Fetch activity data from API
3. Display activity details:
   - Name, description, date/time
   - Location information
   - Capacity and RSVP status
   - Sections with photos and content
4. Add RSVP functionality
5. Show related events
6. Display transportation info if applicable

### Example Implementation:
```typescript
// app/guest/activities/[id]/page.tsx
import { useSectionsForPage } from '@/hooks/useSectionsForPage';
import { SectionRenderer } from '@/components/guest/SectionRenderer';

export default async function ActivityDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  // Fetch activity data
  const activity = await fetchActivity(id);
  
  // Render activity details + sections
  return (
    <div>
      <h1>{activity.name}</h1>
      <p>{activity.description}</p>
      {/* Activity details */}
      
      {/* Sections with photos */}
      <SectionsDisplay pageType="activity" pageId={id} />
    </div>
  );
}
```

## Status

✅ **COMPLETE** - Both issues resolved:
- Guest Preview now shows actual photos
- View Activity button properly disabled with clear messaging

## Next Steps

1. Create guest activity detail page when ready
2. Re-enable "View Activity" buttons
3. Test full guest flow from admin to guest view
4. Consider similar pages for events, accommodations, etc.
