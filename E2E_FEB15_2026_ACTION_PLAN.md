# E2E Test Suite - Action Plan & Strategy

**Date**: February 15, 2026  
**Current Status**: 67.7% pass rate (245/362 tests)  
**Target**: 100% pass rate  
**Timeline**: 6-8 weeks

---

## Executive Summary

**YES, there is a detailed plan to get to 100%** - it's documented in `E2E_FEB15_2026_COMPREHENSIVE_ANALYSIS.md` with:
- 4 phases with specific targets
- Estimated effort (90-132 hours)
- Pattern-based approach
- Weekly milestones

**This document provides the ACTIONABLE task list and execution strategy.**

---

## Question 1: Is There a Plan?

### Answer: YES - Both Document AND Task List

**Document**: `E2E_FEB15_2026_COMPREHENSIVE_ANALYSIS.md`
- Strategic overview
- Pattern analysis
- Timeline estimates
- Success factors

**Task List**: THIS DOCUMENT (below)
- Specific actions
- Priority order
- Quick wins identified
- Execution approach

---

## Question 2: Quick Wins vs. Individual Suites?

### Answer: START WITH QUICK WINS (Phase 1)

**Quick Wins First** (2-3 days, 37 tests):
1. ✅ Fix 4 flaky tests (add wait conditions)
2. 🔄 Investigate 19 "Did Not Run" tests (configuration issue)
3. ✅ Keep 14 skipped tests as-is (valid reasons)

**Then Pattern-Based Fixes** (Phases 2-4):
- Fix common patterns across multiple suites
- More efficient than suite-by-suite approach
- Fixes 10-20 tests per pattern

**Individual Suite Work**: Only for unique failures after patterns are fixed

---

## Question 3: Are Failure Patterns the Same?

### Answer: YES - Patterns Are Consistent

**Comparison with Previous Runs**:

| Pattern | Feb 12 | Feb 15 | Status |
|---------|--------|--------|--------|
| Authentication | ✅ | ✅ | Same issues |
| Form Submissions | ✅ | ✅ | Same issues |
| Reference Blocks | ✅ | ✅ | Same issues |
| RSVP Management | ✅ | ✅ | Same issues |
| Email Management | ✅ | ✅ | Same issues |

**Key Finding**: Failure patterns are STABLE - fixes will be durable

**New Issues**: None - all failures are known patterns

---

## Question 4: Sequential vs. 4 Workers?

### Answer: KEEP SEQUENTIAL (workers: 1)

**Why Sequential is Better**:

1. **Stability**: Production build + sequential = 67.7% pass rate
2. **Flaky Tests**: Reduced from 15 → 4 tests (73% reduction)
3. **Debugging**: Easier to diagnose failures
4. **Database**: No race conditions or conflicts
5. **Speed**: 50.5 min is acceptable (vs 120 min dev server)

**When to Switch to 4 Workers**:
- After reaching 90%+ pass rate
- After fixing all flaky tests
- After verifying database isolation
- For CI/CD only (keep sequential for local dev)

**Current Recommendation**: Keep `workers: 1` until Phase 3 complete

---

## Phase 1: Quick Wins (2-3 days)

### Priority: CRITICAL - Do This First

### Task 1.1: Fix Flaky Tests (4 tests, 4-6 hours)

**Tests**:
1. `__tests__/e2e/system/uiInfrastructure.spec.ts` - Form submission timing
2. `__tests__/e2e/admin/emailManagement.spec.ts` - Email composer loading
3. `__tests__/e2e/auth/guestAuth.spec.ts` - Authentication timing
4. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Reference block creation

**Actions**:
```bash
# Run flaky tests 10 times to identify patterns
npx playwright test --grep "flaky-test-name" --repeat-each=10

# Add proper wait conditions
# Fix: await page.waitForLoadState('networkidle')
# Fix: await page.waitForSelector('[data-testid="element"]')
# Fix: await page.waitForResponse(response => response.url().includes('/api/'))
```

**Success Criteria**: All 4 tests pass 10 times in a row

---

### Task 1.2: Investigate "Did Not Run" Tests (19 tests, 6-8 hours)

**CRITICAL**: These tests should be running but aren't

**Actions**:
```bash
# Step 1: List all tests Playwright discovers
npx playwright test --list > discovered-tests.txt

# Step 2: Compare with expected tests
# Check: Are all test files being discovered?
# Check: Are tests being filtered out by config?

# Step 3: Check for syntax errors
npx playwright test --reporter=list 2>&1 | grep -i "error"

# Step 4: Verify test file patterns in playwright.config.ts
# Current: testMatch: '**/__tests__/e2e/**/*.spec.ts'
# Check: Are all test files matching this pattern?

# Step 5: Check for missing dependencies
npm ls playwright @playwright/test
```

**Expected Issues**:
- Test files not matching pattern
- Syntax errors preventing discovery
- Missing imports or dependencies
- Test files in wrong directory

**Success Criteria**: All 19 tests either run or are intentionally skipped

---

### Task 1.3: Document Skipped Tests (14 tests, 2-3 hours)

**Action**: Add clear comments to each skipped test

**Template**:
```typescript
test.skip('test name', async ({ page }) => {
  // SKIPPED: [Reason]
  // Status: [Feature not implemented | Dev-only | Performance issue | Flaky]
  // Action: [Keep skipped | Fix when feature ready | Remove if obsolete]
  // GitHub Issue: #[issue-number] (if applicable)
  // Last Reviewed: [date]
});
```

**Files to Update**:
1. `__tests__/e2e/guest/guestGroups.spec.ts` (3 tests)
2. `__tests__/e2e/system/uiInfrastructure.spec.ts` (1 test)
3. `__tests__/e2e/admin/userManagement.spec.ts` (5 tests)
4. `__tests__/e2e/system/routing.spec.ts` (2 tests)
5. `__tests__/e2e/admin/emailManagement.spec.ts` (1 test)
6. `__tests__/e2e/auth/guestAuth.spec.ts` (1 test)

**Success Criteria**: All skipped tests have clear documentation

---

## Phase 2: Pattern-Based Fixes (1-2 weeks)

### Pattern 1: Guest Authentication (10-15 tests, 8-12 hours)

**Files**:
- `__tests__/e2e/auth/guestAuth.spec.ts`
- `__tests__/e2e/guest/guestGroups.spec.ts`

**Common Issues**:
- Session cookie not set correctly
- Email matching fails
- Magic link verification fails
- Logout doesn't clear session

**Fix Strategy**:
1. Review authentication flow in `app/api/auth/guest/`
2. Fix session cookie creation
3. Add proper wait conditions for auth redirects
4. Test with real auth flow (not mocked)

**Estimated Impact**: 10-15 tests fixed

---

### Pattern 2: Form Submissions (15-20 tests, 12-16 hours)

**Files**:
- `__tests__/e2e/system/uiInfrastructure.spec.ts`
- `__tests__/e2e/admin/contentManagement.spec.ts`
- `__tests__/e2e/admin/dataManagement.spec.ts`

**Common Issues**:
- Validation errors not displayed
- Loading states not shown
- Network errors not handled
- Form state not reset after submission

**Fix Strategy**:
1. Add `data-testid` attributes to form elements
2. Improve error message selectors
3. Add proper wait conditions for form submission
4. Test with both success and error scenarios

**Estimated Impact**: 15-20 tests fixed

---

### Pattern 3: Reference Blocks (8-10 tests, 8-12 hours)

**Files**:
- `__tests__/e2e/admin/referenceBlocks.spec.ts`
- `__tests__/e2e/admin/contentManagement.spec.ts`

**Common Issues**:
- Reference creation fails
- Circular reference detection doesn't work
- Broken reference handling fails
- Reference preview doesn't load

**Fix Strategy**:
1. Review reference block API endpoints
2. Fix circular reference detection logic
3. Add proper wait conditions for reference loading
4. Test with real reference data

**Estimated Impact**: 8-10 tests fixed

---

### Pattern 4: RSVP Management (10-12 tests, 8-12 hours)

**Files**:
- `__tests__/e2e/admin/dataManagement.spec.ts`

**Common Issues**:
- CSV export fails
- Capacity constraints not enforced
- Status cycling doesn't work
- Bulk operations fail

**Fix Strategy**:
1. Review RSVP service methods
2. Fix CSV export logic
3. Add capacity validation
4. Test with real RSVP data

**Estimated Impact**: 10-12 tests fixed

---

## Phase 3: Individual Fixes (2-3 weeks)

### Approach: Fix Remaining Failures One-by-One

**Process**:
1. Run full test suite to get current failures
2. Group failures by test file
3. Fix highest-impact files first
4. Re-run after each fix to verify

**Priority Order**:
1. Email Management (8 tests)
2. Data Management (12 tests)
3. Navigation (10 tests)
4. Admin Dashboard (5 tests)

**Estimated Effort**: 32-46 hours

---

## Phase 4: Edge Cases (1-2 weeks)

### Approach: Fix Remaining Edge Cases

**Focus**:
- System infrastructure tests
- User management tests
- Accessibility tests
- Responsive design tests

**Estimated Effort**: 8-14 hours

---

## Execution Strategy

### Recommended Approach

**Week 1: Quick Wins + Authentication**
```bash
# Day 1-2: Quick wins
- Fix 4 flaky tests
- Investigate 19 "did not run" tests
- Document 14 skipped tests

# Day 3-5: Authentication pattern
- Fix guest authentication (10-15 tests)
- Target: 75-80% pass rate
```

**Week 2-3: Form Submissions + Reference Blocks**
```bash
# Week 2: Form submissions
- Fix form submission pattern (15-20 tests)
- Target: 82-85% pass rate

# Week 3: Reference blocks + RSVP
- Fix reference blocks (8-10 tests)
- Fix RSVP management (10-12 tests)
- Target: 88-92% pass rate
```

**Week 4-5: Individual Fixes**
```bash
# Week 4: Email + Data Management
- Fix email management (8 tests)
- Fix data management (12 tests)
- Target: 93-95% pass rate

# Week 5: Navigation + Admin Dashboard
- Fix navigation (10 tests)
- Fix admin dashboard (5 tests)
- Target: 96-98% pass rate
```

**Week 6-8: Final Push**
```bash
# Week 6-7: Edge cases
- Fix system infrastructure (5 tests)
- Fix user management (2 tests)
- Target: 99-100% pass rate

# Week 8: Verification
- Run full suite 10 times
- Fix any remaining flaky tests
- Document all fixes
- Target: 100% pass rate (stable)
```

---

## Daily Workflow

### Morning (2-3 hours)
1. Run full test suite (50 min)
2. Analyze failures
3. Identify pattern or individual fix
4. Plan fix approach

### Afternoon (3-4 hours)
1. Implement fix
2. Run affected tests
3. Verify fix doesn't break other tests
4. Commit and document

### End of Day (30 min)
1. Run full test suite again
2. Update progress tracking
3. Plan next day's work

---

## Progress Tracking

### Daily Metrics
```bash
# Run this daily to track progress
npm run test:e2e 2>&1 | tee daily-results.log

# Extract metrics
grep "passed" daily-results.log
grep "failed" daily-results.log
grep "flaky" daily-results.log
```

### Weekly Report Template
```markdown
## Week [N] Progress Report

**Pass Rate**: [X]% (up from [Y]%)
**Tests Fixed**: [N] tests
**Patterns Completed**: [list]
**Blockers**: [list]
**Next Week Focus**: [list]
```

---

## Success Criteria

### Phase 1 Complete (Week 1)
- ✅ 4 flaky tests fixed
- ✅ 19 "did not run" tests investigated
- ✅ 14 skipped tests documented
- ✅ 75%+ pass rate

### Phase 2 Complete (Week 3)
- ✅ Authentication pattern fixed
- ✅ Form submission pattern fixed
- ✅ Reference blocks pattern fixed
- ✅ RSVP management pattern fixed
- ✅ 85%+ pass rate

### Phase 3 Complete (Week 5)
- ✅ Email management fixed
- ✅ Data management fixed
- ✅ Navigation fixed
- ✅ Admin dashboard fixed
- ✅ 95%+ pass rate

### Phase 4 Complete (Week 8)
- ✅ All edge cases fixed
- ✅ 100% pass rate
- ✅ All tests stable (10 consecutive runs)
- ✅ Documentation complete

---

## Recommendations

### Immediate Actions (This Week)

1. **Start with Task 1.2** (Did Not Run tests)
   - This is the highest priority
   - These tests should be running but aren't
   - Likely a configuration issue

2. **Fix Flaky Tests** (Task 1.1)
   - Quick wins
   - Improves stability
   - Builds momentum

3. **Document Skipped Tests** (Task 1.3)
   - Low effort
   - High value for future reference
   - Prevents confusion

### Configuration Decisions

**Keep Sequential Execution**:
```typescript
// playwright.config.ts
export default defineConfig({
  workers: 1, // Keep this until 90%+ pass rate
  // ... rest of config
});
```

**Use Production Build**:
```bash
# Always use production build for E2E tests
npm run build
npm run start &
npm run test:e2e
```

### Working with Agent

**Pattern-Based Approach**:
- "Fix authentication pattern across all test files"
- "Fix form submission pattern in uiInfrastructure.spec.ts"
- More efficient than "fix test X in file Y"

**Individual Test Approach**:
- Use for unique failures after patterns are fixed
- "Fix test 'should export CSV' in dataManagement.spec.ts"

---

## Conclusion

**You have a clear path to 100%**:
1. ✅ Detailed plan exists (comprehensive analysis document)
2. ✅ Actionable task list (this document)
3. ✅ Quick wins identified (37 tests in Phase 1)
4. ✅ Pattern-based approach (more efficient than suite-by-suite)
5. ✅ Failure patterns are stable (same as previous runs)
6. ✅ Sequential execution is working (keep workers: 1)

**Start with Phase 1 (Quick Wins)** - you'll see immediate progress and build momentum for the longer pattern-based fixes.

**Timeline**: 6-8 weeks to 100% with focused effort

**Next Step**: Run Task 1.2 (investigate "did not run" tests) - this is the highest priority and will give you the biggest immediate impact.

---

**Report Generated**: February 15, 2026  
**Current Status**: 67.7% pass rate (245/362 tests)  
**Target**: 100% pass rate (362/362 tests)  
**Approach**: Quick wins → Patterns → Individual fixes → Edge cases
