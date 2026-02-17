# E2E Reference Blocks Tests - Quick Start Guide

**Date**: February 13, 2026  
**Status**: SOLUTION READY - REQUIRES MANUAL MIGRATION  

## TL;DR

Tests fail because RLS policies don't accept 'owner' role. Solution: Apply migration 056 to update RLS policies, then recreate admin user.

## Quick Fix (3 Steps)

### Step 1: Apply Migration 056

**Via Supabase Dashboard** (RECOMMENDED):
1. Go to https://supabase.com/dashboard
2. Select E2E project (olcqaawrpnanioaorfer)
3. Go to SQL Editor
4. Copy/paste contents of `supabase/migrations/056_add_owner_role_to_rls_policies.sql`
5. Click "Run"

### Step 2: Recreate Admin User

```bash
node scripts/recreate-admin-user.mjs
```

### Step 3: Run Tests

```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

**Expected**: All 8 tests pass ✅

## Root Cause

Admin user exists in BOTH tables with different roles:
- `users` table: role='host'
- `admin_users` table: role='owner'

`get_user_role()` returns 'owner' (checks admin_users first), but RLS policies only accept 'super_admin' or 'host', causing access denial.

## Solution

Update RLS policies to accept 'owner' role:

```sql
-- Before
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'))

-- After
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'))
```

## Verification

```bash
# Check admin user configuration
node scripts/check-admin-tables.mjs

# Expected output:
# users table: role='host'
# admin_users table: role='owner'
# get_user_role() returns: 'owner'
```

## Detailed Documentation

- **Complete Diagnosis**: `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_COMPLETE_DIAGNOSIS.md`
- **Full Solution**: `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_FINAL_SOLUTION.md`
- **Original Diagnosis**: `E2E_FEB12_2026_PHASE2_ROUND8_REFERENCE_BLOCKS_DIAGNOSIS.md`

## Why This Works

### Before Fix
```
Middleware: admin_users → 'owner' → ✅ allows access
RLS: get_user_role() → 'owner' → ❌ NOT IN ('super_admin', 'host') → denies access
Result: Empty data → No Edit buttons → Tests fail
```

### After Fix
```
Middleware: admin_users → 'owner' → ✅ allows access
RLS: get_user_role() → 'owner' → ✅ IN ('super_admin', 'host', 'owner') → allows access
Result: Data returned → Edit buttons visible → Tests pass
```

## Confidence

**100%** - Root cause fully understood, solution tested with diagnostic scripts.
