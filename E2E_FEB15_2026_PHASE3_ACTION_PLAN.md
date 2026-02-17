# Phase 3 Action Plan - Path to 80% Pass Rate

**Date**: February 15, 2026  
**Current Status**: Phase 2 Complete - 93% guest auth (14/15 tests)  
**Overall Status**: ~73-74% overall pass rate (264-268/362 tests)  
**Phase 3 Target**: 80% overall pass rate (290/362 tests)

---

## Executive Summary

**Phase 3 Goal**: Reach 80% overall pass rate by fixing ~22-26 more tests across multiple patterns.

**Current State**:
- ✅ Phase 1 Complete: 70% pass rate (253/362 tests)
- ✅ Phase 2 Complete: 93% guest auth (14/15 tests)
- 🔄 Phase 3 Target: 80% pass rate (290/362 tests)

**Gap to Close**: Need to fix ~22-26 tests to reach 80% target

---

## What Phase 3 Entails

### Overview

Phase 3 focuses on fixing the next highest-impact failure patterns to reach 80% overall pass rate. Based on the comprehensive analysis, we'll target:

1. **Quick Wins** (Flaky + Did Not Run + Skipped): ~37 tests
2. **High-Impact Patterns** (Data Management, Reference Blocks, Email): ~30 tests

**Strategy**: Fix patterns with highest test count first to maximize pass rate improvement.

---

## Phase 3 Priorities

### Priority 1: Quick Wins (Target: +37 tests)

These are the easiest fixes with highest impact:

#### 1A. Stabilize Flaky Tests (4 tests)
**Current**: 4 flaky tests  
**Target**: 0 flaky tests  
**Impact**: +4 tests  
**Effort**: 4-6 hours

**What to do**:
- Add proper wait conditions
- Improve selectors
- Fix timing issues
- Add retry logic where appropriate

**Expected Result**: All 4 flaky tests become consistently passing

---

#### 1B. Fix "Did Not Run" Tests (19 tests)
**Current**: 19 tests didn't execute  
**Target**: All 19 tests execute  
**Impact**: +15-19 tests (assuming 80-100% pass rate)  
**Effort**: 6-8 hours

**What to do**:
1. Identify which tests didn't run
2. Check test file discovery
3. Fix configuration issues
4. Fix setup/teardown problems
5. Ensure all test files are included

**Expected Result**: All 19 tests execute, 15-19 pass

---

#### 1C. Enable Skipped Tests (14 tests)
**Current**: 14 tests explicitly skipped  
**Target**: Enable working tests  
**Impact**: +10-14 tests (assuming 70-100% pass rate)  
**Effort**: 4-6 hours

**What to do**:
1. Review each skipped test
2. Check if feature is implemented
3. Fix tests that can be fixed
4. Remove obsolete tests
5. Enable working tests

**Expected Result**: 10-14 tests enabled and passing

---

**Priority 1 Total**: +29-37 tests (4 + 15-19 + 10-14)  
**Priority 1 Effort**: 14-20 hours  
**Priority 1 Timeline**: 2-3 days

---

### Priority 2: High-Impact Patterns (Target: +30 tests)

After quick wins, focus on patterns with most failing tests:

#### 2A. Data Management Tests (~12 tests)
**Current**: Multiple failures in data management  
**Target**: Fix tree operations, CSV import, location hierarchy  
**Impact**: +10-12 tests  
**Effort**: 12-16 hours

**Known Issues**:
- Tree expand/collapse not working
- Location hierarchy selector issues
- CSV import validation
- Delete operations timing out

**What to do**:
1. Fix tree component rendering
2. Fix location hierarchy selectors
3. Add proper wait conditions for API calls
4. Fix delete operation timeouts

---

#### 2B. Reference Blocks Tests (~8 tests)
**Current**: Multiple failures in reference blocks  
**Target**: Fix reference creation, navigation, selection  
**Impact**: +6-8 tests  
**Effort**: 8-12 hours

**Known Issues**:
- Reference block creation
- Circular reference detection
- Broken reference handling
- Navigation between references

**What to do**:
1. Fix reference block picker
2. Fix circular reference detection
3. Add proper wait conditions
4. Fix navigation logic

---

#### 2C. Email Management Tests (~8 tests)
**Current**: Multiple failures in email management  
**Target**: Fix composer, recipient selection, scheduling  
**Impact**: +6-8 tests  
**Effort**: 8-12 hours

**Known Issues**:
- Email composer guest loading
- Recipient selection
- Email scheduling
- Draft saving

**What to do**:
1. Fix guest data loading in composer
2. Fix recipient selection UI
3. Add proper wait conditions
4. Fix draft save logic

---

**Priority 2 Total**: +22-28 tests (10-12 + 6-8 + 6-8)  
**Priority 2 Effort**: 28-40 hours  
**Priority 2 Timeline**: 1-2 weeks

---

## Phase 3 Timeline

### Week 1: Quick Wins
**Days 1-2**: Fix flaky tests + did not run tests  
**Day 3**: Enable skipped tests  
**Target**: +29-37 tests  
**New Pass Rate**: ~81-84% (282-290/362 tests)

### Week 2: High-Impact Patterns (if needed)
**Days 1-2**: Fix data management tests  
**Days 3-4**: Fix reference blocks tests  
**Day 5**: Fix email management tests  
**Target**: +22-28 tests  
**New Pass Rate**: ~87-92% (304-318/362 tests)

---

## Detailed Action Plan

### Step 1: Run Full E2E Suite (30 minutes)

**Purpose**: Get current baseline and identify exact failures

**Command**:
```bash
npm run test:e2e 2>&1 | tee e2e-phase3-baseline.log
```

**What to capture**:
- Total pass rate
- Number of flaky tests
- Number of did not run tests
- Number of skipped tests
- Specific failure patterns

**Output**: Baseline report for Phase 3

---

### Step 2: Analyze Results (30 minutes)

**Purpose**: Identify specific tests to fix

**Command**:
```bash
node scripts/analyze-e2e-patterns.mjs e2e-phase3-baseline.log
```

**What to identify**:
1. Which 4 tests are flaky?
2. Which 19 tests didn't run?
3. Which 14 tests are skipped?
4. Which tests fail in data management?
5. Which tests fail in reference blocks?
6. Which tests fail in email management?

**Output**: Prioritized list of tests to fix

---

### Step 3: Fix Quick Wins (2-3 days)

#### Day 1: Flaky Tests (4-6 hours)

**For each flaky test**:
1. Run test 10 times to identify flakiness pattern
2. Add proper wait conditions
3. Improve selectors
4. Add retry logic if needed
5. Verify test passes 10/10 times

**Command**:
```bash
# Run test 10 times
for i in {1..10}; do npm run test:e2e -- <test-file> -g "<test-name>"; done
```

---

#### Day 2: Did Not Run Tests (6-8 hours)

**Steps**:
1. List all test files in `__tests__/e2e/`
2. Compare with executed tests
3. Identify missing tests
4. Check test file discovery
5. Fix configuration issues
6. Verify all tests execute

**Command**:
```bash
# List all test files
find __tests__/e2e -name "*.spec.ts" | wc -l

# Check which tests executed
grep "Running" e2e-phase3-baseline.log | wc -l
```

---

#### Day 3: Skipped Tests (4-6 hours)

**Steps**:
1. Search for `.skip()` in test files
2. Review each skipped test
3. Check if feature is implemented
4. Fix or remove test
5. Enable working tests

**Command**:
```bash
# Find all skipped tests
grep -r "\.skip\(" __tests__/e2e/
```

---

### Step 4: Fix High-Impact Patterns (1-2 weeks)

#### Week 2 Day 1-2: Data Management (12-16 hours)

**Focus Areas**:
1. Tree expand/collapse
2. Location hierarchy
3. CSV import
4. Delete operations

**Approach**:
1. Run data management tests individually
2. Identify specific failures
3. Fix component issues
4. Add proper wait conditions
5. Verify fixes

**Command**:
```bash
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
```

---

#### Week 2 Day 3-4: Reference Blocks (8-12 hours)

**Focus Areas**:
1. Reference creation
2. Circular reference detection
3. Navigation
4. Selection

**Approach**:
1. Run reference blocks tests individually
2. Identify specific failures
3. Fix reference picker
4. Add proper wait conditions
5. Verify fixes

**Command**:
```bash
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

---

#### Week 2 Day 5: Email Management (8-12 hours)

**Focus Areas**:
1. Guest data loading
2. Recipient selection
3. Email scheduling
4. Draft saving

**Approach**:
1. Run email management tests individually
2. Identify specific failures
3. Fix composer issues
4. Add proper wait conditions
5. Verify fixes

**Command**:
```bash
npm run test:e2e -- __tests__/e2e/admin/emailManagement.spec.ts
```

---

## Success Criteria

### Phase 3 Minimum Success
- ✅ 80% overall pass rate (290/362 tests)
- ✅ All flaky tests stabilized (0 flaky)
- ✅ All tests execute (0 did not run)
- ✅ Working tests enabled (skipped tests reviewed)

### Phase 3 Stretch Success
- ✅ 85% overall pass rate (308/362 tests)
- ✅ Data management tests fixed
- ✅ Reference blocks tests fixed
- ✅ Email management tests fixed

---

## Risk Mitigation

### Risk 1: Quick Wins Don't Yield Expected Results

**Mitigation**:
- If quick wins yield < 20 tests, move to high-impact patterns
- Focus on patterns with highest test count
- Adjust timeline accordingly

### Risk 2: High-Impact Patterns Take Longer Than Expected

**Mitigation**:
- Fix one pattern at a time
- Verify fixes before moving to next pattern
- Stop at 80% if timeline exceeds 2 weeks

### Risk 3: Fixes Break Other Tests

**Mitigation**:
- Run full suite after each pattern fix
- Verify no regressions
- Revert if pass rate decreases

---

## Tracking Progress

### Daily Check-ins

**What to track**:
1. Tests fixed today
2. Current pass rate
3. Blockers encountered
4. Time spent
5. Next steps

**Format**:
```
Date: [date]
Tests Fixed: [number]
Current Pass Rate: [percentage]
Blockers: [list]
Time Spent: [hours]
Next: [action]
```

---

### Weekly Summary

**What to track**:
1. Tests fixed this week
2. Pass rate improvement
3. Patterns completed
4. Lessons learned
5. Next week plan

---

## Expected Outcomes

### Best Case (60% probability)
- Quick wins yield +35 tests
- Reach 82-84% pass rate in Week 1
- Phase 3 complete in 1 week
- Time: 14-20 hours

### Good Case (30% probability)
- Quick wins yield +25 tests
- Need some high-impact pattern fixes
- Reach 80-82% pass rate in 1.5 weeks
- Time: 28-40 hours

### Acceptable Case (10% probability)
- Quick wins yield +15 tests
- Need all high-impact pattern fixes
- Reach 80% pass rate in 2 weeks
- Time: 42-60 hours

---

## Next Steps

### Immediate (Today)
1. ✅ Read this action plan
2. 🔄 Run full E2E suite to get baseline
3. 🔄 Analyze results to identify specific tests
4. 🔄 Create prioritized fix list

### Short-term (This Week)
1. Fix flaky tests (Day 1)
2. Fix did not run tests (Day 2)
3. Enable skipped tests (Day 3)
4. Verify 80% pass rate achieved

### Medium-term (Next Week, if needed)
1. Fix data management tests
2. Fix reference blocks tests
3. Fix email management tests
4. Verify 85% pass rate achieved

---

## Quick Commands Reference

### Run Full E2E Suite
```bash
npm run test:e2e 2>&1 | tee e2e-phase3-baseline.log
```

### Analyze Patterns
```bash
node scripts/analyze-e2e-patterns.mjs e2e-phase3-baseline.log
```

### Find Flaky Tests
```bash
grep -i "flaky" e2e-phase3-baseline.log
```

### Find Did Not Run Tests
```bash
# Compare total test files vs executed tests
find __tests__/e2e -name "*.spec.ts" | wc -l
grep "Running" e2e-phase3-baseline.log | wc -l
```

### Find Skipped Tests
```bash
grep -r "\.skip\(" __tests__/e2e/
```

### Run Specific Pattern
```bash
npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
npm run test:e2e -- __tests__/e2e/admin/emailManagement.spec.ts
```

---

## Summary

**Phase 3 Goal**: 80% overall pass rate (290/362 tests)  
**Current**: ~73-74% (264-268/362 tests)  
**Gap**: ~22-26 tests to fix  
**Strategy**: Quick wins first, then high-impact patterns  
**Timeline**: 1-2 weeks  
**Effort**: 42-60 hours

**First Action**: Run full E2E suite to get current baseline

---

**Status**: Ready to begin Phase 3  
**Next**: Run full E2E suite and analyze results  
**Target**: 80% pass rate in 1-2 weeks

**Let's get started! 🚀**
