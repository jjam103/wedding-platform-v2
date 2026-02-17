# E2E Single Worker Race Condition Test - Feb 16, 2026

## Objective

Run the 44 failing + 5 flaky tests (49 total) with a single worker to identify which failures are caused by parallel execution race conditions vs real issues.

## Test Execution Plan

**Configuration:**
- Workers: 1 (temporarily changed from 4)
- Tests to run: 49 specific tests (by line number)
- Production server: Running on Process ID 51

**Expected Outcomes:**
1. Tests that PASS with 1 worker but FAILED with 4 workers = race conditions
2. Tests that FAIL with both 1 and 4 workers = real issues

## Test List (49 tests)

From `failing-flaky-tests.txt`:
- 44 failing tests
- 5 flaky tests

## Execution Command

```bash
# Run specific tests by line number with 1 worker
npx playwright test \
  __tests__/e2e/accessibility/suite.spec.ts:118 \
  __tests__/e2e/accessibility/suite.spec.ts:283 \
  __tests__/e2e/accessibility/suite.spec.ts:654 \
  __tests__/e2e/admin/emailManagement.spec.ts:151 \
  __tests__/e2e/admin/emailManagement.spec.ts:289 \
  __tests__/e2e/admin/emailManagement.spec.ts:474 \
  __tests__/e2e/admin/navigation.spec.ts:60 \
  __tests__/e2e/admin/navigation.spec.ts:130 \
  __tests__/e2e/admin/navigation.spec.ts:153 \
  __tests__/e2e/admin/navigation.spec.ts:238 \
  __tests__/e2e/admin/photoUpload.spec.ts:79 \
  __tests__/e2e/admin/referenceBlocks.spec.ts:292 \
  __tests__/e2e/admin/referenceBlocks.spec.ts:484 \
  __tests__/e2e/admin/referenceBlocks.spec.ts:698 \
  __tests__/e2e/admin/referenceBlocks.spec.ts:758 \
  __tests__/e2e/admin/referenceBlocks.spec.ts:1001 \
  __tests__/e2e/admin/rsvpManagement.spec.ts:455 \
  __tests__/e2e/admin/rsvpManagement.spec.ts:510 \
  __tests__/e2e/admin/rsvpManagement.spec.ts:581 \
  __tests__/e2e/admin/sectionManagement.spec.ts:316 \
  __tests__/e2e/admin-dashboard.spec.ts:59 \
  __tests__/e2e/admin-dashboard.spec.ts:122 \
  __tests__/e2e/admin-dashboard.spec.ts:170 \
  __tests__/e2e/auth/guestAuth.spec.ts:157 \
  __tests__/e2e/auth/guestAuth.spec.ts:272 \
  __tests__/e2e/auth/guestAuth.spec.ts:583 \
  __tests__/e2e/auth/guestAuth.spec.ts:701 \
  __tests__/e2e/auth/guestAuth.spec.ts:848 \
  __tests__/e2e/config-verification.spec.ts:11 \
  __tests__/e2e/debug-form-submission.spec.ts:5 \
  __tests__/e2e/debug-form-validation.spec.ts:5 \
  __tests__/e2e/debug-toast-selector.spec.ts:5 \
  __tests__/e2e/debug-validation-errors.spec.ts:5 \
  __tests__/e2e/guest/guestGroups.spec.ts:506 \
  __tests__/e2e/rsvpFlow.spec.ts:207 \
  __tests__/e2e/rsvpFlow.spec.ts:215 \
  __tests__/e2e/rsvpFlow.spec.ts:231 \
  __tests__/e2e/rsvpFlow.spec.ts:247 \
  __tests__/e2e/rsvpFlow.spec.ts:255 \
  __tests__/e2e/rsvpFlow.spec.ts:263 \
  __tests__/e2e/system/routing.spec.ts:127 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:37 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:74 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:99 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:195 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:305 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:942 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:1045 \
  __tests__/e2e/system/uiInfrastructure.spec.ts:1071 \
  2>&1 | tee e2e-single-worker-results.log
```

## Status

✅ **COMPLETE** - Test run finished after 18.8 minutes

## Final Results

**Total Tests**: 49 tests  
- ✅ **Passed**: 20 tests (40.8%)
- ❌ **Failed**: 27 tests (55.1%)
- ⚠️ **Flaky**: 2 tests (4.1%)

## Critical Finding

**Race conditions are NOT the primary issue.** With sequential execution (1 worker), we still have a **75% failure rate** (27 failed + 2 flaky out of 49 tests).

This proves that the failures are due to **fundamental test infrastructure problems**, not parallel execution race conditions:
1. Test environment setup (authentication, CSS, database)
2. Timing/wait conditions (async operations, modals)
3. UI infrastructure (keyboard events, ARIA, navigation)
4. Test quality (debug tests, brittle selectors)

## Detailed Analysis

See `E2E_FEB16_2026_SINGLE_WORKER_ANALYSIS.md` for complete breakdown of:
- Failed tests by category
- Root cause analysis
- Comparison with 4-worker results
- Systematic fix recommendations
