# Reference Search Fix

## Issue

The reference section in the Section Editor was showing "Search failed" when trying to search for references (events, activities, pages, accommodations). Users could not add references to sections.

## Root Cause

The API route `/api/admin/references/search/route.ts` was querying the database with incorrect column names:

1. **Events table**: API was querying for `title` but the actual column is `name`
2. **Activities table**: API was querying for `title` and `date` but the actual columns are `name` and `start_time`
3. **Accommodations**: The room count query was using an incorrect aggregation pattern

## Fix Applied

### 1. Fixed Events Query
```typescript
// Before (incorrect)
.select('id, title, slug, date, location_id, locations(name)')
.or(`title.ilike.%${query}%,description.ilike.%${query}%`)

// After (correct)
.select('id, name, slug, date, location_id, locations(name)')
.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
```

### 2. Fixed Activities Query
```typescript
// Before (incorrect)
.select('id, title, slug, date, capacity, location_id, locations(name)')
.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
.order('date', { ascending: true })

// After (correct)
.select('id, name, slug, start_time, capacity, location_id, locations(name)')
.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
.order('start_time', { ascending: true })
```

### 3. Fixed Accommodations Room Count
```typescript
// Before (incorrect - complex aggregation)
.select('id, name, slug, location_id, locations(name), room_types(count)')

// After (correct - separate count query)
.select('id, name, slug, location_id, locations(name)')
// Then fetch room counts separately for each accommodation
const { count } = await supabase
  .from('room_types')
  .select('*', { count: 'exact', head: true })
  .eq('accommodation_id', accommodation.id);
```

## Database Schema Reference

From `supabase/migrations/001_create_core_tables.sql`:

**Events table:**
- Column: `name TEXT NOT NULL` (not `title`)
- Column: `date TIMESTAMPTZ NOT NULL`

**Activities table:**
- Column: `name TEXT NOT NULL` (not `title`)
- Column: `start_time TIMESTAMPTZ NOT NULL` (not `date`)
- Column: `end_time TIMESTAMPTZ`

**Content Pages table:**
- Column: `title TEXT NOT NULL` (this one is correct)

## Testing

To test the fix:

1. Navigate to any content page editor (e.g., `/admin/content-pages`)
2. Create or edit a section with "Two Columns" layout
3. Set Column 2 to "References"
4. Type a search query (e.g., "yoga", "wedding", "hotel")
5. Verify that:
   - Search results appear for matching events, activities, pages, and accommodations
   - Each result shows the correct name and metadata
   - Clicking a result adds it as a reference
   - The reference displays correctly in the section

## Impact

This fix restores the ability to:
- Search for and add event references to sections
- Search for and add activity references to sections
- Search for and add page references to sections
- Search for and add accommodation references to sections

The reference system is now fully functional, allowing content editors to create rich, interconnected content pages.

## Files Modified

- `app/api/admin/references/search/route.ts` - Fixed column names and queries

## Related Components

- `components/admin/InlineReferenceSelector.tsx` - Frontend component (no changes needed)
- `components/admin/SectionEditor.tsx` - Uses the reference selector (no changes needed)
- `components/guest/SectionRenderer.tsx` - Renders references on guest-facing pages (no changes needed)
