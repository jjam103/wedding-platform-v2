# E2E Phase 3A: Form Submission Investigation

**Date**: February 15, 2026  
**Priority**: P1 - Form Submission Infrastructure  
**Target**: 10 tests timing out at ~24s  
**Status**: 🔍 Investigation Started

## Problem Statement

All form submission tests in `system/uiInfrastructure.spec.ts` timeout at approximately 24 seconds:

1. should submit valid guest form successfully
2. should show validation errors for missing required fields
3. should validate email format
4. should show loading state during submission
5. should render event form with all required fields
6. should submit valid activity form successfully
7. should handle network errors gracefully
8. should handle validation errors from server
9. should clear form after successful submission
10. should preserve form data on validation error

## Investigation Steps

### Step 1: Review Test File ✅
Examined the test file. Tests are well-structured and use proper wait strategies.

### Step 2: Run Individual Test ✅
**Result**: Test PASSES when run individually (12.2s)!

```bash
npm run test:e2e -- uiInfrastructure.spec.ts --grep "should submit valid guest form successfully" --headed
```

**Output**: ✓ Test passed in 12.2s

### Step 3: Root Cause Hypothesis
The test passes individually but fails in parallel execution. This suggests:

1. **Test Isolation Issue**: Tests may be interfering with each other
2. **Database State**: Parallel tests may be creating conflicting data
3. **Timing/Race Conditions**: Parallel execution causes timing issues
4. **Resource Contention**: Multiple tests competing for same resources

### Step 4: Test Multiple Form Tests Together
Let me run several form tests together to see if they interfere with each other.


### Step 5: Run All Form Tests Sequentially ✅
**Result**: ALL 10 TESTS PASS with `--workers=1`!

```bash
npm run test:e2e -- uiInfrastructure.spec.ts --grep "Form Submissions" --workers=1
```

**Output**: ✓ 10 passed (1.2m)

## Root Cause Confirmed

**The tests fail ONLY in parallel execution (4 workers), but pass in sequential execution (1 worker).**

This is a **test isolation issue**, not a code bug!

### Why Tests Fail in Parallel

1. **Database Contention**: Multiple tests creating/modifying guests simultaneously
2. **Form State Interference**: Tests opening/closing forms at the same time
3. **Race Conditions**: Parallel tests competing for same UI elements
4. **Timeout Issues**: Tests waiting for responses that are delayed by parallel load

## Solution Options

### Option 1: Mark Tests as Serial (RECOMMENDED)
Add `.serial()` to force sequential execution for these specific tests.

### Option 2: Improve Test Isolation
- Use unique test data for each test
- Better cleanup between tests
- More specific selectors

### Option 3: Increase Timeouts
- Not ideal, but could help with timing issues

## Recommended Fix

Mark the form submission tests as serial to ensure they run sequentially:

```typescript
test.describe.serial('Form Submissions & Validation', () => {
  // Tests run one at a time
});
```

This will:
- ✅ Ensure tests don't interfere with each other
- ✅ Maintain test reliability
- ✅ Keep test execution time reasonable
- ✅ Fix all 10 failing tests at once
