# E2E Phase 2 - Priority 1: Manual Database Fix Required

## Problem

The E2E and Local databases are missing the `locations.type` column. This prevents proper test data creation and causes test failures.

## Solution: Apply Migration Manually

Since the Supabase client API doesn't support raw SQL execution, you need to apply the migration manually via the Supabase Dashboard.

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **olcqaawrpnanioaorfer**
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Apply Migration SQL

Copy and paste this SQL into the SQL Editor and click **Run**:

```sql
-- Add type column to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add check constraint for valid location types
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS valid_location_type;

ALTER TABLE public.locations
ADD CONSTRAINT valid_location_type 
CHECK (type IS NULL OR type IN ('country', 'region', 'city', 'venue', 'accommodation'));

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);

-- Update existing rows to have a default type if they don't have one
UPDATE public.locations
SET type = 'venue'
WHERE type IS NULL;

-- Add comment
COMMENT ON COLUMN public.locations.type IS 'Type of location in the hierarchy: country, region, city, venue, or accommodation';
```

### Step 3: Verify Migration Applied

Run this verification query in SQL Editor:

```sql
-- Check if type column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'locations' 
  AND column_name = 'type';

-- Should return:
-- column_name | data_type | is_nullable
-- type        | text      | YES
```

### Step 4: Test the Fix

After applying the migration, run the E2E tests to measure improvement:

```bash
npm run test:e2e
```

## Expected Results

### Before Fix
- ❌ Global setup creates locations without type column
- ❌ Location hierarchy filtering doesn't work
- ❌ Pass rate: 54.3% (195/359 tests)

### After Fix
- ✅ Global setup creates locations with type column
- ✅ Location hierarchy filtering works properly
- ✅ Expected pass rate: 65-70% (233-251 tests)
- ✅ Improvement: +38-56 tests passing

## Why Manual Fix is Needed

The Supabase JavaScript client doesn't support executing raw SQL for security reasons. The only ways to run migrations are:

1. **Supabase Dashboard SQL Editor** (recommended) ✅
2. **Supabase CLI** (`supabase db push`) - requires CLI installation
3. **Direct PostgreSQL connection** (`psql`) - requires connection string

The Dashboard SQL Editor is the easiest and most reliable method.

## Alternative: Supabase CLI Method

If you have Supabase CLI installed:

```bash
# Apply migration to E2E database
supabase db push --db-url "postgresql://postgres:[password]@db.olcqaawrpnanioaorfer.supabase.co:5432/postgres"

# Or use the migration file directly
psql "postgresql://postgres:[password]@db.olcqaawrpnanioaorfer.supabase.co:5432/postgres" \
  -f supabase/migrations/052_add_locations_type_column.sql
```

## Files Reference

- **Migration SQL**: `supabase/migrations/052_add_locations_type_column.sql`
- **Application Script**: `scripts/apply-locations-type-to-both-dbs.mjs` (doesn't work due to API limitations)
- **Global Setup**: `__tests__/e2e/global-setup.ts` (has workaround for missing column)

## Next Steps After Fix

1. ✅ Apply migration via Supabase Dashboard
2. ✅ Verify column exists with verification query
3. ✅ Run E2E tests: `npm run test:e2e`
4. ✅ Measure improvement (expect 65-70% pass rate)
5. ✅ Move to Priority 2 fixes (selector improvements)

## Status

⚠️ **WAITING FOR MANUAL FIX** - Migration SQL ready, needs manual application  
🎯 **ESTIMATED TIME**: 2-3 minutes to apply via Dashboard  
📈 **EXPECTED IMPACT**: +38-56 tests passing (10-15% improvement)

---

**Ready to apply?** Copy the SQL above and paste it into Supabase Dashboard → SQL Editor → Run
