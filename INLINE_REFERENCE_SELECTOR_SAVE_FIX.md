# Inline Reference Selector - Section Save Fix

## Issue
When trying to save sections (even simple ones with just rich text), getting 400 Bad Request errors. The validation was failing but not providing clear error details.

## Root Cause
The `columnDataSchema` in `schemas/cmsSchemas.ts` was using a regular union for `content_data`, which made Zod validation less precise. When validation failed, it wasn't clear which part of the union was being matched against.

```typescript
// OLD - Regular union (less precise validation)
export const columnDataSchema = z.object({
  column_number: z.union([z.literal(1), z.literal(2)]),
  content_type: z.enum(['rich_text', 'photo_gallery', 'references']),
  content_data: z.union([
    richTextContentSchema,
    photoGalleryContentSchema,
    referencesContentSchema,
  ]),
});
```

## Solution
Changed to a **discriminated union** based on `content_type`. This ensures that:
1. Zod knows which schema to validate against based on the `content_type` field
2. Validation errors are more specific and actionable
3. The schema structure matches the actual data structure more closely

```typescript
// NEW - Discriminated union (precise validation)
export const columnDataSchema = z.discriminatedUnion('content_type', [
  z.object({
    column_number: z.union([z.literal(1), z.literal(2)]),
    content_type: z.literal('rich_text'),
    content_data: richTextContentSchema,
  }),
  z.object({
    column_number: z.union([z.literal(1), z.literal(2)]),
    content_type: z.literal('photo_gallery'),
    content_data: photoGalleryContentSchema,
  }),
  z.object({
    column_number: z.union([z.literal(1), z.literal(2)]),
    content_type: z.literal('references'),
    content_data: referencesContentSchema,
  }),
]);
```

## Benefits
1. **Better validation**: Zod discriminates based on `content_type` and validates only the relevant schema
2. **Clearer errors**: If validation fails, the error will point to the specific field in the specific content type
3. **Type safety**: TypeScript can better infer the correct type based on the discriminator

## Files Changed
- `schemas/cmsSchemas.ts` - Updated `columnDataSchema` to use discriminated union

## Testing
Try saving a section again:
1. Edit any section with rich text content
2. Click "Save Section"
3. Should now save successfully
4. If there's still an error, the console will show much clearer validation details

## Next Steps
If the issue persists:
1. Check the browser console for the detailed error response
2. The error should now clearly indicate which field is failing validation
3. We can then fix the specific field issue

## Related Files
- `components/admin/SectionEditor.tsx` - Component that sends the save request
- `app/api/admin/sections/[id]/route.ts` - API route that validates the request
- `lib/apiHelpers.ts` - Contains `validateBody` function
- `services/sectionsService.ts` - Service layer that handles the update
