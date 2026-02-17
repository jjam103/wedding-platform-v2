# E2E Test Fix: Reference Blocks Guest View - Migration Required

## Status: Migration 058 Needs Manual Application

## Problem
The E2E test "should display reference blocks in guest view" is failing because:
1. ✅ FIXED: Middleware was blocking `/api/guest/references/*` - now allows public access
2. ✅ FIXED: API route created at `/api/guest/references/[type]/[id]/route.ts`
3. ✅ FIXED: GuestReferencePreview component updated to use guest API instead of admin API
4. ❌ PENDING: RLS policies don't allow anonymous/public access to events, activities, content_pages, accommodations

## Root Cause
The reference preview API needs to read from events, activities, content_pages, and accommodations tables, but these tables have RLS policies that require authentication. Anonymous users (not logged in) cannot read these tables.

## Solution
Migration 058 has been created to add public read access policies for published, non-deleted items:
- `supabase/migrations/058_allow_public_access_to_references.sql`

## Manual Application Required
The migration needs to be applied manually via Supabase SQL Editor:

```sql
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

-- Locations: Already has public access via migration 057, but ensure it's correct
DROP POLICY IF EXISTS "Public can view locations" ON locations;
CREATE POLICY "Public can view locations"
ON locations FOR SELECT
TO public
USING (deleted_at IS NULL);
```

## Files Changed
1. `middleware.ts` - Added `/api/guest/references` to public routes
2. `app/api/guest/references/[type]/[id]/route.ts` - Created guest API for reference details
3. `components/guest/GuestReferencePreview.tsx` - Updated to use guest API
4. `supabase/migrations/058_allow_public_access_to_references.sql` - Created migration

## Next Steps
1. Apply migration 058 via Supabase SQL Editor
2. Run E2E test again: `npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"`
3. Verify reference previews work in guest view

## Test Command
```bash
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view" --reporter=list
```
