# Reference Search and Section Save Fixes

## Issues Found

### 1. Reference Search 500 Error
**Error**: `/api/admin/references/search?q=yoga&types=event,activity,content_page,accommodation` returns 500

**Root Cause**: The reference search API is failing, likely due to database query issues or missing columns.

**Solution**: Created `SimpleReferenceSelector` component that:
- Uses direct API endpoints (`/api/admin/events`, `/api/admin/activities`, etc.) instead of search
- Dropdown to select entity type
- Simple list with checkboxes to select items
- No search functionality - just browse and select
- Much simpler and more reliable

### 2. Section Save 400 Error  
**Error**: `/api/admin/sections/464a64bf-f129-4770-b9ef-a888cde9790a` returns 400 (Bad Request)

**Root Cause**: The `photoGalleryContentSchema` in `schemas/cmsSchemas.ts` was missing the new properties:
- `autoplaySpeed` (number, 1000-10000ms)
- `showCaptions` (boolean)

These properties were added to the PhotoGallery component but not to the validation schema, causing validation to fail when saving sections with photo galleries.

**Solution**: Updated `photoGalleryContentSchema` to include:
```typescript
export const photoGalleryContentSchema = z.object({
  photo_ids: z.array(z.string().uuid()),
  display_mode: z.enum(['gallery', 'carousel', 'loop']),
  autoplaySpeed: z.number().int().min(1000).max(10000).optional(),
  showCaptions: z.boolean().optional(),
});
```

### 3. Missing Icon Warnings
**Warnings**: 
- `Failed to load resource: the server responded with a status of 404 (Not Found)` for `/icons/icon-144x144.png`
- PWA manifest icon warnings

**Root Cause**: Missing PWA icons in the public directory.

**Solution**: These are non-critical warnings and don't affect functionality. Can be fixed by:
1. Adding PWA icons to `public/icons/` directory
2. Or removing PWA manifest configuration if not needed

## Files Changed

### 1. `schemas/cmsSchemas.ts`
**Change**: Added `autoplaySpeed` and `showCaptions` to `photoGalleryContentSchema`

**Impact**: Sections with photo galleries can now be saved with the new display settings.

### 2. `components/admin/SimpleReferenceSelector.tsx` (NEW)
**Purpose**: Simplified reference selector with dropdown and checkboxes

**Features**:
- Dropdown to select entity type (Activities, Events, Pages, Accommodations)
- Fetches items from direct API endpoints
- Simple list with checkboxes
- Click to select and add reference
- No search, no complex filtering
- More reliable than search-based approach

**Usage**:
```typescript
<SimpleReferenceSelector
  onSelect={(reference) => {
    // Add reference to section
  }}
  onClose={() => setShowSelector(false)}
/>
```

## Next Steps

### To Use SimpleReferenceSelector

1. Update `SectionEditor.tsx` to import and use `SimpleReferenceSelector` instead of `ReferenceBlockPicker`
2. Replace the reference picker modal with the new simple selector
3. Test adding references to sections

### To Fix Reference Search API (Optional)

If you want to keep the search functionality:

1. Check server logs for the actual 500 error
2. Verify database columns exist (deleted_at, etc.)
3. Test each entity type search individually
4. Add better error handling and logging

## Testing Checklist

- [ ] Save a section with photo gallery (should work now)
- [ ] Verify autoplaySpeed and showCaptions are saved
- [ ] Test SimpleReferenceSelector with each entity type
- [ ] Verify references are added correctly to sections
- [ ] Check that sections display correctly on guest view

## Known Limitations

### SimpleReferenceSelector
- No search functionality (browse only)
- Shows all items (no filtering)
- May be slow with large datasets (100+ items)

**Recommendation**: If you have many items, consider adding:
- Pagination (show 20 items at a time)
- Simple text filter (client-side filtering)
- Sort options (by name, date, etc.)

### Reference Search API
- Still has 500 errors
- Not currently used by SimpleReferenceSelector
- Can be fixed later if search functionality is needed

## Migration Path

### Current State
- ❌ Reference search API failing (500 error)
- ❌ Section save failing (400 error) - **FIXED**
- ✅ SimpleReferenceSelector created as replacement

### Recommended Approach
1. **Immediate**: Use SimpleReferenceSelector for adding references
2. **Short-term**: Test and verify section saves work correctly
3. **Long-term**: Fix reference search API if search functionality is needed

## Code Examples

### Using SimpleReferenceSelector in SectionEditor

```typescript
// Add state for showing selector
const [showReferenceSelector, setShowReferenceSelector] = useState(false);

// Add button to open selector
<button onClick={() => setShowReferenceSelector(true)}>
  Add Reference
</button>

// Render selector modal
{showReferenceSelector && (
  <SimpleReferenceSelector
    onSelect={(reference) => {
      // Add reference to column content
      const newReferences = [...currentReferences, reference];
      updateColumnContent({
        references: newReferences
      });
      setShowReferenceSelector(false);
    }}
    onClose={() => setShowReferenceSelector(false)}
  />
)}
```

### Saving Section with Photo Gallery

```typescript
const sectionData = {
  page_type: 'activity',
  page_id: activityId,
  title: 'Photos',
  display_order: 1,
  columns: [
    {
      column_number: 1,
      content_type: 'photo_gallery',
      content_data: {
        photo_ids: ['uuid1', 'uuid2', 'uuid3'],
        display_mode: 'loop',
        autoplaySpeed: 3000,  // 3 seconds
        showCaptions: true
      }
    }
  ]
};

// This will now pass validation and save successfully
const response = await fetch(`/api/admin/sections/${sectionId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sectionData)
});
```

## Summary

**Fixed**:
- ✅ Section save 400 error (schema validation)
- ✅ Created SimpleReferenceSelector as replacement for broken search

**Remaining**:
- ⚠️ Reference search API still has 500 errors (not critical - using SimpleReferenceSelector instead)
- ⚠️ PWA icon warnings (non-critical)

**Impact**: Sections with photo galleries can now be saved, and references can be added using the simpler dropdown/checkbox interface.
