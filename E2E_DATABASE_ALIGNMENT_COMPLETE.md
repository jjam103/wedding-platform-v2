# E2E Database Schema Alignment - Complete

## Date
February 5, 2026

## Summary

Successfully aligned the test database schema with production database by adding the missing `locations.type` column.

## Databases

- **Production**: `bwthjirvpdypmbvpsjtl.supabase.co` (destination-wedding-platform)
- **Test**: `olcqaawrpnanioaorfer.supabase.co` (wedding-platform-test)

## Migration Applied

### Migration Name
`add_locations_type_column_to_test_db`

### Changes Made

1. **Added `type` column** to `locations` table
   - Data type: TEXT NULL
   - Check constraint: Valid types are 'country', 'region', 'city', 'venue', 'accommodation'
   - Comment: 'Type of location in the hierarchy: country, region, city, venue, or accommodation'

2. **Created index** for performance
   - Index name: `idx_locations_type`
   - Partial index on non-null type values

3. **Updated existing data** with appropriate types
   - Top-level locations (no parent) → 'country'
   - Second-level locations → 'region'
   - Third-level locations → 'city'
   - Remaining locations with parents → 'venue'

### SQL Applied

```sql
-- Add type column to locations table for hierarchical location management
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS type TEXT NULL;

-- Add check constraint for valid location types
ALTER TABLE public.locations 
ADD CONSTRAINT locations_type_check 
CHECK (type IS NULL OR type = ANY (ARRAY['country'::text, 'region'::text, 'city'::text, 'venue'::text, 'accommodation'::text]));

-- Add comment explaining the column
COMMENT ON COLUMN public.locations.type IS 'Type of location in the hierarchy: country, region, city, venue, or accommodation';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type) WHERE type IS NOT NULL;

-- Update existing locations with appropriate types based on hierarchy
-- Top-level locations (no parent) are likely countries
UPDATE public.locations 
SET type = 'country' 
WHERE parent_location_id IS NULL AND type IS NULL;

-- Second-level locations are likely regions
UPDATE public.locations 
SET type = 'region' 
WHERE parent_location_id IN (SELECT id FROM public.locations WHERE type = 'country') 
AND type IS NULL;

-- Third-level locations are likely cities
UPDATE public.locations 
SET type = 'city' 
WHERE parent_location_id IN (SELECT id FROM public.locations WHERE type = 'region') 
AND type IS NULL;

-- Any remaining locations with parents are likely venues
UPDATE public.locations 
SET type = 'venue' 
WHERE parent_location_id IS NOT NULL AND type IS NULL;
```

## Verification

### Column Added Successfully ✅

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'locations' 
ORDER BY ordinal_position;
```

Result shows `type` column is now present:
- column_name: "type"
- data_type: "text"
- is_nullable: "YES"
- column_default: null

## Remaining Schema Differences

### Test Database Has (Production Missing)

1. **admin_users** table - Admin user management
2. **magic_link_tokens** table - Magic link authentication
3. **guest_sessions** table - Guest session tracking
4. **email_history** table - Email history tracking
5. **sections.title** column - Optional section titles
6. **vendor_bookings** enhanced columns - Pricing and cost tracking

### Impact

These are **newer features** developed in the test database that haven't been deployed to production yet. They don't affect E2E test execution.

## RLS Policies

RLS policies appear to be aligned between both databases. Both have comprehensive RLS policies for:
- activities, events, locations, guests, rsvps
- photos, sections, columns, content_pages
- email_logs, webhooks, audit_logs
- system_settings, transportation_manifests

## E2E Test Impact

### Before Migration
- **Pass Rate**: 54.3% (195/359 tests)
- **Issue**: Missing `locations.type` column
- **Workaround**: Global setup handled missing column gracefully

### After Migration
- **Expected**: Same or slightly improved pass rate
- **Benefit**: Tests now run against production-like schema
- **Confidence**: Higher confidence that tests validate production behavior

## Next Steps

### Immediate
1. ✅ Migration applied to test database
2. ⏳ Run E2E tests to verify no regressions
3. ⏳ Measure new pass rate

### Short Term
1. Document schema alignment process
2. Add schema validation to CI/CD
3. Prevent schema drift between databases

### Long Term
1. Plan production migration for missing tables/columns
2. Implement automated schema comparison
3. Sync migration history between databases

## Commands to Verify

### Check locations table schema
```bash
# Via Supabase Power
Use execute_sql with project_id: olcqaawrpnanioaorfer
Query: SELECT * FROM information_schema.columns WHERE table_name = 'locations';
```

### Run E2E tests
```bash
npm run test:e2e
```

### Compare schemas
```bash
node scripts/compare-database-schemas.mjs
```

## Status

✅ **SCHEMA ALIGNED** - Test database now has `locations.type` column  
✅ **MIGRATION SUCCESSFUL** - Column added with constraints and index  
✅ **DATA UPDATED** - Existing locations classified by hierarchy  
⏳ **TESTING PENDING** - E2E tests need to be run to verify improvement  

---

**Key Achievement**: Test database schema is now aligned with production for the `locations` table, eliminating a potential source of test/production behavior differences.

**Note**: The workaround in `global-setup.ts` can remain in place as a safety net, but it should no longer be needed for the `locations.type` column.
