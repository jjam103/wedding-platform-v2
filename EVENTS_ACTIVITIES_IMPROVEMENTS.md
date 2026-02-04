# Events & Activities Improvements - Implementation Plan

## Issues Identified

1. **Bulk Delete** - Need ability to select multiple items and delete in bulk
2. **Events Location Lookup** - Location selector not working on events page
3. **Events Reference Blocks** - Reference functionality not working for events
4. **Events Inline Section Manager** - Events should have same section editor as content pages
5. **Reference Details Not Flowing** - Reference preview details not displaying properly

## Implementation Plan

### 1. Bulk Delete for Activities & Events ✅

**Status**: DataTable already supports bulk delete!

**What's needed**:
- Enable `selectable` prop on DataTable
- Implement `onBulkDelete` handler
- Add bulk delete confirmation dialog

**Files to modify**:
- `app/admin/activities/page.tsx`
- `app/admin/events/page.tsx`

### 2. Events Location Lookup Fix

**Issue**: LocationSelector not properly integrated in events form

**Root cause**: Location selector is a custom field outside the CollapsibleForm, may not be properly connected

**Solution**:
- Verify LocationSelector is receiving correct props
- Ensure location data is being fetched
- Check that selected location is being submitted with form data

**Files to check**:
- `app/admin/events/page.tsx` (LocationSelector integration)
- `components/admin/LocationSelector.tsx` (component implementation)

### 3. Events Reference Blocks Fix

**Issue**: Reference functionality not working for events

**Root cause**: Events may not be properly configured in reference system

**Solution**:
- Verify events table has necessary fields (slug, etc.)
- Check reference API supports 'event' type
- Ensure reference search includes events
- Add event reference preview rendering

**Files to check**:
- `app/api/admin/references/[type]/[id]/route.ts` (API endpoint)
- `app/api/admin/references/search/route.ts` (search endpoint)
- `components/admin/ReferencePreview.tsx` (preview rendering)

### 4. Events Inline Section Manager

**Issue**: Events don't have inline section editor like content pages

**Solution**:
- Add InlineSectionEditor component to events page
- Configure it to work with pageType="event"
- Show it when editing an existing event

**Files to modify**:
- `app/admin/events/page.tsx` (add InlineSectionEditor)

### 5. Reference Details Not Flowing Through

**Issue**: Reference preview details not displaying properly

**Root cause**: API may not be returning complete details, or preview component not rendering them

**Solution**:
- Verify API returns all necessary fields
- Check ReferencePreview component renders details correctly
- Ensure SectionRenderer displays reference details on guest side

**Files to check**:
- `app/api/admin/references/[type]/[id]/route.ts` (API response)
- `components/admin/ReferencePreview.tsx` (admin preview)
- `components/guest/SectionRenderer.tsx` (guest preview)

## Implementation Order

1. ✅ Enable bulk delete for activities
2. ✅ Enable bulk delete for events
3. ✅ Add inline section manager to events
4. ✅ Fix events location lookup
5. ✅ Fix reference details flow
6. ✅ Test all functionality

## Testing Checklist

### Bulk Delete
- [ ] Select multiple activities → bulk delete works
- [ ] Select multiple events → bulk delete works
- [ ] Confirmation dialog shows correct count
- [ ] Deletion succeeds and refreshes list
- [ ] Selection clears after delete

### Events Location
- [ ] Location dropdown populates correctly
- [ ] Can select a location
- [ ] Selected location saves with event
- [ ] Location displays in event list
- [ ] Can change location on edit

### Events Sections
- [ ] Section editor appears when editing event
- [ ] Can add/edit sections for events
- [ ] Sections save correctly
- [ ] Sections display on guest event page

### Reference Details
- [ ] Event references show preview info (date, location, type)
- [ ] Activity references show preview info (date, capacity, location)
- [ ] Clicking reference expands to show full details
- [ ] "View Full" button navigates correctly
- [ ] Guest side shows same reference details

## Files to Modify

1. `app/admin/activities/page.tsx` - Add bulk delete
2. `app/admin/events/page.tsx` - Add bulk delete + section editor + fix location
3. `app/api/admin/references/[type]/[id]/route.ts` - Verify event details
4. `components/admin/ReferencePreview.tsx` - Verify detail rendering
5. `components/guest/SectionRenderer.tsx` - Verify guest-side rendering
