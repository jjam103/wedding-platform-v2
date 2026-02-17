# E2E Phase 1: Quick Wins - Detailed Action Plan

**Date**: February 15, 2026  
**Goal**: Fix 37 tests to reach 75% pass rate (272/362 tests)  
**Timeline**: 2-3 days (14-20 hours)  
**Current**: 67.7% pass rate (245/362 tests)

---

## Overview

Phase 1 focuses on low-hanging fruit that will give us the biggest impact with the least effort:
1. Stabilize 4 flaky tests
2. Fix 19 "did not run" tests
3. Enable 14 skipped tests

**Expected Outcome**: +27 tests passing (245 → 272), reaching 75% pass rate

---

## Task 1: Stabilize Flaky Tests (4 tests)

**Priority**: HIGH  
**Effort**: 4-6 hours  
**Impact**: +4 tests passing

### Current Flaky Tests

From the Feb 15 production run, we have 4 flaky tests. We need to identify which specific tests are flaky.

### Action Steps

1. **Identify Flaky Tests**
   ```bash
   # Run the full suite and capture flaky test names
   E2E_USE_PRODUCTION=true npx playwright test --reporter=json > flaky-tests.json
   ```

2. **Analyze Flaky Patterns**
   - Review test output for timing issues
   - Check for race conditions
   - Identify unstable selectors
   - Look for missing wait conditions

3. **Common Flaky Test Fixes**
   - Add `waitFor()` for dynamic content
   - Use `waitForLoadState('networkidle')` after navigation
   - Replace `click()` with `click({ force: true })` if needed
   - Add explicit waits for API responses
   - Use `toBeVisible()` instead of `toBeInTheDocument()`

4. **Verify Fixes**
   ```bash
   # Run each fixed test 10 times to verify stability
   E2E_USE_PRODUCTION=true npx playwright test <test-file> --repeat-each=10
   ```

### Success Criteria

- All 4 flaky tests pass consistently (10/10 runs)
- No new flaky tests introduced
- Test execution time doesn't increase significantly

---

## Task 2: Fix "Did Not Run" Tests (19 tests)

**Priority**: CRITICAL  
**Effort**: 6-8 hours  
**Impact**: +19 tests passing (if they pass once fixed)

### Why Tests Don't Run

Common reasons:
1. Test file not discovered by Playwright
2. Syntax errors in test file
3. Missing dependencies
4. Setup/teardown failures
5. Test suite configuration issues
6. File path issues

### Action Steps

1. **Identify "Did Not Run" Tests**
   ```bash
   # Parse test results to find tests that didn't execute
   node scripts/analyze-e2e-results.mjs --filter="did-not-run"
   ```

2. **Check Test File Discovery**
   ```bash
   # List all test files Playwright discovers
   npx playwright test --list
   ```

3. **Common Fixes**
   - Ensure test files match pattern in `playwright.config.ts`
   - Fix syntax errors in test files
   - Add missing imports
   - Fix test suite setup/teardown
   - Verify test file paths are correct

4. **Verify Each Test Runs**
   ```bash
   # Run each previously "did not run" test individually
   E2E_USE_PRODUCTION=true npx playwright test <test-file>
   ```

### Investigation Checklist

For each "did not run" test:
- [ ] File exists and is in correct location
- [ ] File matches test pattern (`*.spec.ts`)
- [ ] No syntax errors in file
- [ ] All imports resolve correctly
- [ ] Test suite setup doesn't fail
- [ ] Test is not conditionally skipped
- [ ] Test file is not in `.gitignore` or excluded

### Success Criteria

- All 19 tests execute (pass or fail, but they run)
- No test files are missing or misconfigured
- Test discovery works correctly

---

## Task 3: Enable Skipped Tests (14 tests)

**Priority**: MEDIUM  
**Effort**: 4-6 hours  
**Impact**: +0 to +14 tests passing (depends on why they were skipped)

### Why Tests Are Skipped

Tests are typically skipped for:
1. Known broken functionality
2. Features not yet implemented
3. Tests under development
4. Temporarily disabled due to flakiness
5. Platform-specific tests

### Action Steps

1. **Identify Skipped Tests**
   ```bash
   # Find all test.skip() calls
   grep -r "test.skip\|describe.skip" __tests__/e2e/
   ```

2. **Review Each Skipped Test**
   - Read the test description
   - Check git history for why it was skipped
   - Determine if feature is now implemented
   - Assess if test is still relevant

3. **Decision Matrix**

   For each skipped test, decide:
   
   **Option A: Enable and Fix**
   - Feature is implemented
   - Test is still relevant
   - Fix any issues and enable
   
   **Option B: Keep Skipped (with comment)**
   - Feature not yet implemented
   - Add clear comment explaining why
   - Create issue to track implementation
   
   **Option C: Remove Test**
   - Feature was removed
   - Test is obsolete
   - Delete the test

4. **Enable Tests One by One**
   ```typescript
   // Change from:
   test.skip('should do something', async ({ page }) => {
   
   // To:
   test('should do something', async ({ page }) => {
   ```

5. **Fix and Verify**
   ```bash
   # Run each newly enabled test
   E2E_USE_PRODUCTION=true npx playwright test <test-file>
   ```

### Success Criteria

- All 14 skipped tests are reviewed
- Tests are either enabled (and pass), kept skipped (with reason), or removed
- No tests are skipped without clear justification
- Documentation updated for any kept skips

---

## Execution Plan

### Day 1: Investigation and Setup (4-6 hours)

**Morning (2-3 hours)**:
1. Run full test suite to capture current state
2. Identify all 4 flaky tests
3. Identify all 19 "did not run" tests
4. Identify all 14 skipped tests
5. Create detailed list with test names and locations

**Afternoon (2-3 hours)**:
6. Analyze flaky test patterns
7. Investigate why "did not run" tests don't execute
8. Review skipped tests and categorize them
9. Create fix plan for each category

### Day 2: Fix Flaky and "Did Not Run" Tests (6-8 hours)

**Morning (3-4 hours)**:
1. Fix all 4 flaky tests
2. Verify flaky test fixes (run 10x each)
3. Commit flaky test fixes

**Afternoon (3-4 hours)**:
4. Fix "did not run" test discovery issues
5. Fix syntax errors or missing dependencies
6. Verify all 19 tests now execute
7. Commit "did not run" fixes

### Day 3: Enable Skipped Tests and Verify (4-6 hours)

**Morning (2-3 hours)**:
1. Review and categorize all 14 skipped tests
2. Enable tests that should work
3. Fix any issues with enabled tests

**Afternoon (2-3 hours)**:
4. Document tests that remain skipped
5. Remove obsolete tests
6. Run full test suite to verify Phase 1 complete
7. Generate progress report

---

## Tracking Progress

### Daily Checklist

**Day 1**:
- [ ] Full test suite run completed
- [ ] 4 flaky tests identified
- [ ] 19 "did not run" tests identified
- [ ] 14 skipped tests identified
- [ ] Fix plan created

**Day 2**:
- [ ] 4 flaky tests fixed and verified
- [ ] 19 "did not run" tests now execute
- [ ] Commits pushed

**Day 3**:
- [ ] 14 skipped tests reviewed
- [ ] Enabled tests fixed
- [ ] Documentation updated
- [ ] Full test suite run shows 75% pass rate

### Success Metrics

| Metric | Before Phase 1 | After Phase 1 | Target |
|--------|----------------|---------------|--------|
| Pass Rate | 67.7% | 75%+ | 75% |
| Passing Tests | 245 | 272+ | 272 |
| Flaky Tests | 4 | 0 | 0 |
| Did Not Run | 19 | 0 | 0 |
| Skipped | 14 | 0-14 | <5 |

---

## Risk Mitigation

### Potential Issues

1. **"Did Not Run" tests fail when enabled**
   - Expected: Some may fail
   - Mitigation: Count as progress if they execute
   - Next step: Fix failures in Phase 2

2. **Skipped tests reveal major bugs**
   - Expected: Some were skipped for good reason
   - Mitigation: Document and keep skipped if needed
   - Next step: Create issues for future work

3. **Flaky test fixes break other tests**
   - Expected: Changes may have side effects
   - Mitigation: Run full suite after each fix
   - Next step: Revert and try different approach

### Rollback Plan

If Phase 1 makes things worse:
1. Revert all commits from Phase 1
2. Analyze what went wrong
3. Create more conservative fix plan
4. Try again with smaller changes

---

## Next Steps After Phase 1

Once Phase 1 is complete (75% pass rate):

1. **Celebrate Progress**: +27 tests fixed!
2. **Generate Report**: Document what was fixed and how
3. **Plan Phase 2**: Pattern-based fixes (authentication, forms, references)
4. **Estimate Timeline**: Refine Phase 2 timeline based on Phase 1 learnings

---

## Commands Reference

### Run Full Suite
```bash
E2E_USE_PRODUCTION=true npx playwright test
```

### Run Specific Test File
```bash
E2E_USE_PRODUCTION=true npx playwright test __tests__/e2e/admin/dataManagement.spec.ts
```

### Run Test 10 Times (Flaky Test Verification)
```bash
E2E_USE_PRODUCTION=true npx playwright test <test-file> --repeat-each=10
```

### List All Tests
```bash
npx playwright test --list
```

### Generate HTML Report
```bash
npx playwright show-report
```

### Find Skipped Tests
```bash
grep -r "test.skip\|describe.skip" __tests__/e2e/
```

---

## Documentation

### Files to Update

1. **E2E_FEB15_2026_PHASE1_PROGRESS.md**: Daily progress tracking
2. **E2E_FEB15_2026_PHASE1_COMPLETE.md**: Final summary when done
3. **playwright.config.ts**: Any configuration changes
4. **Test files**: Comments explaining fixes

### Commit Message Format

```
fix(e2e): [Phase 1] Fix flaky test in data management

- Added waitFor() for dynamic content loading
- Improved selector specificity
- Verified stability with 10 consecutive runs

Part of Phase 1: Quick Wins (Task 1)
```

---

**Created**: February 15, 2026  
**Status**: Ready to Execute  
**Next Action**: Start Day 1 investigation
