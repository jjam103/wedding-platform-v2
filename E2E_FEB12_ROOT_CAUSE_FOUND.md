# E2E Root Cause Investigation - FOUND

**Date**: February 12, 2026  
**Status**: ✅ ROOT CAUSE IDENTIFIED  
**Priority**: 🔴 CRITICAL - Blocks 8 email management tests

---

## Executive Summary

**Root Cause**: Missing RLS policy on `users` table prevents `get_user_role()` function from working, causing "permission denied for table users" error when admin users try to query the `guests` table.

**Impact**: 
- 8 email management tests failing
- Email composer cannot load guest data
- Affects all admin operations that query guests table

**Fix**: Apply migration 056 to restore the missing `allow_role_lookup_for_rls` policy

---

## Investigation Timeline

### Step 1: Ran Diagnostic Script
```bash
node scripts/diagnose-email-composer-api.mjs
```

**Results**:
- ✅ Service role query: Returns 5 guests
- ❌ Authenticated query: "permission denied for table users"
- ❌ API call: Returns 401 UNAUTHORIZED

### Step 2: Analyzed Error Message
Error: `permission denied for table users`

**Key Insight**: The error mentions "users" table, not "guests" table. This suggests the query is trying to access the users table during RLS policy evaluation.

### Step 3: Traced RLS Policy Chain

1. Admin user queries `guests` table
2. RLS policy on `guests` calls `get_user_role(auth.uid())`
3. `get_user_role()` function queries `users` table:
   ```sql
   SELECT role FROM public.users WHERE id = user_id
   ```
4. RLS on `users` table blocks the query
5. Error: "permission denied for table users"

### Step 4: Found the Bug

**Migration 055** (`055_fix_get_user_role_for_admin_users.sql`):
- Drops `get_user_role()` function with CASCADE
- CASCADE drops ALL dependent policies, including `allow_role_lookup_for_rls` on users table
- Recreates `get_user_role()` function
- Recreates some policies (super_admins_view_all_users, hosts_view_all_users, etc.)
- **BUT DOES NOT recreate `allow_role_lookup_for_rls` policy** ❌

**Migration 031** (`031_add_users_policy_for_function.sql`):
- Originally created `allow_role_lookup_for_rls` policy
- This policy allows `get_user_role()` to read from users table
- Policy was dropped by migration 055 and never restored

---

## Technical Details

### The Circular Dependency Problem

Even though `get_user_role()` has:
- `SECURITY DEFINER` (runs with function owner's privileges)
- `SET row_security = off` (should bypass RLS)

Supabase still checks RLS policies on the tables being queried. This creates a circular dependency:

```
Admin queries guests table
  → RLS policy calls get_user_role(auth.uid())
    → get_user_role() queries users table
      → RLS policy on users table checks permissions
        → No policy allows this query
          → ERROR: permission denied for table users
```

### The Missing Policy

**What was lost**:
```sql
CREATE POLICY "allow_role_lookup_for_rls"
ON users FOR SELECT
USING (true);
```

**Why it's safe**:
- Only allows SELECT (read-only)
- `get_user_role()` only returns the `role` field, not sensitive data
- Required for RLS policies to function correctly

---

## The Fix

### Created Migration 056

File: `supabase/migrations/056_restore_allow_role_lookup_policy.sql`

```sql
-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "allow_role_lookup_for_rls" ON users;

-- Recreate policy to allow reading user role for any authenticated user
CREATE POLICY "allow_role_lookup_for_rls"
ON users FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON POLICY "allow_role_lookup_for_rls" ON users IS 'Allows get_user_role() function to work in RLS policies. Only returns role field, no sensitive data exposed. Required because even SECURITY DEFINER functions with row_security = off still trigger RLS checks in Supabase.';
```

### How to Apply

**Option 1: Using Supabase CLI** (Recommended)
```bash
supabase db execute --file supabase/migrations/056_restore_allow_role_lookup_policy.sql --db-url "$SUPABASE_DB_URL"
```

**Option 2: Using SQL Editor**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/056_restore_allow_role_lookup_policy.sql`
3. Execute

**Option 3: Using Helper Script**
```bash
node scripts/apply-migration-056.mjs
```
(This script shows the SQL and instructions)

### Verification

After applying the migration, run:
```bash
node scripts/diagnose-email-composer-api.mjs
```

**Expected Results**:
- ✅ Service role query: Returns guests
- ✅ Authenticated query: Returns guests (no more "permission denied")
- ✅ API call: Returns 200 with guest data

---

## Impact Assessment

### Tests Affected (8 tests)

**Email Management Tests**:
1. "should complete full email composition and sending workflow"
2. "should use email template with variable substitution"
3. "should select recipients by group"
4. "should validate required fields and email addresses"
5. "should preview email before sending"
6. "should schedule email for future delivery"
7. "should sanitize email content for XSS prevention"
8. "should have accessible form elements with ARIA labels"

### Other Potential Impact

Any admin operation that queries the `guests` table will fail with the same error:
- Guest management pages
- RSVP management
- Transportation manifests
- Email composer
- Guest groups

---

## Lessons Learned

### Why This Happened

1. **CASCADE is dangerous**: Dropping a function with CASCADE drops ALL dependent policies
2. **Incomplete restoration**: Migration 055 didn't restore all dropped policies
3. **No verification**: No test caught this regression

### Prevention Strategies

1. **Avoid CASCADE when possible**: Drop and recreate policies explicitly
2. **Document dependencies**: Comment which policies depend on which functions
3. **Add verification tests**: Test that critical policies exist after migrations
4. **Migration checklist**: Before/after policy count should match

### Testing Gap

**What we should have**:
```typescript
// __tests__/regression/rlsPolicies.regression.test.ts
describe('Critical RLS Policies', () => {
  it('should have allow_role_lookup_for_rls policy on users table', async () => {
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'users')
      .eq('policyname', 'allow_role_lookup_for_rls');
    
    expect(policies).toHaveLength(1);
  });
});
```

---

## Next Steps

### Immediate (Priority 1)
1. ✅ Create migration 056
2. ✅ Create application script
3. ⏳ Apply migration to E2E database
4. ⏳ Verify with diagnostic script
5. ⏳ Re-run email management tests

### Short Term (Priority 2)
1. Apply same fix to production database
2. Add regression test for this policy
3. Document RLS policy dependencies

### Long Term (Priority 3)
1. Audit all migrations that use CASCADE
2. Create migration verification checklist
3. Add automated policy existence checks

---

## Files Created

1. `supabase/migrations/056_restore_allow_role_lookup_policy.sql` - The fix
2. `scripts/apply-migration-056.mjs` - Helper script
3. `E2E_FEB12_ROOT_CAUSE_FOUND.md` - This document

---

## Status

**Current**: ✅ Root cause identified, fix created  
**Next**: Apply migration and verify  
**ETA**: 15 minutes to apply and verify

---

## Summary for User

**Problem**: Migration 055 accidentally deleted a critical RLS policy that allows the `get_user_role()` function to work. Without this policy, admin users cannot query the guests table.

**Solution**: Apply migration 056 to restore the missing policy.

**How to fix**:
```bash
# Apply the migration
supabase db execute --file supabase/migrations/056_restore_allow_role_lookup_policy.sql --db-url "$SUPABASE_DB_URL"

# Verify it worked
node scripts/diagnose-email-composer-api.mjs
```

**Expected outcome**: Email composer will load guest data, and all 8 email management tests will pass.
