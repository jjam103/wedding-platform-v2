# E2E Guest Authentication - Remaining Test Failures Diagnosis

**Date**: 2026-02-06
**Status**: 8/15 tests passing (53%)

## Current Test Results

### ✅ Passing Tests (8)
1. should successfully authenticate with email matching
2. should show error for non-existent email
3. should show error for invalid email format
5. should create session cookie on successful authentication
10. should show error for invalid or missing token
11. should complete logout flow
12. should persist authentication across page refreshes
13. should switch between authentication tabs

### ❌ Failing Tests (7)

#### Test 4: "should show loading state during authentication"
**Status**: API routes returning 500 errors
**Root Cause**: Missing tables in E2E database
- `settings` table doesn't exist (actual table is `system_settings`)
- `announcements` table doesn't exist at all

**Evidence**:
```bash
❌ settings                  MISSING
   Error: Could not find the table 'public.settings' in the schema cache

❌ announcements             MISSING
   Error: Could not find the table 'public.announcements' in the schema cache
```

**API Routes Affected**:
- `/api/guest/wedding-info` - queries `settings` table (should be `system_settings`)
- `/api/guest/announcements` - queries `announcements` table (doesn't exist)

**Fix Required**:
1. Update `/api/guest/wedding-info/route.ts` to query `system_settings` instead of `settings`
2. Create `announcements` table migration OR remove the announcements feature
3. Update `/api/guest/announcements/route.ts` accordingly

#### Tests 6-9: Magic Link Authentication Tests
**Status**: All 4 tests failing
**Tests**:
- Test 6: should successfully request and verify magic link
- Test 7: should show success message after requesting magic link
- Test 8: should show error for expired magic link
- Test 9: should show error for already used magic link

**Root Cause**: Unknown - need to run tests to see actual errors
**Likely Issues**:
- Magic link routes exist and look correct
- May be related to missing `announcements` table causing page load failures
- May be related to audit logs missing `details` column

**Fix Required**: Run tests individually to diagnose

#### Tests 14-15: Error Handling and Audit Logs
**Status**: Timing out after 120 seconds
**Tests**:
- Test 14: should handle authentication errors gracefully
- Test 15: should log authentication events in audit log

**Root Cause**: Test 15 queries `audit_logs` table for `details` column
**Evidence**: Migration 053 adds `action` and `details` columns to `audit_logs`

**Fix Required**:
1. Apply migration 053 to E2E database
2. Verify `audit_logs` has `action` and `details` columns

## Fix Priority

### Priority 1: Fix API Routes (Test 4)
**Impact**: Blocks authentication flow testing
**Effort**: Low (2 file changes)
**Files**:
1. `app/api/guest/wedding-info/route.ts` - Change `settings` to `system_settings`
2. `app/api/guest/announcements/route.ts` - Either create table or return empty array

### Priority 2: Apply Audit Logs Migration (Tests 14-15)
**Impact**: Blocks audit logging tests
**Effort**: Low (run existing migration script)
**Action**: Run `node scripts/apply-audit-logs-migration.mjs`

### Priority 3: Diagnose Magic Link Tests (Tests 6-9)
**Impact**: Blocks magic link feature testing
**Effort**: Medium (need to run tests and diagnose)
**Action**: Run tests individually after fixing Priority 1 & 2

## Recommended Fix Order

1. **Fix wedding-info API route** (change `settings` → `system_settings`)
2. **Fix announcements API route** (return empty array or create table)
3. **Apply audit logs migration** (add `action` and `details` columns)
4. **Run Test 4** to verify API fixes work
5. **Run Tests 14-15** to verify audit logs work
6. **Run Tests 6-9** individually to diagnose magic link issues
7. **Fix magic link issues** based on test output

## Expected Outcome

After fixes:
- Test 4 should pass (API routes return valid data)
- Tests 14-15 should pass (audit logs have required columns)
- Tests 6-9 may pass or reveal new issues to fix

**Target**: 15/15 tests passing (100%)
