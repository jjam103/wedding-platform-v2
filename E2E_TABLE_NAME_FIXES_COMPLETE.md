# E2E Table Name Fixes Complete

## Date
February 5, 2026

## Issue Fixed
All test files were using incorrect table name `guest_groups` instead of the actual database table name `groups`.

## Root Cause
The database table has always been named `groups` (see `supabase/migrations/001_create_core_tables.sql`), but many test files were referencing it as `guest_groups`, causing test setup failures.

## Files Fixed

### E2E Test Files (Previously Fixed)
1. `__tests__/e2e/auth/guestAuth.spec.ts` ✅
2. `__tests__/e2e/admin/rsvpManagement.spec.ts` ✅
3. `__tests__/e2e/admin/emailManagement.spec.ts` ✅
4. `__tests__/e2e/global-setup.ts` ✅

### Helper Files (Just Fixed)
5. `__tests__/helpers/e2eHelpers.ts` ✅
   - Fixed `createTestGroup()` function
   - Fixed cleanup tables array

6. `__tests__/helpers/factories.ts` ✅
   - Fixed `createTestGroup()` function
   - Fixed cleanup registry table name

### Integration Test Files (Just Fixed)
7. `__tests__/integration/guestRsvpApi.integration.test.ts` ✅
   - Fixed test group creation
   - Fixed cleanup tables array

8. `__tests__/integration/databaseIsolation.integration.test.ts` ✅
   - Fixed RLS test for groups table
   - Updated test name and console log

9. `__tests__/integration/rlsPolicies.integration.test.ts` ✅
   - Fixed describe block name: `'guest_groups Table RLS'` → `'groups Table RLS'`
   - Fixed all `.from('guest_groups')` → `.from('groups')`
   - Fixed `trackEntity('guest_groups', ...)` → `trackEntity('groups', ...)`
   - Fixed comment documentation

10. `__tests__/integration/guestContentApi.integration.test.ts` ✅
    - Fixed cleanup code

### Regression Test Files (Just Fixed)
11. `__tests__/regression/guestGroupsRls.regression.test.ts` ✅
    - Replaced ALL occurrences of `guest_groups` with `groups` (used sed for efficiency)

## Changes Made

### Pattern 1: Table References
```typescript
// ❌ BEFORE
.from('guest_groups')

// ✅ AFTER
.from('groups')
```

### Pattern 2: Entity Tracking
```typescript
// ❌ BEFORE
trackEntity('guest_groups', id)

// ✅ AFTER
trackEntity('groups', id)
```

### Pattern 3: Cleanup Arrays
```typescript
// ❌ BEFORE
tables: ['guests', 'guest_groups']

// ✅ AFTER
tables: ['guests', 'groups']
```

### Pattern 4: Test Names
```typescript
// ❌ BEFORE
describe('guest_groups Table RLS', () => {

// ✅ AFTER
describe('groups Table RLS', () => {
```

## Verification

All test files now use the correct table name `groups` which matches the actual database schema.

## Impact

- **E2E Tests**: Can now create test groups successfully in `beforeEach` hooks
- **Integration Tests**: Will properly test RLS policies on the correct table
- **Regression Tests**: Will validate the correct table's behavior

## Next Steps

1. ✅ Table name fixes complete
2. 🔄 **NEXT**: Investigate why guest authentication flows are failing
   - All 16 guest auth tests are now running (not crashing in setup)
   - But all are failing due to actual auth implementation issues
   - Need to debug the auth API endpoints and flows

## Related Files

- Database schema: `supabase/migrations/001_create_core_tables.sql`
- Previous fix documentation: `E2E_GUEST_AUTH_TABLE_NAME_FIX.md`

---

**Status**: ✅ All table name fixes complete. Ready to investigate auth failures.
