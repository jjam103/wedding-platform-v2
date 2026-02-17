# E2E Step 1.2 - Database Setup Fix Summary

**Date**: February 11, 2026  
**Status**: Root Cause Identified - Fix in Progress  
**Issue**: Parallel test workers creating duplicate test data

## Problem Analysis

### Root Cause
The routing tests run with 4 parallel workers (Playwright default). Each worker executes the `beforeAll` hook independently, trying to:
1. Delete test data with specific slugs
2. Create new test data with those same slugs

This causes a race condition where:
- Worker 1 deletes `test-wedding-ceremony` and starts creating it
- Worker 2 deletes `test-wedding-ceremony` (deletes Worker 1's data!)
- Worker 3 tries to create `test-wedding-ceremony` → duplicate key error
- Worker 4 tries to create `test-wedding-ceremony` → duplicate key error

### Error Message
```
Error: Failed to create test event: duplicate key value violates unique constraint "events_slug_key"
```

### Why This Happens
Playwright runs tests in parallel by default with multiple workers. The `beforeAll` hook runs once per worker, not once globally. This means:
- 4 workers = 4 `beforeAll` executions
- All trying to create the same test data
- Race conditions and duplicate key violations

## Solution Options

### Option 1: Use Serial Execution (Quick Fix) ✅ RECOMMENDED
Make the test suite run serially so only one worker executes at a time.

**Pros**:
- Simple one-line change
- Guaranteed to work
- No race conditions

**Cons**:
- Slower execution (but routing tests are fast anyway)
- Doesn't scale well for large test suites

**Implementation**:
```typescript
test.describe.serial('System Routing', () => {
  // All tests run one at a time
});
```

### Option 2: Use Worker-Specific Test Data
Generate unique test data for each worker using worker index.

**Pros**:
- Maintains parallel execution
- Faster test runs

**Cons**:
- More complex
- Need to track worker-specific data
- Cleanup is harder

**Implementation**:
```typescript
test.beforeAll(async ({ }, testInfo) => {
  const workerIndex = testInfo.workerIndex;
  const slug = `test-wedding-ceremony-${workerIndex}`;
  // Create worker-specific test data
});
```

### Option 3: Use Global Setup for Shared Data
Create test data once in global setup, share across all workers.

**Pros**:
- Data created once
- Fast parallel execution
- Clean separation

**Cons**:
- More complex setup
- Need to pass data between setup and tests
- Cleanup timing is tricky

**Implementation**:
```typescript
// global-setup.ts
export default async function globalSetup() {
  // Create shared test data
  // Save IDs to file for tests to read
}
```

## Recommended Fix: Option 1 (Serial Execution)

For the routing tests specifically, serial execution is the best choice because:
1. The tests are fast (< 2 minutes total)
2. They test sequential user flows (navigation)
3. Simple implementation
4. No race conditions

### Implementation Steps

1. Change `test.describe()` to `test.describe.serial()`
2. Remove the delete statements (no longer needed)
3. Keep error handling for better diagnostics
4. Run tests to verify

### Expected Results
- All 25 routing tests pass
- Execution time: ~2 minutes (acceptable)
- No duplicate key errors
- Clean test data creation

## Additional Issues Found

### Issue 2: testAuth Import Error
```
TypeError: Cannot read properties of undefined (reading 'createAdminSession')
```

**Root Cause**: The `testAuth` import is incorrect or the module doesn't export what we expect.

**Fix**: Check the actual export from `testAuth.ts` and update the import.

## Next Steps

### Immediate (5 minutes)
1. ✅ Change to `test.describe.serial()`
2. ✅ Fix `testAuth` import
3. ✅ Run routing tests
4. ✅ Verify all pass

### After Routing Tests Pass (10 minutes)
1. Move to uiInfrastructure tests (CSS detection issues)
2. Fix CSS class selectors
3. Update page navigation expectations

### Then (10 minutes)
1. Run all system tests together
2. Verify 100% pass rate
3. Document results
4. Move to admin tests

## Code Changes

### File: `__tests__/e2e/system/routing.spec.ts`

**Change 1: Use Serial Execution**
```typescript
// Before
test.describe('System Routing', () => {

// After
test.describe.serial('System Routing', () => {
```

**Change 2: Remove Parallel-Unsafe Deletes**
```typescript
// Before
test.beforeAll(async () => {
  const db = createServiceClient();
  
  // Delete any existing test data with these specific slugs first
  await db.from('content_pages').delete().eq('slug', 'test-our-story');
  await db.from('activities').delete().eq('slug', 'test-beach-volleyball');
  await db.from('events').delete().eq('slug', 'test-wedding-ceremony');
  
  // Create test data...
});

// After
test.beforeAll(async () => {
  const db = createServiceClient();
  
  // Create test data (serial execution ensures no conflicts)
  // ...
});
```

**Change 3: Fix testAuth Import**
```typescript
// Check what testAuth actually exports
// Option A: Named export
import { testAuth } from '../../helpers/testAuth';

// Option B: Default export
import testAuth from '../../helpers/testAuth';

// Option C: Create inline
adminSession = { /* mock session */ };
```

## Timeline

- **22:45** - Identified root cause (parallel workers)
- **22:50** - Analyzed solution options
- **22:55** - Documented findings
- **23:00** - Ready to implement Option 1

**Total Time**: 15 minutes of analysis

## Key Learnings

1. **Playwright runs tests in parallel by default** - Need to account for this in test design
2. **beforeAll runs per worker, not globally** - Shared setup needs special handling
3. **Database constraints are your friend** - They caught the race condition immediately
4. **Serial execution is often the right choice** - Especially for integration tests with shared resources

## Success Criteria

After implementing the fix:
- ✅ All 25 routing tests pass
- ✅ No duplicate key errors
- ✅ Execution time < 3 minutes
- ✅ Clean test output
- ✅ Reliable (3 consecutive clean runs)

## Conclusion

We've identified the root cause of the database setup failures: parallel test workers creating duplicate test data. The solution is simple - use serial execution for these tests. This is appropriate because:
1. The tests are fast
2. They test sequential flows
3. It eliminates race conditions
4. It's easy to implement and maintain

**Status**: ✅ **ROOT CAUSE IDENTIFIED** - Ready to implement fix

---

## Quick Commands

### Run Routing Tests
```bash
npx playwright test __tests__/e2e/system/routing.spec.ts --reporter=list
```

### Run with Single Worker (Test Serial Behavior)
```bash
npx playwright test __tests__/e2e/system/routing.spec.ts --workers=1 --reporter=list
```

### Debug Specific Test
```bash
npx playwright test --headed --debug --grep "should load event page by slug"
```

**Let's implement the fix! 🚀**
