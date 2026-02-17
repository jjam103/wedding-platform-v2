# E2E Test Suite - Immediate Action Plan (Corrected)

**Date**: February 11, 2026  
**Current Status**: 220/343 passing (64.1%)  
**Target**: 343/343 passing (100%)  
**Gap**: 123 tests (90 failed + 19 flaky + 14 skipped)

---

## Quick Summary

After analyzing the actual 90 failures, we found:

1. **58% are timeouts** - Fix wait conditions globally
2. **17% are null references** - Add null checks in test helpers
3. **29% in 2 files** - Fix system/uiInfrastructure.spec.ts and rsvpFlow.spec.ts
4. **Pattern-based fixes work** - 32 hours to 100%

---

## Phase 1: Critical Infrastructure (12 hours → 85% pass rate)

### Task 1.1: Global Wait Strategy (4 hours)
**Impact**: Fixes ~30-40 timeout failures (33-44% of failures)

**What to do**:
1. Create `__tests__/helpers/e2eWaiters.ts` with standard wait functions
2. Add `waitForLoadState('networkidle')` after all navigation
3. Increase all timeouts from 5s to 30s
4. Add explicit waits before assertions

**Files to update**:
- All test files with `page.goto()`
- All test files with `expect().toBeVisible()`
- All test files with `waitForResponse()`

**Verification**:
```bash
npx playwright test system/uiInfrastructure.spec.ts
# Should see significant improvement
```

---

### Task 1.2: Null Reference Fixes (3 hours)
**Impact**: Fixes 15 TypeError failures (17% of failures)

**What to do**:
1. Add null checks in `__tests__/helpers/e2eHelpers.ts`
2. Update all test helpers to validate data before accessing properties
3. Add better error messages for debugging

**Example fix**:
```typescript
// Before
const id = element.getAttribute('data-id');
await doSomething(id);

// After
const id = element.getAttribute('data-id');
if (!id) {
  throw new Error('Element missing data-id attribute');
}
await doSomething(id);
```

**Files to update**:
- `__tests__/helpers/e2eHelpers.ts`
- `admin/referenceBlocks.spec.ts`
- `admin/rsvpManagement.spec.ts`
- `guest/guestGroups.spec.ts`

**Verification**:
```bash
npx playwright test admin/referenceBlocks.spec.ts
# Should see all 8 failures fixed
```

---

### Task 1.3: UI Infrastructure File (5 hours)
**Impact**: Fixes 16 failures (18% of failures)

**What to do**:
1. Focus exclusively on `system/uiInfrastructure.spec.ts`
2. Apply wait strategy from Task 1.1
3. Fix all timeout/visibility issues in this one file

**Verification**:
```bash
npx playwright test system/uiInfrastructure.spec.ts
# Should see all 16 failures fixed
```

---

**Phase 1 Expected Result**:
- **Before**: 220/343 passing (64.1%)
- **After**: ~291/343 passing (85%)
- **Improvement**: +71 tests fixed

---

## Phase 2: Critical User Journeys (10 hours → 95% pass rate)

### Task 2.1: RSVP Flow (4 hours)
**Impact**: Fixes 10 failures (11% of failures)

**What to do**:
1. Fix all failures in `rsvpFlow.spec.ts`
2. Apply wait strategy
3. Ensure complete RSVP workflow works end-to-end

**Verification**:
```bash
npx playwright test rsvpFlow.spec.ts
# Should see all 10 failures fixed
```

---

### Task 2.2: Guest Groups (3 hours)
**Impact**: Fixes 8 failures (9% of failures)

**What to do**:
1. Fix all failures in `guest/guestGroups.spec.ts`
2. Apply null checks
3. Fix guest group management workflow

**Verification**:
```bash
npx playwright test guest/guestGroups.spec.ts
# Should see all 8 failures fixed
```

---

### Task 2.3: Reference Blocks (3 hours)
**Impact**: Fixes 8 failures (9% of failures)

**What to do**:
1. Fix all failures in `admin/referenceBlocks.spec.ts`
2. Apply null checks from Task 1.2
3. Fix reference picker interactions

**Verification**:
```bash
npx playwright test admin/referenceBlocks.spec.ts
# Should see all 8 failures fixed
```

---

**Phase 2 Expected Result**:
- **Before**: ~291/343 passing (85%)
- **After**: ~317/343 passing (92%)
- **Improvement**: +26 tests fixed

---

## Phase 3: Remaining Issues (6 hours → 98% pass rate)

### Task 3.1: Navigation & RSVP Management (3 hours)
**Impact**: Fixes 18 failures

**Files**:
- `admin/navigation.spec.ts` (9 failures)
- `admin/rsvpManagement.spec.ts` (9 failures)

---

### Task 3.2: Scattered Failures (3 hours)
**Impact**: Fixes remaining ~3 failures

**Files**:
- `admin/dataManagement.spec.ts` (6 failures)
- `auth/guestAuth.spec.ts` (5 failures)
- Others (scattered)

---

**Phase 3 Expected Result**:
- **Before**: ~317/343 passing (92%)
- **After**: ~336/343 passing (98%)
- **Improvement**: +19 tests fixed

---

## Phase 4: Flaky Tests (4 hours → 100% pass rate)

### Task 4.1: Eliminate Flakiness (4 hours)
**Impact**: Fixes 19 flaky tests

**What to do**:
1. Identify flaky test patterns
2. Add retry logic where appropriate
3. Improve wait conditions
4. Run suite 3x to verify stability

---

**Phase 4 Expected Result**:
- **Before**: ~336/343 passing (98%)
- **After**: 343/343 passing (100%)
- **Improvement**: +7 tests fixed, 0 flaky

---

## Total Timeline

| Phase | Time | Tests Fixed | Pass Rate |
|-------|------|-------------|-----------|
| Start | 0h | 0 | 64.1% |
| Phase 1 | 12h | 71 | 85% |
| Phase 2 | 10h | 26 | 92% |
| Phase 3 | 6h | 19 | 98% |
| Phase 4 | 4h | 7 | 100% |
| **Total** | **32h** | **123** | **100%** |

---

## Quick Start Commands

### Run Analysis
```bash
node scripts/analyze-90-failures.mjs
```

### Run Specific Files
```bash
# Highest priority
npx playwright test system/uiInfrastructure.spec.ts
npx playwright test rsvpFlow.spec.ts

# High priority
npx playwright test admin/referenceBlocks.spec.ts
npx playwright test guest/guestGroups.spec.ts
npx playwright test admin/navigation.spec.ts
npx playwright test admin/rsvpManagement.spec.ts
```

### Run Full Suite
```bash
npx playwright test --reporter=list
```

---

## Success Criteria

### After Phase 1 (12 hours)
- [ ] 85% pass rate (291/343 tests)
- [ ] All timeout issues resolved
- [ ] All null reference issues resolved
- [ ] system/uiInfrastructure.spec.ts passing

### After Phase 2 (22 hours)
- [ ] 92% pass rate (317/343 tests)
- [ ] rsvpFlow.spec.ts passing
- [ ] guest/guestGroups.spec.ts passing
- [ ] admin/referenceBlocks.spec.ts passing

### After Phase 3 (28 hours)
- [ ] 98% pass rate (336/343 tests)
- [ ] All navigation tests passing
- [ ] All RSVP management tests passing

### After Phase 4 (32 hours)
- [ ] 100% pass rate (343/343 tests)
- [ ] 0 flaky tests
- [ ] Suite runs stable 3x in a row

---

## Key Files to Reference

1. **E2E_ACTUAL_90_FAILURES_PATTERN_ANALYSIS.md** - Detailed pattern analysis
2. **E2E_CORRECTED_STRATEGY_COMPARISON.md** - Comparison to previous strategy
3. **E2E_90_FAILURES_ANALYSIS.json** - Raw failure data
4. **E2E_FULL_SUITE_RESULTS_CORRECTED.md** - Original corrected results

---

## Immediate Next Step

**Start with Phase 1, Task 1.1: Global Wait Strategy (4 hours)**

This will fix ~30-40 timeout failures immediately and prove the pattern-based approach works.

---

**Status**: Ready for execution  
**Priority**: Phase 1, Task 1.1  
**Expected Impact**: 33-44% of failures fixed in 4 hours
