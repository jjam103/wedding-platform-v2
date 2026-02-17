# E2E Test #10 - ROOT CAUSE FOUND ✅

## The Problem

Test #10 "should display reference blocks in guest view with preview modals" fails because the API cannot fetch event/activity details for anon users.

## Root Cause

The API endpoint `/api/admin/references/[type]/[id]` joins with the `locations` table:

```typescript
.select('id, name, slug, status, start_date, end_date, description, event_type, location_id, locations(name)')
```

However, the `locations` table has an RLS policy that **requires authentication**:

```sql
CREATE POLICY "authenticated_view_locations"
ON locations FOR SELECT
USING (auth.uid() IS NOT NULL);
```

When the guest view (using anon key) tries to fetch event details, the query fails because:
1. Anon users have `auth.uid() = NULL`
2. The RLS policy blocks SELECT on locations
3. The join fails, causing the entire query to return no results
4. The API returns 404
5. The component shows "Details could not be loaded"

## Why This Wasn't Caught Earlier

- The test creates events/activities with `status: 'published'` ✅
- The events/activities RLS allows anon SELECT where `deleted_at IS NULL` ✅  
- The API filters by `status = 'published'` ✅
- **BUT** the locations join fails due to RLS ❌

## Solution Options

### Option 1: Add Anon Access to Locations (RECOMMENDED)
Allow anon users to view locations (they're public data anyway):

```sql
-- Migration: Allow anon access to locations for guest view
DROP POLICY IF EXISTS "Guests can view locations" ON locations;
CREATE POLICY "Guests can view locations" 
ON locations FOR SELECT 
USING (deleted_at IS NULL);
```

**Pros**:
- Locations are public information
- Aligns with guest view expectations
- Minimal code changes

**Cons**:
- Exposes location data to anon users (but it's already public in guest view)

### Option 2: Remove Locations Join from API
Don't join with locations, just return location_id:

```typescript
.select('id, name, slug, status, start_date, end_date, description, event_type, location_id')
// Remove: locations(name)
```

**Pros**:
- No RLS policy changes needed
- Simpler query

**Cons**:
- Guest view won't show location names
- Would need separate query to fetch location names

### Option 3: Make Locations Join Optional
Use a LEFT JOIN or handle the case where locations is null:

**Pros**:
- Works even if locations RLS blocks access

**Cons**:
- More complex query logic
- Still doesn't solve the underlying issue

## Recommended Fix

**Option 1** is the best solution because:
1. Locations are meant to be public (shown in guest view)
2. It's a one-line migration
3. It fixes the issue for all guest view scenarios
4. It aligns with the design intent (guests should see location names)

## Implementation

Create migration file: `supabase/migrations/057_allow_anon_access_to_locations.sql`

```sql
-- Migration: Allow anon access to locations for guest view
-- Issue: Guest view cannot fetch event/activity details because locations join fails
-- Solution: Add RLS policy allowing anon SELECT on locations
-- Date: 2026-02-15

DROP POLICY IF EXISTS "Guests can view locations" ON locations;
CREATE POLICY "Guests can view locations" 
ON locations FOR SELECT 
USING (deleted_at IS NULL);

COMMENT ON POLICY "Guests can view locations" ON locations IS 'Allow anon users to view locations for guest view reference blocks';
```

## Test Verification

After applying the migration:

1. Run the specific test:
   ```bash
   npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"
   ```

2. Expected result: ✅ PASS

3. Verify the API returns location names:
   - Event details should include `location: "Location Name"`
   - Activity details should include `location: "Location Name"`

## Files to Update

1. Create: `supabase/migrations/057_allow_anon_access_to_locations.sql`
2. Apply migration to E2E database
3. Apply migration to production database (when ready)

## Impact Analysis

### Security
- ✅ Safe: Locations are public data shown in guest view
- ✅ No sensitive information exposed
- ✅ Still filtered by `deleted_at IS NULL`

### Performance
- ✅ No impact: Same query, just allows anon access

### Functionality
- ✅ Fixes guest view reference blocks
- ✅ Enables location names in guest view
- ✅ No breaking changes

## Summary

The test fails because the `locations` table requires authentication for SELECT, but the guest view uses anon key. Adding an RLS policy to allow anon SELECT on locations (where `deleted_at IS NULL`) will fix the issue and align with the design intent that locations are public information.
