# E2E Reference Blocks Tests - Complete Root Cause Analysis

**Date**: February 13, 2026  
**Status**: ROOT CAUSE FULLY IDENTIFIED - SOLUTION READY  
**Tests Affected**: All 8 tests in `__tests__/e2e/admin/referenceBlocks.spec.ts`

## Executive Summary

All 8 reference blocks E2E tests fail because of a **role mismatch between two admin user tables**:

- Admin user exists in BOTH `users` and `admin_users` tables
- `users` table has role 'host'
- `admin_users` table has role 'owner'
- Middleware checks `admin_users` → sees 'owner' → allows access ✅
- RLS policies check via `get_user_role()` → returns 'owner' (checks admin_users first) → RLS expects 'super_admin' or 'host' → DENIES ACCESS ❌
- Empty result set → No UI data → No Edit buttons → Tests fail

## The Complete Picture

### Database State

```
users table:
  id: e7f5ae65-376e-4d05-a18c-10a91295727a
  email: admin@example.com
  role: host ✅

admin_users table:
  id: e7f5ae65-376e-4d05-a18c-10a91295727a
  email: admin@example.com
  role: owner ✅
  status: active
```

### get_user_role() Function (Migration 055)

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $
  -- First check admin_users table (for admin dashboard users)
  SELECT role FROM public.admin_users WHERE id = user_id
  UNION ALL
  -- Then check users table (for guest portal users)
  SELECT role FROM public.users WHERE id = user_id
  LIMIT 1;
$;
```

**Result**: Returns 'owner' (from admin_users table, checked first)

### Middleware (middleware.ts)

```typescript
// Fetch user role from admin_users table
const { data: userData, error: userError } = await supabase
  .from('admin_users')
  .select('role, status')
  .eq('id', user.id)
  .single();

// Check if user has required role for admin routes
const allowedRoles = ['owner', 'admin'];
```

**Result**: Finds role 'owner' → Allows access ✅

### RLS Policies (Migration 032)

```sql
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));
```

**Result**: `get_user_role()` returns 'owner' → 'owner' NOT IN ('super_admin', 'host') → DENIES ACCESS ❌

## The Flow

```
Test creates content page with service client (bypasses RLS)
  ↓
Test navigates to /admin/content-pages
  ↓
Middleware checks admin_users table → sees 'owner' → allows page access ✅
  ↓
Page tries to fetch content_pages data
  ↓
API route checks RLS policies
  ↓
RLS policy calls get_user_role(auth.uid())
  ↓
get_user_role() checks admin_users first → returns 'owner'
  ↓
RLS policy: 'owner' NOT IN ('super_admin', 'host') → FALSE
  ↓
Query returns empty result set
  ↓
UI shows no data → No Edit buttons → Test fails ❌
```

## Why This Happened

1. **E2E global setup was updated** (correctly) to create admin user in `users` table with role 'host'
2. **But admin user already existed** in `admin_users` table with role 'owner' from previous test runs
3. **Migration 055 updated get_user_role()** to check admin_users FIRST, then users table
4. **RLS policies were never updated** to accept 'owner' role (they only accept 'super_admin' or 'host')

## Solutions

### Option 1: Update RLS Policies to Accept 'owner' Role (RECOMMENDED)

**Pros**:
- Aligns with middleware expectations
- Allows admin_users table to work as designed
- Minimal code changes

**Cons**:
- Need to update all RLS policies
- May affect other parts of the system

**Implementation**:
```sql
-- Update all RLS policies to accept 'owner' role
CREATE OR REPLACE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Repeat for all tables: events, activities, sections, columns, etc.
```

### Option 2: Remove Admin User from admin_users Table

**Pros**:
- Quick fix
- get_user_role() will return 'host' from users table
- RLS policies will work immediately

**Cons**:
- Middleware will fail (can't find user in admin_users)
- Breaks admin authentication
- Not a sustainable solution

**Status**: Already tried - middleware fails

### Option 3: Update Middleware to Query users Table

**Pros**:
- Aligns with RLS policy expectations
- Simplifies architecture (single source of truth)

**Cons**:
- Need to update middleware
- May break other admin features that depend on admin_users table
- users table doesn't have 'owner' role (only 'host', 'super_admin', 'guest')

### Option 4: Sync Both Tables with Same Role

**Pros**:
- Both middleware and RLS work
- Maintains dual table structure

**Cons**:
- admin_users table only allows 'admin' or 'owner' roles
- users table has 'host' role
- Can't use same role in both tables
- Still need to update RLS policies or get_user_role()

## Recommended Solution

**Update RLS policies to accept 'owner' role** because:

1. Middleware already expects 'owner' role
2. admin_users table is designed for 'owner' and 'admin' roles
3. get_user_role() correctly returns 'owner' from admin_users table
4. Only RLS policies need updating (one-time fix)
5. Aligns with existing architecture

## Implementation Plan

### Step 1: Create Migration to Update RLS Policies

```sql
-- Migration: Update RLS policies to accept 'owner' role
-- File: supabase/migrations/056_add_owner_role_to_rls_policies.sql

-- Content Pages
DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Events
DROP POLICY IF EXISTS "hosts_manage_events" ON events;
CREATE POLICY "hosts_manage_events"
ON events FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Activities
DROP POLICY IF EXISTS "hosts_manage_activities" ON activities;
CREATE POLICY "hosts_manage_activities"
ON activities FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Sections
DROP POLICY IF EXISTS "hosts_manage_sections" ON sections;
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Columns
DROP POLICY IF EXISTS "hosts_manage_columns" ON columns;
CREATE POLICY "hosts_manage_columns"
ON columns FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Repeat for all other tables...
```

### Step 2: Recreate Admin User in admin_users Table

```bash
node scripts/sync-admin-user-tables.mjs
```

But use role 'owner' instead of 'host':

```javascript
const { error: insertError } = await supabase
  .from('admin_users')
  .insert({
    id: usersData.id,
    email: usersData.email,
    role: 'owner',  // Use 'owner' for admin_users table
    status: 'active',
  });
```

### Step 3: Run Tests

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

## Verification Steps

1. Check admin user exists in both tables:
   ```bash
   node scripts/check-admin-tables.mjs
   ```

2. Verify get_user_role() returns 'owner':
   ```sql
   SELECT get_user_role('e7f5ae65-376e-4d05-a18c-10a91295727a');
   -- Should return: 'owner'
   ```

3. Verify RLS policies accept 'owner':
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'content_pages' 
   AND policyname = 'hosts_manage_content_pages';
   -- Should show: get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner')
   ```

4. Run reference blocks tests

## Related Files

- `__tests__/e2e/global-setup.ts` - E2E setup (creates admin user)
- `middleware.ts` - Checks admin_users table
- `supabase/migrations/055_fix_get_user_role_for_admin_users.sql` - get_user_role() function
- `supabase/migrations/032_fix_all_rls_policies_users_table.sql` - RLS policies
- `supabase/migrations/038_create_admin_users_table.sql` - admin_users table definition

## Confidence Level

**100% - Root cause fully understood**

The diagnosis is complete and definitive:
- ✅ Admin user exists in both tables with different roles
- ✅ get_user_role() returns 'owner' (checks admin_users first)
- ✅ Middleware accepts 'owner' role
- ✅ RLS policies reject 'owner' role (only accept 'super_admin' or 'host')
- ✅ Solution: Update RLS policies to accept 'owner' role

This explains why ALL 8 tests fail with the same error at the same point.

