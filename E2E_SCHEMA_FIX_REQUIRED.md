# E2E Schema Fix Required - URGENT

## Problem

The E2E test database schema doesn't match production, preventing test data creation:

```
Failed to create country: Could not find the 'type' column of 'locations' in the schema cache
```

## Impact

- ❌ Test data creation fails
- ❌ Tests fail due to missing data
- ❌ Cannot measure Priority 1 improvement
- ❌ Blocks all further E2E work

## Root Cause

The E2E test database is missing migrations that exist in production. Specifically:
- `locations` table missing `type` column
- Possibly other schema differences

## Quick Fix

### Option 1: Apply Missing Migrations (Recommended)

1. **Identify missing migrations**:
   ```bash
   # Compare migration files with E2E database
   # Check which migrations haven't been applied
   ```

2. **Apply migrations to E2E database**:
   ```bash
   # Use Supabase CLI or direct SQL
   # Apply missing migrations in order
   ```

3. **Verify schema**:
   ```bash
   # Check that locations table has type column
   # Verify all tables match production
   ```

### Option 2: Reset E2E Database (Faster but Nuclear)

1. **Reset E2E database**:
   ```bash
   # Drop all tables
   # Re-apply all migrations from scratch
   ```

2. **Verify schema**:
   ```bash
   # Confirm all tables and columns exist
   ```

## Expected Timeline

- **Option 1**: 30-60 minutes (safer, preserves data)
- **Option 2**: 15-30 minutes (faster, loses data)

## After Fix

1. Re-run global setup to create test data
2. Verify test data creation succeeds
3. Run E2E tests
4. Measure actual pass rate improvement
5. Continue with Priority 2 (Selector Fixes)

## Commands to Run After Fix

```bash
# 1. Verify schema
npm run test:e2e -- __tests__/e2e/config-verification.spec.ts

# 2. Run full E2E suite
npm run test:e2e

# 3. Check pass rate
# Should see 65-70% pass rate if test data creation works
```

## Success Criteria

✅ Global setup completes without warnings
✅ Test data creation succeeds
✅ Location hierarchy created successfully
✅ Events and activities created
✅ Pass rate improves to 65-70%

## Current Status

🔴 **BLOCKED** - Cannot proceed until schema is fixed
⏰ **Estimated Fix Time**: 30-60 minutes
🎯 **Priority**: CRITICAL - Blocks all E2E work

---

**Next Action**: Fix E2E database schema alignment
**Owner**: Developer with Supabase access
**Urgency**: High - Blocks testing progress
