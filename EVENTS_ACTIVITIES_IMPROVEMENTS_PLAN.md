# Events & Activities Improvements Plan

## Issues Identified

1. ✅ **Bulk Delete** - Need ability to select multiple items and delete in bulk
2. ⚠️ **Events Location Lookup** - Location selector not working properly
3. ⚠️ **Events Reference Blocks** - References not working for events
4. ✅ **Events Inline Section Manager** - Already implemented but may need verification
5. ⚠️ **Reference Details Not Flowing Through** - Preview details not displaying correctly

## Current Status

### Already Implemented ✅
- **InlineSectionEditor**: Already integrated in events page (line 528-533)
- **Bulk Selection**: DataTable component already supports `selectable` prop and `onBulkDelete`
- **Reference API**: Endpoint exists at `/api/admin/references/[type]/[id]/route.ts`

### Issues to Fix

#### 1. Bulk Delete Not Enabled
**Problem**: Events and Activities pages don't have bulk delete enabled
**Solution**: 
- Add `selectable={true}` to DataTable
- Add `onBulkDelete` handler
- Create bulk delete API endpoint

#### 2. Location Lookup Not Working
**Problem**: LocationSelector may not be properly integrated or locations not loading
**Solution**:
- Verify LocationSelector is receiving locations data
- Check if locations are being fetched correctly
- Ensure location selection is being saved

#### 3. Reference Details Not Flowing Through
**Problem**: Reference preview cards not showing details (date, capacity, location, etc.)
**Solution**:
- Check if API is returning correct data structure
- Verify ReferencePreview component is reading `details` correctly
- Ensure guest-side SectionRenderer is using correct data structure

## Implementation Plan

### Phase 1: Bulk Delete (Priority: HIGH)
1. Add bulk delete API endpoints:
   - `POST /api/admin/events/bulk-delete`
   - `POST /api/admin/activities/bulk-delete`
2. Update events page to enable bulk selection
3. Update activities page to enable bulk selection
4. Add confirmation dialog for bulk operations

### Phase 2: Location Lookup Fix (Priority: HIGH)
1. Debug location fetching in events page
2. Verify LocationSelector integration
3. Test location save functionality
4. Add error handling for location operations

### Phase 3: Reference Details Fix (Priority: MEDIUM)
1. Verify API response structure
2. Update ReferencePreview to handle all detail types
3. Update SectionRenderer to display reference details
4. Test with all entity types (events, activities, accommodations, etc.)

### Phase 4: Testing (Priority: HIGH)
1. Manual testing of bulk delete
2. Manual testing of location selection
3. Manual testing of reference previews
4. Add automated tests for new functionality

## Technical Details

### Bulk Delete API Pattern
```typescript
POST /api/admin/events/bulk-delete
Body: { ids: string[] }
Response: { success: boolean, data: { deleted: number } }
```

### DataTable Bulk Selection
```typescript
<DataTable
  data={events}
  columns={columns}
  selectable={true}
  onBulkDelete={handleBulkDelete}
  idField="id"
  // ... other props
/>
```

### Reference Details Structure
```typescript
interface ReferenceDetails {
  // Event
  eventType?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  
  // Activity
  activityType?: string;
  capacity?: number;
  attendees?: number;
  costPerPerson?: number;
  
  // Accommodation
  checkInDate?: string;
  checkOutDate?: string;
  address?: string;
  roomTypeCount?: number;
}
```

## Files to Modify

1. **app/admin/events/page.tsx** - Add bulk delete, verify location selector
2. **app/admin/activities/page.tsx** - Add bulk delete
3. **app/api/admin/events/bulk-delete/route.ts** - Create new endpoint
4. **app/api/admin/activities/bulk-delete/route.ts** - Create new endpoint
5. **components/admin/ReferencePreview.tsx** - Verify details rendering
6. **components/guest/SectionRenderer.tsx** - Verify details rendering
7. **app/api/admin/references/[type]/[id]/route.ts** - Verify response structure

## Success Criteria

- [ ] Can select multiple events and delete in bulk
- [ ] Can select multiple activities and delete in bulk
- [ ] Location selector works correctly in events form
- [ ] Selected location is saved with event
- [ ] Reference preview cards show all relevant details
- [ ] Guest-side reference cards show details correctly
- [ ] All operations have proper error handling
- [ ] Confirmation dialogs prevent accidental deletions
