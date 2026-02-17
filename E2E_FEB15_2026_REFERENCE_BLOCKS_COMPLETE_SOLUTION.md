# E2E Reference Blocks Guest View - Complete Solution

## Date: February 15, 2026

## Status: ✅ Code Fixed - ⏳ Migration Pending

## Summary
Fixed the E2E test "should display reference blocks in guest view" by creating a guest-accessible API for reference previews and updating middleware to allow public access. The only remaining step is applying migration 058 via Supabase SQL Editor.

## Changes Made

### 1. ✅ Middleware Updated
**File:** `middleware.ts`

Added `/api/guest/references` to public routes to allow anonymous access:

```typescript
if (
  pathname.startsWith('/auth') ||
  pathname === '/' ||
  pathname.startsWith('/api/auth') ||
  pathname.startsWith('/api/guest-auth') ||
  pathname.startsWith('/api/guest/references') ||  // ✅ NEW: Public reference previews
  pathname.startsWith('/_next') ||
  pathname.startsWith('/static')
) {
  return NextResponse.next();
}
```

### 2. ✅ Guest API Route Created
**File:** `app/api/guest/references/[type]/[id]/route.ts`

Created new API endpoint for fetching reference details:
- Supports: events, activities, content_pages, accommodations, locations
- Uses Next.js 15 async params pattern
- Joins with locations table for location names
- Returns formatted data with type-specific details

**Key Features:**
- Public access (no authentication required)
- Proper column names (start_date vs start_time for events)
- Location join for location names
- Type-safe response formatting

### 3. ✅ Component Updated
**File:** `components/guest/GuestReferencePreview.tsx`

Changed API endpoint from admin to guest:
```typescript
// Before: const response = await fetch(`/api/admin/references/${reference.type}/${reference.id}`);
// After:  const response = await fetch(`/api/guest/references/${reference.type}/${reference.id}`);
```

### 4. ⏳ Migration Created (Needs Manual Application)
**File:** `supabase/migrations/058_allow_public_access_to_references.sql`

Created RLS policies to allow public read access to published items.

## Migration 058 - Manual Application Required

The migration needs to be applied via **Supabase SQL Editor**:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Create a new query

### Step 2: Copy and Execute This SQL

```sql
-- Migration 058: Allow public access to references for guest views

-- Events: Allow public read access to published, non-deleted events
DROP POLICY IF EXISTS "Public can view published events" ON events;
CREATE POLICY "Public can view published events"
ON events FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Activities: Allow public read access to published, non-deleted activities
DROP POLICY IF EXISTS "Public can view published activities" ON activities;
CREATE POLICY "Public can view published activities"
ON activities FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Content Pages: Allow public read access to published, non-deleted pages
DROP POLICY IF EXISTS "Public can view published content pages" ON content_pages;
CREATE POLICY "Public can view published content pages"
ON content_pages FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Accommodations: Allow public read access to published, non-deleted accommodations
DROP POLICY IF EXISTS "Public can view published accommodations" ON accommodations;
CREATE POLICY "Public can view published accommodations"
ON accommodations FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Locations: Allow public read access to non-deleted locations
DROP POLICY IF EXISTS "Public can view locations" ON locations;
CREATE POLICY "Public can view locations"
ON locations FOR SELECT
TO public
USING (deleted_at IS NULL);
```

### Step 3: Verify Migration Applied

Run this test script:
```bash
node --env-file=.env.local scripts/test-guest-reference-api.mjs
```

Expected output:
```
✅ Event created: [uuid]
✅ API returned success
```

### Step 4: Run E2E Test

```bash
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view" --reporter=list
```

Expected: Test passes ✅

## Why This Fix Was Needed

### Root Cause
The reference preview component was trying to fetch data from `/api/admin/references/*` which:
1. Required admin authentication (blocked by middleware)
2. Didn't exist as a guest-accessible endpoint

### Why Tests Didn't Catch This
1. The test creates data and navigates to the guest view
2. The component renders the reference cards successfully
3. But when clicking to expand details, the API call fails silently
4. The component shows "Details could not be loaded" fallback text
5. The test was checking for event details in the expanded view

### Security Considerations
The new public policies are safe because:
- Only `published` items are accessible
- Only non-deleted items (`deleted_at IS NULL`)
- No write access granted
- Follows principle of least privilege

## Files Changed

1. `middleware.ts` - Added public route exception
2. `app/api/guest/references/[type]/[id]/route.ts` - New guest API
3. `components/guest/GuestReferencePreview.tsx` - Updated API endpoint
4. `supabase/migrations/058_allow_public_access_to_references.sql` - New migration

## Testing Checklist

After applying migration 058:

- [ ] Run diagnostic script: `node --env-file=.env.local scripts/test-guest-reference-api.mjs`
- [ ] Verify API returns success (not 404)
- [ ] Run E2E test: `npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"`
- [ ] Verify test passes
- [ ] Manually test in browser: Create a content page with reference blocks, view as guest, click to expand
- [ ] Verify reference details load correctly

## Next Steps

1. **Apply migration 058** via Supabase SQL Editor (see Step 2 above)
2. **Verify** with test script
3. **Run E2E test** to confirm fix
4. **Commit changes** to repository

## Related Documentation

- `E2E_FEB15_2026_REFERENCE_BLOCKS_MIGRATION_NEEDED.md` - Initial analysis
- `supabase/migrations/058_allow_public_access_to_references.sql` - Migration file
- `scripts/test-guest-reference-api.mjs` - Diagnostic script

## Success Criteria

✅ Middleware allows public access to `/api/guest/references/*`  
✅ Guest API route created and handles all reference types  
✅ Component updated to use guest API  
✅ Migration created with proper RLS policies  
⏳ Migration applied via Supabase SQL Editor  
⏳ E2E test passes  
⏳ Manual testing confirms reference previews work in guest view
