# Task 10.2.3: E2E Test Fixes Summary

## Issues Identified

### 1. Schema Mismatches in E2E Database

The E2E test database is missing several critical migrations that exist in production:

**Missing Tables:**
- `system_settings` - Causes home page API 500 errors
- `magic_link_tokens` - Authentication tests fail
- `admin_users` - Admin user management tests fail
- `guest_sessions` - Guest authentication tests fail
- `email_history` - Email management tests fail

**Missing Columns:**
- `events.slug` - Reference search fails
- `events.deleted_at` - Soft delete tests fail
- `activities.slug` - Reference search fails
- `activities.deleted_at` - Soft delete tests fail
- `accommodations.slug` - Reference search fails
- `accommodations.event_id` - Event association tests fail
- `room_types.slug` - Reference search fails
- `content_pages.deleted_at` - Soft delete tests fail
- `sections.title` - Section display tests fail
- `sections.deleted_at` - Soft delete tests fail
- `columns.deleted_at` - Soft delete tests fail
- `photos.deleted_at` - Photo management tests fail
- `rsvps.deleted_at` - RSVP management tests fail
- `guests.auth_method` - Authentication tests fail
- `vendor_bookings.base_cost` - Budget tests fail

### 2. API Route Column Name Mismatches

**Fixed in this commit:**
- `app/api/admin/references/search/route.ts` - Changed `date` to `start_date` for events table

## Fixes Applied

### 1. Reference Search API Fix

**File:** `app/api/admin/references/search/route.ts`

**Changes:**
```typescript
// Before:
.select('id, name, slug, date, location_id, locations(name)')
.order('date', { ascending: true })

// After:
.select('id, name, slug, start_date, location_id, locations(name)')
.order('start_date', { ascending: true })
```

**Reason:** The events table has `start_date` column, not `date`. This was causing 500 errors in reference search.

### 2. Migration File Ready

**File:** `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS_FIXED.sql`

This file contains all missing migrations that need to be applied to the E2E database:
- Migration 034: Add section title column
- Migration 036: Add auth method fields
- Migration 037: Create magic link tokens table
- Migration 038: Create admin users and guest sessions tables
- Migration 038: Add slug columns to events/activities
- Migration 039: Add slug columns to accommodations/room_types
- Migration 040: Create email history table
- Migration 048: Add soft delete columns
- Migration 050: Create system settings table
- Migration 051: Add base_cost to vendor_bookings
- Migration 051: Add event_id to accommodations

## Next Steps

### Apply Migrations to E2E Database

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to https://olcqaawrpnanioaorfer.supabase.co
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS_FIXED.sql`
4. Paste and execute
5. Verify no errors

**Option 2: Via Script**
```bash
node scripts/apply-e2e-migrations-direct.mjs
```

### Verify Fixes

After applying migrations, run:
```bash
# Verify schema
node scripts/diagnose-e2e-failures.mjs

# Run E2E tests
npm run test:e2e
```

## Expected Test Results After Fixes

### Tests That Should Pass:
1. **Home Page API Tests** (4 tests)
   - GET /api/admin/home-page
   - PUT /api/admin/home-page
   - Home page configuration updates
   - Home page settings persistence

2. **Reference Blocks Tests** (8 tests)
   - Reference block picker rendering
   - Event/activity search
   - Reference block selection
   - Reference block display

3. **RSVP API Tests** (multiple tests)
   - List RSVPs with filters
   - Create RSVPs
   - Update RSVP status
   - RSVP analytics

4. **Photo Upload Tests** (multiple tests)
   - Photo upload flow
   - Photo moderation
   - Photo gallery display
   - Photo metadata

5. **Location Hierarchy Tests** (multiple tests)
   - Parent/child relationships
   - Location search
   - Location filtering

6. **CSV Import/Export Tests** (multiple tests)
   - Guest CSV import
   - Guest CSV export
   - Data validation

### Tests That May Still Need Work:
- Photo upload timeout issues (may need increased timeout)
- Complex workflow tests (may need better test data setup)

## Root Cause Analysis

### Why Did This Happen?

1. **Migration Drift:** Production database received migrations that were never applied to E2E test database
2. **No Migration Verification:** E2E tests didn't verify schema before running
3. **Manual Database Setup:** E2E database was set up manually, not via migrations
4. **No Schema Sync Check:** No automated check to ensure E2E and production schemas match

### Prevention Measures

1. **Add Schema Verification to E2E Setup:**
   - Check that all migrations are applied before tests run
   - Fail fast if schema is out of sync

2. **Automated Migration Application:**
   - Apply migrations automatically in E2E global setup
   - Use migration tracking table to know what's applied

3. **Schema Comparison Tool:**
   - Create script to compare E2E and production schemas
   - Run as part of CI/CD pipeline

4. **Documentation:**
   - Document E2E database setup process
   - Include migration application in setup guide

## Files Modified

1. `app/api/admin/references/search/route.ts` - Fixed column name mismatch
2. `docs/TASK_10_2_3_E2E_FIXES_SUMMARY.md` - This file

## Files to Apply

1. `supabase/migrations/COMBINED_MISSING_E2E_MIGRATIONS_FIXED.sql` - Apply to E2E database

## Verification Commands

```bash
# 1. Diagnose current state
node scripts/diagnose-e2e-failures.mjs

# 2. Apply migrations (choose one method)
# Method A: Via Supabase Dashboard (copy/paste SQL)
# Method B: Via script
node scripts/apply-e2e-migrations-direct.mjs

# 3. Verify migrations applied
node scripts/verify-e2e-migrations.mjs

# 4. Run E2E tests
npm run test:e2e

# 5. Check specific test suites
npm run test:e2e -- --grep "Home Page"
npm run test:e2e -- --grep "Reference Blocks"
npm run test:e2e -- --grep "RSVP"
```

## Success Criteria

- [ ] All migrations applied to E2E database without errors
- [ ] `system_settings` table exists and is accessible
- [ ] `slug` columns exist on events, activities, accommodations, room_types
- [ ] `deleted_at` columns exist on all soft-deletable tables
- [ ] `auth_method` column exists on guests table
- [ ] Home page API tests pass (4/4)
- [ ] Reference blocks tests pass (8/8)
- [ ] RSVP API tests pass
- [ ] Overall E2E test pass rate > 90%

## Timeline

- **Diagnosis:** Complete ✅
- **API Fixes:** Complete ✅
- **Migration File:** Ready ✅
- **Apply Migrations:** Next step ⏭️
- **Verify & Test:** After migrations applied
- **Documentation:** In progress 📝

## Notes

- The migration file uses `$function_body$` syntax instead of `$$` to avoid Supabase SQL Editor parsing issues
- All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` to be idempotent
- Migrations can be safely re-run without causing errors
- Some migrations create functions and triggers - these are essential for slug generation and soft delete functionality

