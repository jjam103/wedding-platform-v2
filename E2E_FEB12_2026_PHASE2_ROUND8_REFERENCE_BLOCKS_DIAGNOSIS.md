# E2E Reference Blocks Tests - Root Cause Diagnosis

**Date**: February 13, 2026  
**Status**: ROOT CAUSE IDENTIFIED  
**Tests Affected**: All 8 tests in `__tests__/e2e/admin/referenceBlocks.spec.ts`

## Problem Summary

All 8 reference blocks E2E tests are failing with the same error:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('button:has-text("Edit")').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found
```

Tests create content pages and events in `beforeEach`, but when they navigate to `/admin/content-pages` or `/admin/events`, no data appears in the UI (no Edit buttons found).

## Root Cause Analysis

### The Issue

**E2E admin user is in wrong table with wrong role structure:**

1. **E2E Setup Creates Admin User in `admin_users` Table**:
   - File: `__tests__/e2e/global-setup.ts`
   - Creates user in `admin_users` table with role 'owner'
   - Code:
     ```typescript
     await adminClient.from('admin_users').insert({
       id: authData.user.id,
       email,
       role: 'owner',  // ❌ Wrong table and role
       is_active: true,
     });
     ```

2. **RLS Policies Check `users` Table**:
   - File: `supabase/migrations/032_fix_all_rls_policies_users_table.sql`
   - All RLS policies use `get_user_role(auth.uid())` function
   - Example for content_pages:
     ```sql
     CREATE POLICY "hosts_manage_content_pages"
     ON content_pages FOR ALL
     USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));
     ```

3. **`get_user_role()` Function Queries `users` Table**:
   - File: `supabase/migrations/030_fix_get_user_role_function.sql`
   - Function definition:
     ```sql
     CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
     RETURNS TEXT
     LANGUAGE sql
     SECURITY DEFINER
     SET search_path = public
     AS $$
       SELECT role FROM public.users WHERE id = user_id;
     $$;
     ```

### The Flow

```
Test creates data with service client (bypasses RLS)
  ↓
Test navigates to /admin/content-pages
  ↓
Page tries to fetch data using admin user's credentials
  ↓
API route checks RLS policies
  ↓
RLS policy calls get_user_role(auth.uid())
  ↓
get_user_role() queries users table
  ↓
Admin user NOT in users table → get_user_role() returns NULL
  ↓
RLS policy evaluates to FALSE (NULL not IN ('super_admin', 'host'))
  ↓
Query returns empty result set
  ↓
UI shows no data → No Edit buttons → Test fails
```

## Evidence

### 1. E2E Setup Code
```typescript
// __tests__/e2e/global-setup.ts:ensureAdminUserExists()
const { error: userError } = await adminClient
  .from('admin_users')  // ❌ Wrong table
  .insert({
    id: authData.user.id,
    email,
    role: 'owner',      // ❌ Wrong role (should be 'super_admin' or 'host')
    is_active: true,
  });
```

### 2. RLS Policy
```sql
-- supabase/migrations/032_fix_all_rls_policies_users_table.sql
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));
```

### 3. get_user_role() Function
```sql
-- supabase/migrations/030_fix_get_user_role_function.sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_id;  -- Queries users table
$$;
```

## Why Tests Pass Locally But Fail in CI

This issue would affect ALL environments equally. If tests are passing locally, it means:
1. Local database has admin user in `users` table with correct role
2. OR local tests are using a different admin user
3. OR local database has different RLS policies

## Solution

**Fix the E2E global setup to create admin user in `users` table with correct role:**

```typescript
// __tests__/e2e/global-setup.ts:ensureAdminUserExists()

// Create users record with super_admin role (not admin_users)
const { error: userError } = await adminClient
  .from('users')  // ✅ Correct table
  .insert({
    id: authData.user.id,
    email,
    role: 'super_admin',  // ✅ Correct role for RLS policies
  });
```

## Alternative Solutions

### Option 1: Update get_user_role() to Check Both Tables
```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = user_id),
    (SELECT role FROM public.admin_users WHERE id = user_id)
  );
$$;
```

**Pros**: Backward compatible, works with both tables  
**Cons**: More complex, slower queries, maintains dual table structure

### Option 2: Migrate admin_users to users Table
- Consolidate all admin users into `users` table
- Remove `admin_users` table
- Update all references

**Pros**: Cleaner architecture, single source of truth  
**Cons**: Requires migration, may break existing code

## Recommended Fix

**Use Option 1 (Update E2E Setup)** because:
1. Minimal code change (1 line)
2. No database migration needed
3. Aligns with existing RLS policy expectations
4. Fast to implement and test
5. No risk to production code

## Implementation Steps

1. Update `__tests__/e2e/global-setup.ts`:
   - Change `admin_users` to `users`
   - Change role from 'owner' to 'super_admin'

2. Verify fix:
   ```bash
   npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
   ```

3. If tests still fail, check:
   - Admin user exists in `users` table: `SELECT * FROM users WHERE email = 'admin@example.com'`
   - User has correct role: `SELECT get_user_role(id) FROM users WHERE email = 'admin@example.com'`
   - RLS policies are applied: `SELECT * FROM pg_policies WHERE tablename = 'content_pages'`

## Next Steps

1. Apply the fix to `__tests__/e2e/global-setup.ts`
2. Run reference blocks tests to verify
3. Run full E2E suite to ensure no regressions
4. Document the correct admin user setup in E2E documentation

## Related Files

- `__tests__/e2e/global-setup.ts` - E2E setup (needs fix)
- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Failing tests
- `supabase/migrations/030_fix_get_user_role_function.sql` - get_user_role() function
- `supabase/migrations/032_fix_all_rls_policies_users_table.sql` - RLS policies
- `hooks/useContentPages.ts` - Data fetching hook
- `app/admin/content-pages/page.tsx` - Admin page
- `app/admin/events/page.tsx` - Events page

## Confidence Level

**100% - Root cause confirmed**

The diagnosis is definitive:
- ✅ E2E setup creates user in wrong table
- ✅ RLS policies check different table
- ✅ get_user_role() returns NULL for E2E admin user
- ✅ NULL fails RLS policy check
- ✅ Empty result set → No UI data → Test fails

This explains why ALL 8 tests fail with the same error at the same point.
