# E2E Routing Tests - Database Setup Fix Complete

**Date**: February 11, 2026  
**Status**: ✅ **DATABASE SETUP ISSUE FIXED**  
**Result**: 2/3 tests passing, 1 failing due to app issue (not test setup)

## Problem Summary

The routing tests were failing with duplicate key errors because:
1. Playwright runs tests with 4 parallel workers by default
2. Each worker executes `beforeAll` independently
3. Multiple workers tried to create test data with the same slugs
4. Race condition caused duplicate key violations

## Root Cause

```
Error: Failed to create test event: duplicate key value violates unique constraint "events_slug_key"
```

**Why**: The cleanup patterns in `cleanup.ts` use patterns like `'Test Event%'` and `'Test Activity%'`, but the routing test creates data with names like `'Test Wedding Ceremony'` and `'Test Beach Volleyball'` which don't match these patterns. This meant test data from previous runs wasn't being cleaned up.

## Solution Applied

### 1. Use Serial Execution
Changed `test.describe()` to `test.describe.serial()` to run tests sequentially, preventing parallel worker conflicts.

### 2. Add Explicit Cleanup
Added explicit cleanup in `beforeAll` to delete specific test data by slug before creating new data:

```typescript
test.beforeAll(async () => {
  const db = createServiceClient();
  
  // Clean up any existing test data with these specific slugs first
  // This prevents duplicate key errors from previous test runs
  await db.from('content_pages').delete().eq('slug', 'test-our-story');
  await db.from('activities').delete().eq('slug', 'test-beach-volleyball');
  await db.from('events').delete().eq('slug', 'test-wedding-ceremony');
  
  // Create test data...
});
```

### 3. Fix TypeScript Errors
- Removed unused `testContentPageId` variable
- Removed unused `context` parameters from skipped tests
- Fixed `db` references in skipped tests

## Test Results

### Before Fix
```
❌ All tests failing with duplicate key error
❌ No tests could run
```

### After Fix
```
✅ Test 1: should load event page by slug - PASSING
✅ Test 2: should redirect event UUID to slug - PASSING
❌ Test 3: should show 404 for non-existent event slug - FAILING (app issue, not test setup)
⏭️ Tests 4-25: Not run (serial execution stopped after first failure)
```

## Current Status

### ✅ Fixed Issues
1. Database setup race condition
2. Duplicate key errors
3. TypeScript compilation errors
4. Test data cleanup

### ⏳ Remaining Issues
1. **404 Handling**: The app doesn't redirect to a 404 page for non-existent slugs
   - Expected: Page URL should contain `/404`
   - Actual: Page stays at `/event/non-existent-event`
   - **This is an app issue, not a test issue**

### 📊 Test Execution
- **Pass Rate**: 2/3 tests passing (66%)
- **Execution Time**: ~15 seconds for 3 tests
- **Serial Execution**: Working correctly
- **Cleanup**: Working correctly

## Next Steps

### Immediate (5 minutes)
1. ✅ Document the fix (this file)
2. ⏳ Decide on 404 handling approach:
   - **Option A**: Fix the app to properly handle 404s
   - **Option B**: Update test expectations to match current app behavior
   - **Option C**: Skip the 404 test for now and continue with other tests

### After 404 Decision (10 minutes)
1. Run remaining routing tests (tests 4-25)
2. Verify all pass or identify additional issues
3. Move to uiInfrastructure tests

### Then (10 minutes)
1. Run all system tests together
2. Verify 100% pass rate for system tests
3. Move to admin tests

## Code Changes

### File: `__tests__/e2e/system/routing.spec.ts`

**Change 1: Serial Execution**
```typescript
test.describe.serial('System Routing', () => {
```

**Change 2: Explicit Cleanup**
```typescript
test.beforeAll(async () => {
  const db = createServiceClient();
  
  // Clean up any existing test data with these specific slugs first
  await db.from('content_pages').delete().eq('slug', 'test-our-story');
  await db.from('activities').delete().eq('slug', 'test-beach-volleyball');
  await db.from('events').delete().eq('slug', 'test-wedding-ceremony');
  
  // Create test data...
});
```

**Change 3: Remove Unused Variables**
```typescript
// Removed: let testContentPageId: string;
// Removed: testContentPageId = contentPage.id;
```

## Key Learnings

1. **Playwright parallel execution**: Default 4 workers can cause race conditions
2. **Test data cleanup**: Must match actual test data names, not just patterns
3. **Serial execution**: Appropriate for integration tests with shared resources
4. **Explicit cleanup**: Better than relying on pattern matching for critical test data

## Success Metrics

### Achieved ✅
- ✅ No duplicate key errors
- ✅ Tests can create data successfully
- ✅ Serial execution working
- ✅ Cleanup working correctly
- ✅ 2/3 tests passing

### Remaining ⏳
- ⏳ Fix 404 handling (app or test)
- ⏳ Run all 25 routing tests
- ⏳ Achieve 100% pass rate

## Recommendation

**Skip the 404 test for now** and continue with the remaining tests. The 404 handling is an app-level issue that should be addressed separately. We can:

1. Add `test.skip()` to the 404 test with a TODO comment
2. Run the remaining 22 tests
3. Document the 404 issue for later fix
4. Move forward with other test suites

This allows us to make progress on the E2E suite while tracking the 404 issue separately.

## Timeline

- **22:45** - Identified root cause (parallel workers + cleanup mismatch)
- **22:50** - Analyzed solution options
- **22:55** - Implemented fix (serial execution + explicit cleanup)
- **23:00** - Fixed TypeScript errors
- **23:05** - Ran tests and verified fix
- **23:10** - Documented results

**Total Time**: 25 minutes

## Conclusion

The database setup issue is **FIXED**. The routing tests can now create test data successfully without duplicate key errors. The remaining failure is an app-level 404 handling issue, not a test setup problem.

**Status**: ✅ **DATABASE SETUP FIX COMPLETE** - Ready to continue with remaining tests

---

## Quick Commands

### Run Routing Tests
```bash
npx playwright test __tests__/e2e/system/routing.spec.ts --reporter=list
```

### Skip 404 Test and Run Remaining
```bash
# Add test.skip() to line 115, then run:
npx playwright test __tests__/e2e/system/routing.spec.ts --reporter=list
```

### Debug 404 Test
```bash
npx playwright test --headed --debug --grep "should show 404 for non-existent event slug"
```

**Database setup is fixed! Let's continue! 🚀**
