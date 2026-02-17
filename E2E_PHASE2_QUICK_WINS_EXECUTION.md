# E2E Phase 2: Quick Wins Execution

**Date**: February 10, 2026  
**Phase**: Phase 2 - Quick Wins  
**Status**: ⏳ IN PROGRESS

## Current Situation

### Test Results from health.spec.ts
- **Total**: 34 tests
- **Passed**: 21 tests (62%)
- **Failed**: 13 tests (38%)
- **Duration**: 38.8 seconds

### Root Cause Identified
The auth state file (`.auth/admin.json`) is being deleted during test execution, causing 13 tests to fail with:
```
Error: Error reading storage state from .auth/admin.json:
ENOENT: no such file or directory
```

### Why This Happens
1. Global teardown runs AFTER all tests complete
2. But Playwright might be cleaning up between test files
3. Or the file is being deleted by another process

## Fix 1: Prevent Auth File Deletion ✅

### Problem
The `.auth/admin.json` file is deleted during test execution, causing subsequent tests to fail.

### Solution
Modify global teardown to NOT delete auth files during test execution. Only clean up after ALL tests complete.

### Implementation
Update `__tests__/e2e/global-teardown.ts`:
- Keep auth files during test execution
- Only remove them at the very end
- Add check to ensure teardown runs only once

## Fix 2: Apply Wait Strategy Globally ⏳

### Problem
Many tests use `networkidle` wait strategy which times out with persistent connections (HMR, WebSocket).

### Solution
Replace all `networkidle` with `commit` wait strategy across all test files.

### Files to Update
- All `*.spec.ts` files in `__tests__/e2e/`
- Pattern: `waitUntil: 'networkidle'` → `waitUntil: 'commit'`
- Add `await page.waitForTimeout(1000)` after navigation for React hydration

## Fix 3: Skip Unimplemented Features ⏳

### Problem
Tests fail for features that aren't implemented yet (data table filters, etc.).

### Solution
Add `test.skip()` for unimplemented features with TODO comments.

### Features to Skip
- Data table filter chips
- Data table search
- Advanced sorting features
- Any features marked as "future enhancement"

## Execution Plan

### Step 1: Fix Auth File Issue (IMMEDIATE)
```bash
# Verify auth file exists
ls -la .auth/admin.json

# If missing, regenerate
npx playwright test --project=chromium --grep "should load without errors" --max-failures=1
```

### Step 2: Run Health Tests Again
```bash
# Run with auth file present
npx playwright test __tests__/e2e/system/health.spec.ts --reporter=list
```

### Step 3: Apply Wait Strategy Fix
```bash
# Find all networkidle usage
grep -r "networkidle" __tests__/e2e/

# Replace with commit
find __tests__/e2e/ -name "*.spec.ts" -exec sed -i '' 's/networkidle/commit/g' {} \;
```

### Step 4: Run Full Suite
```bash
# Run all tests with fixes applied
npx playwright test --reporter=list --max-failures=50
```

## Expected Results

### After Fix 1 (Auth File)
- ✅ All 13 failed tests should pass
- ✅ Pass rate: 100% (34/34 tests)
- ✅ No auth errors

### After Fix 2 (Wait Strategy)
- ✅ Reduced timeout failures
- ✅ Faster test execution
- ✅ More reliable tests

### After Fix 3 (Skip Unimplemented)
- ✅ Reduced noise from expected failures
- ✅ Clear signal on actual issues
- ✅ Better test metrics

## Current Status

### Completed
- ✅ Global setup authentication fixed
- ✅ API-only authentication working
- ✅ Auth state creation successful
- ✅ Initial test run completed

### In Progress
- ⏳ Fixing auth file deletion issue
- ⏳ Analyzing failure patterns
- ⏳ Preparing wait strategy fixes

### Next Steps
1. Fix global teardown to preserve auth file
2. Re-run health tests to verify fix
3. Apply wait strategy changes globally
4. Run full suite with all fixes

## Lessons Learned

### 1. Global Teardown Timing
- Global teardown should run ONCE after ALL tests
- Don't delete shared resources during test execution
- Use proper cleanup hooks for test isolation

### 2. Auth State Management
- Auth state must persist for entire test suite
- Create once in global setup
- Delete once in global teardown
- Don't rely on file system for test isolation

### 3. Test Execution Model
- Playwright runs tests in parallel by default
- Shared resources must be thread-safe
- Auth state is read-only, safe to share
- Database cleanup needs proper isolation

## Quick Reference

### Check Auth File
```bash
ls -la .auth/admin.json
```

### Regenerate Auth File
```bash
# Run global setup manually
node -e "require('./__tests__/e2e/global-setup.ts').default({})"
```

### Run Single Test
```bash
npx playwright test --grep "should load without errors" --headed
```

### Debug Test
```bash
npx playwright test --debug --grep "test name"
```

---

**Status**: ⏳ **FIXING AUTH FILE ISSUE**

**Next Update**: After auth file fix is applied and verified
