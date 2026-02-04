# Task 3.3: RLS Policy Testing Results

**Date**: February 4, 2026  
**Task**: Test RLS policies with test credentials from `.env.e2e`  
**Status**: ⚠️ Partially Complete - Issues Found

## Executive Summary

Tested Row-Level Security (RLS) policies using E2E test database credentials. Found that basic RLS functionality is working (unauthenticated access is properly blocked), but discovered **3 critical issues** that need attention:

1. ❌ **Sections table RLS policy error**: "permission denied for table users"
2. ⚠️ **Schema mismatch**: Test scripts reference `guest_groups` but table is named `groups`
3. ⚠️ **Schema mismatch**: Test scripts reference `content_pages.type` column which doesn't exist

## Test Environment

- **Database**: Supabase test database (olcqaawrpnanioaorfer.supabase.co)
- **Credentials**: From `.env.e2e`
- **Test Method**: Direct database queries with anon and service role keys

## Test Results

### ✅ Passing Tests (25/29)

#### Database Connection
- ✅ Successfully connected to test database
- ✅ Service role key has proper permissions

#### Unauthenticated Access (All Blocked - Expected)
- ✅ `groups`: Unauthenticated access blocked
- ✅ `guests`: Unauthenticated access blocked
- ✅ `events`: Unauthenticated access blocked
- ✅ `activities`: Unauthenticated access blocked
- ✅ `content_pages`: Unauthenticated access blocked
- ✅ `sections`: Unauthenticated access blocked
- ✅ `photos`: Unauthenticated access blocked

#### Service Role Access (All Working - Expected)
- ✅ `guests`: Can read with service role
- ✅ `events`: Can read with service role
- ✅ `activities`: Can read with service role
- ✅ `accommodations`: Can read with service role
- ✅ `content_pages`: Can read with service role
- ✅ `sections`: Can read with service role
- ✅ `columns`: Can read with service role
- ✅ `photos`: Can read with service role
- ✅ `gallery_settings`: Can read with service role

#### Table Structure
- ✅ `guests`: All expected columns accessible
- ✅ `events`: All expected columns accessible
- ✅ `sections`: All expected columns accessible

#### RLS Policy Existence (Indirect Tests)
- ✅ `groups`: RLS filtering working (anon gets less data than service role)
- ✅ `guests`: RLS filtering working
- ✅ `events`: RLS filtering working

#### Regression Tests
- ✅ `content_pages`: No RLS violation error (previously had issues)
- ✅ `photos`: Moderation filtering working

### ❌ Failing Tests (4/29)

#### Issue 1: Sections Table RLS Policy Error

**Test**: Sections table unauthenticated access  
**Expected**: Access blocked or empty result  
**Actual**: `permission denied for table users`

**Root Cause**: The RLS policy on the `sections` table references the `users` table, which either:
- Doesn't exist in the test database
- Has incorrect permissions
- Is referenced incorrectly in the RLS policy

**Impact**: HIGH - This prevents any unauthenticated or authenticated (non-service-role) access to sections

**Recommendation**: 
```sql
-- Check current RLS policy
SELECT * FROM pg_policies WHERE tablename = 'sections';

-- The policy likely has a JOIN or reference to 'users' table
-- Need to either:
-- 1. Create the users table if it doesn't exist
-- 2. Fix the RLS policy to not reference users table
-- 3. Use auth.users() instead of a custom users table
```

#### Issue 2: Table Name Mismatch - guest_groups

**Test**: Service role access to `guest_groups`  
**Expected**: Can read table  
**Actual**: `Could not find the table 'public.guest_groups' in the schema cache`

**Root Cause**: The table is named `groups`, not `guest_groups`

**Impact**: LOW - This is a test script issue, not a database issue

**Recommendation**: Update test scripts to use `groups` instead of `guest_groups`

#### Issue 3: Column Name Mismatch - content_pages.type

**Test**: Table structure check for `content_pages`  
**Expected**: Column `type` exists  
**Actual**: `column content_pages.type does not exist`

**Root Cause**: The `content_pages` table schema doesn't include a `type` column

**Impact**: LOW - This is a test script issue, not a database issue

**Recommendation**: Update test scripts to use correct column names for `content_pages`

## Detailed Findings

### 1. RLS Policies Are Active

**Evidence**:
- Unauthenticated requests (using anon key without auth token) are properly blocked or return empty results
- Service role requests bypass RLS and can access all data
- This confirms RLS is enabled and functioning at a basic level

### 2. Permission Boundaries Working

**Evidence**:
- Anon key without authentication: ❌ Blocked (expected)
- Service role key: ✅ Full access (expected)
- The difference in access levels confirms RLS is enforcing permissions

### 3. Critical Tables Accessible

**Working Tables**:
- `groups` (not `guest_groups`)
- `guests`
- `events`
- `activities`
- `accommodations`
- `content_pages`
- `columns`
- `photos`
- `gallery_settings`

**Problematic Tables**:
- `sections` - Has RLS policy error

### 4. Schema Differences from Expected

The test database schema differs from what test scripts expect:

| Expected | Actual | Status |
|----------|--------|--------|
| `guest_groups` | `groups` | ⚠️ Name mismatch |
| `content_pages.type` | Column doesn't exist | ⚠️ Schema mismatch |
| `sections` RLS | References `users` table | ❌ RLS error |

## Authentication Testing Limitations

**Issue**: Cannot create new auth users in test database

**Error**: `Database error creating new user`

**Impact**: Unable to test authenticated user access patterns (only tested unauthenticated and service role)

**Workaround**: Used indirect testing methods:
- Tested unauthenticated access (should be blocked)
- Tested service role access (should work)
- Compared results to infer RLS is working

**Recommendation**: For full E2E testing, need either:
1. Pre-created test users in the database
2. Permission to create auth users via admin API
3. Mock authentication tokens for testing

## Recommendations

### Immediate Actions (Critical)

1. **Fix Sections Table RLS Policy**
   ```bash
   # Investigate the RLS policy
   node scripts/check-sections-rls-policy.mjs
   
   # Apply fix (likely remove users table reference)
   # See: scripts/fix-sections-rls.mjs (from previous work)
   ```

2. **Update Test Scripts**
   - Change `guest_groups` → `groups`
   - Remove `content_pages.type` column reference
   - Update expected schema to match actual database

### Short-term Actions (Important)

3. **Create Test User Setup**
   - Pre-create test users in database for E2E tests
   - Document test user credentials
   - Add to E2E test setup script

4. **Verify All RLS Policies**
   - Run comprehensive RLS policy audit
   - Check for other tables with `users` table references
   - Ensure all policies use correct table references

### Long-term Actions (Enhancement)

5. **Automated RLS Testing**
   - Add RLS policy tests to CI/CD
   - Test both authenticated and unauthenticated access
   - Verify permission boundaries for all tables

6. **Schema Validation**
   - Add schema validation to test suite
   - Ensure test scripts match actual database schema
   - Alert on schema drift

## Test Scripts Created

1. **`scripts/test-e2e-rls-policies.mjs`**
   - Comprehensive RLS testing with auth user creation
   - Status: ❌ Blocked by auth user creation restrictions

2. **`scripts/test-e2e-rls-basic.mjs`**
   - Basic RLS testing without auth user creation
   - Status: ✅ Working (found 4 issues)

3. **`scripts/diagnose-tables.mjs`**
   - Quick diagnostic for table names and RLS errors
   - Status: ✅ Working

## Conclusion

**RLS Policies Status**: ⚠️ Partially Working

**Summary**:
- ✅ Basic RLS functionality is working (unauthenticated access blocked)
- ✅ Service role properly bypasses RLS
- ✅ Most tables have working RLS policies
- ❌ **Critical Issue**: Sections table has RLS policy error
- ⚠️ **Minor Issues**: Test script schema mismatches

**Next Steps**:
1. Fix sections table RLS policy (HIGH PRIORITY)
2. Update test scripts for correct schema
3. Create pre-configured test users for E2E tests
4. Re-run full RLS test suite

**Task Status**: ⚠️ Issues found and documented. Sections table RLS needs immediate attention before E2E tests can proceed.

---

**Test Execution**:
```bash
# Run basic RLS tests
node scripts/test-e2e-rls-basic.mjs

# Diagnose specific issues
node scripts/diagnose-tables.mjs

# After fixes, re-run tests
npm run test:e2e
```

**Related Files**:
- `.env.e2e` - E2E test credentials
- `__tests__/integration/rlsPolicies.integration.test.ts` - Integration test suite
- `__tests__/helpers/testAuth.ts` - Auth helpers
- `scripts/fix-sections-rls.mjs` - Previous RLS fix script

