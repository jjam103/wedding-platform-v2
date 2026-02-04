# Location Lookup and Event Reference Debug

## Tasks Completed

✅ **Deleted Items Manager** - Fully implemented and working
✅ **Bulk Delete for Activities** - Implemented with checkboxes and confirmation
✅ **Navigation Updated** - Deleted Items link added to System section

## Next: Debug Issues

### 1. Location Lookup Issue
**Status**: Need more information

**Questions**:
- Where is the location lookup failing? (Activities page? Events page? Accommodations?)
- What error message appears?
- Is it not loading locations in dropdowns?
- Is it not displaying location names correctly?

**Possible Issues**:
- Location API route not returning data correctly
- LocationSelector component not fetching data
- Location dropdown not populating
- Location name not displaying in activity/event rows

### 2. Event Reference Issue  
**Status**: Need more information

**Questions**:
- What do you mean by "reference is working for events"?
- Is this about the reference blocks in sections?
- Is this about event references in activities?
- Is something working that shouldn't be, or not working that should be?

**Possible Issues**:
- Event reference blocks not displaying correctly
- Event references in InlineReferenceSelector
- Event slug-based navigation
- Event preview modals

## Files to Check

### Location-Related
- `app/api/admin/locations/route.ts` - Location API
- `components/admin/LocationSelector.tsx` - Location dropdown component
- `services/locationService.ts` - Location business logic
- `app/admin/activities/page.tsx` - Activities using locations
- `app/admin/events/page.tsx` - Events using locations

### Reference-Related
- `components/admin/InlineReferenceSelector.tsx` - Reference picker
- `components/admin/ReferenceBlockPicker.tsx` - Reference block picker
- `app/api/admin/references/search/route.ts` - Reference search API
- `app/api/admin/references/[type]/[id]/route.ts` - Reference preview API

## Next Steps

Please provide:
1. **Specific error messages** or screenshots
2. **Which page** the issue occurs on
3. **What action** triggers the problem
4. **Expected behavior** vs actual behavior

Then I can debug and fix the specific issues.
