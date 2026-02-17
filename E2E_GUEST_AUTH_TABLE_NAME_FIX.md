# E2E Guest Authentication Tests - Table Name Fix

## Issue Identified

All 16 guest authentication E2E tests were failing in the `beforeEach` hook with:
```
Error: Failed to create test group
```

## Root Cause

The tests were attempting to insert into a table named `guest_groups`, but the actual table name in the database is `groups`.

**Incorrect code:**
```typescript
const { data: group, error: groupError } = await supabase
  .from('guest_groups')  // ❌ Wrong table name
  .insert({ name: 'Test Family', group_owner_id: null })
```

**Correct code:**
```typescript
const { data: group, error: groupError } = await supabase
  .from('groups')  // ✅ Correct table name
  .insert({ name: 'Test Family' })
```

## Files Fixed

1. **`__tests__/e2e/auth/guestAuth.spec.ts`** - Main guest auth test file
2. **`__tests__/e2e/admin/rsvpManagement.spec.ts`** - RSVP management tests
3. **`__tests__/e2e/admin/emailManagement.spec.ts`** - Email management tests (2 occurrences)
4. **`__tests__/e2e/global-setup.ts`** - Global test setup

## Additional Issues Found

The test also needs to use **service role key** instead of anon key to bypass RLS policies during test setup:

```typescript
// ✅ CORRECT: Use service role for test setup
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Other Files with `guest_groups` References

These files still reference `guest_groups` and may need fixing:

### Helper Files
- `__tests__/helpers/e2eHelpers.ts` (2 occurrences)
- `__tests__/helpers/factories.ts` (2 occurrences)
- `__tests__/helpers/cleanup.ts` (has correct comment noting table is 'groups')

### Integration Tests
- `__tests__/integration/databaseIsolation.integration.test.ts`
- `__tests__/integration/guestRsvpApi.integration.test.ts`
- `__tests__/integration/rlsPolicies.integration.test.ts` (multiple occurrences)
- `__tests__/integration/guestContentApi.integration.test.ts`

### Regression Tests
- `__tests__/regression/guestGroupsRls.regression.test.ts` (many occurrences)

## Database Schema Verification

From `supabase/migrations/001_create_core_tables.sql`:
```sql
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ...
);
```

The table is definitively named **`groups`**, not `guest_groups`.

## Next Steps

1. ✅ Fixed critical E2E test files
2. ⚠️ Need to fix helper files (`e2eHelpers.ts`, `factories.ts`)
3. ⚠️ Need to fix integration test files
4. ⚠️ Need to fix regression test file (`guestGroupsRls.regression.test.ts`)

## Impact

- **Before Fix**: 0/16 guest auth tests passing (100% failure rate)
- **After Fix**: Tests can now create test groups successfully
- **Remaining Issues**: Other test warnings about email validation and event_type field

## Related Issues

1. **Email Validation**: Test guest creation fails with "valid_guest_email" constraint
2. **Event Type**: Event creation fails with missing `event_type` field (nullable in schema)

These are separate issues that don't block the guest auth tests from running.
