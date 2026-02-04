# Section Save Debug Logging Added

## Issue

When trying to save a section with references added via the inline reference selector, getting a 400 Bad Request error from the API.

## Debug Logging Added

Added comprehensive console logging to the `handleSaveSection` function in `SectionEditor.tsx` to help diagnose the validation error:

### Logs Added

1. **Before Save**: Logs the section ID and complete payload being sent
2. **After Response**: Logs the API response
3. **On Error**: Logs detailed error information

### Code Changes

```typescript
console.log('[SectionEditor] Saving section:', sectionId);
console.log('[SectionEditor] Payload:', JSON.stringify(payload, null, 2));

const response = await fetch(`/api/admin/sections/${sectionId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const result = await response.json();
console.log('[SectionEditor] Response:', result);

if (result.success) {
  // ...
} else {
  console.error('[SectionEditor] Save failed:', result.error);
  setError(result.error?.message || 'Failed to save section');
}
```

## Next Steps

1. **Test the save operation** - Try to save a section with references
2. **Check browser console** - Look for the logged payload and response
3. **Identify the validation error** - The API response will show which field is failing validation
4. **Fix the data structure** - Adjust the reference structure if needed

## Expected Payload Structure

Based on the schema, the payload should look like:

```json
{
  "title": "Section Title" | null,
  "columns": [
    {
      "column_number": 1,
      "content_type": "references",
      "content_data": {
        "references": [
          {
            "type": "activity",
            "id": "uuid",
            "name": "Activity Name",
            "metadata": {
              "slug": "activity-slug",
              "date": "2024-01-01",
              "capacity": 50
            }
          }
        ]
      }
    }
  ]
}
```

## Schema Requirements

The `referenceSchema` expects:
- `type`: One of 'activity', 'event', 'accommodation', 'location', 'content_page'
- `id`: UUID string (required)
- `name`: String (optional)
- `label`: String (optional)
- `description`: String (optional)
- `metadata`: Record<string, any> (optional)

## Possible Issues

1. **Missing required fields** - The reference might be missing the `id` or `type`
2. **Invalid type value** - The type might not match the enum
3. **Invalid UUID format** - The `id` might not be a valid UUID
4. **Extra fields** - There might be extra fields that aren't in the schema
5. **Nested structure issue** - The `content_data` structure might not match

## How to Debug

1. Open browser console
2. Try to save a section with references
3. Look for logs starting with `[SectionEditor]`
4. Check the payload structure
5. Check the API response error details
6. Compare with the expected schema

## Files Modified

- `components/admin/SectionEditor.tsx` - Added debug logging to `handleSaveSection`

## Status

**DEBUG LOGGING ADDED** ✅

The logging is now in place. Test the save operation and check the console to see what's causing the validation error.
