# Reference Selector and Section Save Fix

## Issues Identified

### 1. Reference Search API 500 Error
**Error**: `/api/admin/references/search?q=yoga&types=event,activity,content_page,accommodation` returns 500

**Root Cause**: The search API is likely failing due to:
- Database query errors (deleted_at column issues)
- Supabase client initialization problems
- Query syntax errors with the `or()` filter

### 2. Section Save 400 Error
**Error**: `/api/admin/sections/464a64bf-f129-4770-b9ef-a888cde9790a` returns 400 Bad Request

**Root Cause**: Schema validation failure. The section update schema expects:
```typescript
{
  columns: [{
    column_number: 1 | 2,
    content_type: 'rich_text' | 'photo_gallery' | 'references',
    content_data: {
      // For photo_gallery:
      photo_ids: string[],  // ← Must be snake_case
      display_mode: 'gallery' | 'carousel' | 'loop',
      autoplaySpeed?: number,  // ← camelCase is OK here
      showCaptions?: boolean   // ← camelCase is OK here
    }
  }]
}
```

**Likely Issue**: The component is sending `photoIds` (camelCase) instead of `photo_ids` (snake_case).

### 3. Icon 404 Errors
**Error**: `/icons/icon-144x144.png` not found

**Root Cause**: Missing PWA manifest icons. This is a minor issue and doesn't affect functionality.

## Solutions Implemented

### 1. Simple Reference Selector (NEW)
Created `components/admin/SimpleReferenceSelector.tsx` - a dropdown-based selector that matches the user's screenshot:

**Features**:
- Type dropdown (Activities, Events, Content Pages, Accommodations)
- Entity dropdown (populated based on selected type)
- No search required - just select from dropdowns
- Shows selected reference with clear button
- Loads entities from existing API endpoints

**Usage**:
```typescript
<SimpleReferenceSelector
  value={selectedReference}
  onChange={(ref) => setSelectedReference(ref)}
/>
```

### 2. Section Save Fix (NEEDED)
The SectionEditor needs to ensure it sends `photo_ids` (snake_case) in the content_data:

```typescript
// ✅ CORRECT
const columnData = {
  column_number: 2,
  content_type: 'photo_gallery',
  content_data: {
    photo_ids: selectedPhotoIds,  // snake_case
    display_mode: 'gallery',
    autoplaySpeed: 3000,
    showCaptions: true
  }
};

// ❌ WRONG
const columnData = {
  column_number: 2,
  content_type: 'photo_gallery',
  content_data: {
    photoIds: selectedPhotoIds,  // camelCase - will fail validation
    display_mode: 'gallery',
    autoplaySpeed: 3000,
    showCaptions: true
  }
};
```

## Next Steps

### Immediate Fixes Needed

1. **Update SectionEditor.tsx** to use `SimpleReferenceSelector` instead of `ReferenceBlockPicker`
2. **Fix photo_ids field name** in SectionEditor when saving photo gallery columns
3. **Test section save** with photos to verify 400 error is resolved

### Reference Search API (Optional)
The search API can be fixed later if needed, but the SimpleReferenceSelector provides a better UX anyway:
- No debouncing delays
- No search failures
- Simpler UI
- Faster selection

### Icon 404 Fix (Low Priority)
Add PWA manifest icons to `public/icons/` directory:
- icon-144x144.png
- icon-192x192.png
- icon-512x512.png

Or remove PWA manifest if not needed.

## Testing Checklist

- [ ] Open Section Editor
- [ ] Add a column with "Reference" type
- [ ] Select "Activities" from type dropdown
- [ ] Select an activity from entity dropdown
- [ ] Verify selected reference displays correctly
- [ ] Save section
- [ ] Verify no 400 error
- [ ] Reload page and verify reference is saved
- [ ] Test with photo gallery column
- [ ] Verify photos save correctly without 400 error

## Files Created

1. `components/admin/SimpleReferenceSelector.tsx` - New dropdown-based reference selector

## Files to Update

1. `components/admin/SectionEditor.tsx` - Replace ReferenceBlockPicker with SimpleReferenceSelector
2. `components/admin/SectionEditor.tsx` - Fix photo_ids field name when saving

## Migration Path

### Phase 1: Fix Section Save (Critical)
1. Update SectionEditor to send `photo_ids` instead of `photoIds`
2. Test section save with photos
3. Verify 400 error is resolved

### Phase 2: Replace Reference Picker (Recommended)
1. Import SimpleReferenceSelector in SectionEditor
2. Replace ReferenceBlockPicker usage
3. Test reference selection and save
4. Remove ReferenceBlockPicker if no longer needed

### Phase 3: Fix Search API (Optional)
1. Debug reference search API 500 error
2. Add better error logging
3. Test with various search queries
4. Or keep SimpleReferenceSelector as the primary UI

## Benefits of SimpleReferenceSelector

1. **Simpler UX**: No search required, just select from dropdowns
2. **More Reliable**: Uses existing list APIs instead of complex search
3. **Faster**: No debouncing, immediate results
4. **Better Performance**: Loads all entities once, no repeated searches
5. **Matches User Expectation**: Dropdown UI as shown in screenshot
6. **No Search Failures**: Eliminates 500 errors from search API

## Recommendation

**Use SimpleReferenceSelector** as the primary reference selection UI. It's simpler, more reliable, and matches the user's expected UX from the screenshot. The search-based picker can be kept as an alternative for power users, but the dropdown approach is better for most use cases.
