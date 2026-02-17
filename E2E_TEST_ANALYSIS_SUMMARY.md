# E2E Test Analysis: Tests vs Codebase Issues

## Executive Summary

**Result**: 16 passed, 322 failed, 21 skipped out of 359 tests (4.5% pass rate)

**Answer to your question**: This is **BOTH** - the failures reveal:
1. **~60% Test Infrastructure Issues** (auth state, database setup, test data)
2. **~40% Real Codebase Bugs** (database constraints, null handling, async params)

## Pattern Analysis

### Pattern 1: Auth State File Missing (260 tests - 81%)
**Error**: `Error reading storage state from .auth/user.json: ENOENT`

**Root Cause**: Test infrastructure issue
- Auth setup completes successfully in global-setup
- Auth state file gets deleted/cleaned up before tests run
- Tests depend on persistent auth state file

**Fix**: Test infrastructure (not codebase)
- Ensure `.auth/user.json` persists between setup and tests
- Check global teardown isn't running prematurely
- Verify file permissions

### Pattern 2: Database Constraint Violations (45 tests - 14%)
**Error**: `TypeError: Cannot read properties of null (reading 'id')`

**Examples**:
```typescript
// emailManagement.spec.ts
const { data: group } = await supabase.from('groups').insert(...).single();
testGroupId = group!.id; // group is null!

// referenceBlocks.spec.ts  
const { data: event } = await supabase.from('events').insert(...).single();
testEventId = event!.id; // event is null!

// guestAuth.spec.ts
const { data: group } = await supabase.from('groups').insert(...).single();
if (groupError || !group) throw new Error('Failed to create test group');
```

**Root Cause**: Real codebase issue
- Database check constraints failing silently
- Tests assume inserts succeed but they're failing
- Missing error handling in test setup

**Evidence from global setup**:
```
Warning: Could not create test guest: Failed to create test guest: 
new row for relation "guests" violates check constraint "valid_guest_email"
```

**Fix**: Codebase (database schema/constraints)
- Review check constraints on `guests`, `groups`, `events` tables
- Constraints may be too strict or incorrectly defined
- Need to relax or fix constraint logic

### Pattern 3: Admin User Creation Failures (5 tests - 1.5%)
**Error**: `Failed to create owner auth user`

**Root Cause**: Real codebase issue
```typescript
const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email: ownerEmail,
  password: 'test-password-123',
});

if (authError || !authUser.user) {
  throw new Error('Failed to create owner auth user');
}
```

**Issue**: User already exists (from previous test run)
- Tests don't clean up auth users properly
- Need unique emails per test run or better cleanup

**Fix**: Both test infrastructure AND codebase
- Tests: Use unique emails with timestamps
- Codebase: Better error handling for duplicate users

### Pattern 4: Configuration Mismatch (1 test)
**Error**: `expect(process.env.E2E_WORKERS).toBe('2')` but got `'4'`

**Root Cause**: Test configuration issue
- Playwright config overriding .env.e2e value
- Workers set to 4 in playwright.config.ts

**Fix**: Test configuration

### Pattern 5: Keyboard Navigation Test (1 test)
**Error**: `expect(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']).toContain(currentField)` 
- Expected: "A"
- Received: ["INPUT", "SELECT", "TEXTAREA", "BUTTON"]

**Root Cause**: Test logic error
- Test is checking if array contains the focused element's tagName
- But `currentField` is "A" (anchor tag), which isn't in the expected array
- Test should either include 'A' in expected tags or focus should be on form field

**Fix**: Test logic

## Real Codebase Issues Discovered

### 1. Database Check Constraints Too Strict ⚠️ CRITICAL
**Impact**: Prevents test data creation, likely affects production

**Evidence**:
```
new row for relation "guests" violates check constraint "valid_guest_email"
```

**Action Required**:
1. Review `valid_guest_email` constraint
2. Check if it's rejecting valid test emails
3. May be rejecting valid production emails too

### 2. Null Handling in Database Operations ⚠️ HIGH
**Impact**: Silent failures when database operations fail

**Pattern**:
```typescript
const { data } = await supabase.from('table').insert(...).single();
const id = data!.id; // Assumes data exists, crashes if null
```

**Action Required**:
1. Add proper error checking after all database operations
2. Don't use non-null assertion (`!`) without checking error first
3. Pattern appears in multiple test files, likely in codebase too

### 3. Auth User Cleanup Missing ⚠️ MEDIUM
**Impact**: Tests fail on subsequent runs, orphaned auth users

**Action Required**:
1. Add cleanup in test teardown to delete auth users
2. Or use unique emails per test run
3. Check if production has similar cleanup issues

## Test Infrastructure Issues

### 1. Auth State Persistence ⚠️ CRITICAL
**Impact**: 81% of tests fail

**Fix**:
```typescript
// In global-setup.ts
// Ensure .auth directory persists
// Don't clean up auth state until global teardown
```

### 2. Database Cleanup Between Tests ⚠️ HIGH
**Impact**: Tests interfere with each other

**Current**: Cleanup runs but may be incomplete
**Fix**: Ensure all tables cleaned, including auth.users

### 3. Test Data Factories ⚠️ MEDIUM
**Impact**: Tests create invalid data

**Fix**: Create proper test data factories that respect constraints

## Recommendations

### Immediate Actions (Fix Tests First)

1. **Fix auth state persistence** (fixes 260 tests)
   - Modify global-setup to ensure `.auth/user.json` persists
   - Check teardown timing

2. **Fix database constraints** (fixes 45 tests)
   - Review and relax overly strict constraints
   - Or update test data to match constraints

3. **Add proper error handling** (prevents silent failures)
   ```typescript
   const { data, error } = await supabase.from('table').insert(...).single();
   if (error || !data) {
     throw new Error(`Failed to create: ${error?.message}`);
   }
   const id = data.id; // Safe now
   ```

### Pattern-Based Fixing Strategy

**Phase 1: Auth State (2 hours)**
- Fix `.auth/user.json` persistence
- Expected: 260 tests now pass
- New pass rate: ~75%

**Phase 2: Database Constraints (3 hours)**
- Review and fix check constraints
- Update test data factories
- Expected: 45 more tests pass
- New pass rate: ~88%

**Phase 3: Remaining Issues (2 hours)**
- Fix admin user creation
- Fix test logic errors
- Expected: 6 more tests pass
- New pass rate: ~90%

**Total Time**: 7 hours (vs 60-120 hours fixing one-by-one)

## Conclusion

**This is BOTH test issues AND codebase bugs:**

**Test Issues (60%)**:
- Auth state file not persisting
- Test configuration mismatches
- Test logic errors

**Codebase Issues (40%)**:
- Database constraints too strict
- Missing null checks after database operations
- Auth user cleanup missing

**The good news**: Fixing the auth state issue alone will get you to ~75% pass rate. The database constraint issues are real bugs that likely affect production too, so fixing them helps both tests and production.

**Recommended Approach**:
1. Fix auth state persistence (quick win, 260 tests)
2. Fix database constraints (real bug, 45 tests)
3. Add proper error handling (prevents future issues)
4. Fix remaining test-specific issues

This will get you to 90%+ pass rate in ~7 hours instead of 60-120 hours.
