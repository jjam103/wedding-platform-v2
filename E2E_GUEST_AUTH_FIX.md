# E2E Guest Authentication Fix

## Problem

All 16 guest authentication E2E tests are failing with:
```
Failed to create test guest: new row for relation "guests" violates check constraint "valid_guest_email"
```

## Root Cause

The `valid_guest_email` constraint in the E2E test database is **rejecting ALL email addresses**, including simple ones like `test@example.com`.

Testing showed:
- ❌ `testguest@example.com` - FAILED
- ❌ `test@example.com` - FAILED  
- ❌ `john.smith@example.com` - FAILED
- ❌ `test-guest@example.com` - FAILED
- ❌ `test_guest@example.com` - FAILED
- ✅ `NULL` - SUCCESS

This indicates the constraint itself is broken or incorrectly applied in the E2E database.

## Investigation

The constraint definition in `supabase/migrations/001_create_core_tables.sql` is:
```sql
CONSTRAINT valid_guest_email CHECK (
  email IS NULL OR 
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
```

This regex pattern is correct and works in JavaScript. The issue is likely:

1. **The E2E database has a different/corrupted version of the constraint**
2. **The constraint was modified in a later migration that wasn't applied to E2E**
3. **There's a Postgres regex syntax issue**

## Solution

### Step 1: Drop and Recreate the Constraint

Create a new migration to fix the constraint:

```sql
-- Drop the existing constraint
ALTER TABLE guests DROP CONSTRAINT IF EXISTS valid_guest_email;

-- Recreate with correct regex
ALTER TABLE guests ADD CONSTRAINT valid_guest_email 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

### Step 2: Apply to E2E Database

```bash
# Apply the migration to E2E database
node scripts/apply-e2e-migrations-direct.mjs
```

### Step 3: Verify Fix

```bash
# Run guest auth tests
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Alternative: Temporarily Remove Constraint

If the regex is causing issues, we can temporarily make the constraint less strict for E2E tests:

```sql
-- Drop the existing constraint
ALTER TABLE guests DROP CONSTRAINT IF EXISTS valid_guest_email;

-- Add a simpler constraint that just checks for @ symbol
ALTER TABLE guests ADD CONSTRAINT valid_guest_email 
  CHECK (email IS NULL OR email LIKE '%@%.%');
```

## Files to Create/Modify

1. Create migration: `supabase/migrations/052_fix_guest_email_constraint.sql`
2. Apply to E2E database
3. Re-run tests

## Next Steps

1. Create the fix migration
2. Apply to E2E database  
3. Verify all email formats work
4. Re-run guest auth tests
5. If still failing, investigate other potential issues (auth_method column, etc.)
