# E2E Test Suite - Systematic Fix Plan
**Date**: February 16, 2026  
**Current Status**: 333/360 tests passing (92.5%)  
**Remaining**: 27 tests (7.5%)

---

## Executive Summary

The E2E test suite has achieved 92.5% pass rate with all core functionality working:
- ✅ RSVP Management (18/18)
- ✅ Guest Groups (10/10)
- ✅ Content Management (17/17)
- ✅ Data Management (11/11)
- ✅ Guest Views (50/50)
- ✅ Guest Auth (15/15)
- ✅ Reference Blocks (8/8)

The remaining 27 failures fall into 4 clear categories with pattern-based fixes.

---

## Failure Breakdown by Category

### Phase 4B: Email Management (1 test) ⚠️
**Status**: Fix applied, pending verification  
**File**: `__tests__/e2e/admin/emailManagement.spec.ts`

**Test**: "should select recipients by group"
- **Root Cause**: Missing API route `/api/admin/groups/[id]/guests`
- **Fix Applied**: ✅ Created API route
- **Fix Applied**: ✅ Updated test with proper timeouts
- **Next Step**: Verify fix works

---

### Phase 4C: Accessibility (3 tests) ⚠️
**File**: `__tests__/e2e/accessibility/suite.spec.ts`

#### Test 1: Keyboard Navigation
**Likely Issue**: Focus management or keyboard event handling
**Pattern**: Navigation through interactive elements

#### Test 2: Responsive Design
**Likely Issue**: Viewport-specific layout or touch target sizes
**Pattern**: Mobile/tablet/desktop breakpoints

#### Test 3: Admin Dashboard Keyboard Navigation
**Likely Issue**: Complex dashboard with multiple interactive regions
**Pattern**: Focus trap or skip navigation

**Fix Strategy**:
1. Run accessibility suite to see exact failures
2. Check for missing `tabindex`, `aria-label`, or focus indicators
3. Verify touch target sizes meet WCAG 2.1 AA (44px minimum)
4. Test keyboard navigation flow manually

---

### Phase 4D: System Infrastructure (8 tests) ⚠️
**File**: `__tests__/e2e/system/uiInfrastructure.spec.ts`

#### CSS Delivery & Loading (4 tests)
**Likely Issues**:
- CSS file path detection (Next.js 16 changes)
- Tailwind class application timing
- Computed styles not ready

**Tests**:
1. "should load CSS and apply styles correctly"
2. "should apply Tailwind utility classes correctly"
3. "should apply borders, shadows, and responsive classes"
4. "should have no CSS-related console errors"

**Fix Strategy**:
- Update CSS detection to be more flexible
- Add proper wait conditions for styles to apply
- Handle Next.js 16 CSS bundling changes

#### Form Submissions (1 test)
**Test**: "should validate email format"
**Likely Issue**: Validation error display timing or selector

#### Admin Pages Styling (2 tests)
**Tests**:
1. "should have styled dashboard, guests, and events pages"
2. "should load photos page without B2 storage errors"

**Likely Issues**:
- Page load timing
- B2 storage initialization in test environment
- CSS application timing

#### Event Routing (1 test)
**Test**: Related to event page navigation
**Likely Issue**: Route params or navigation timing

---

### Phase 4E: Remaining Features (9 tests) ⚠️

#### Photo Upload (1 test)
**File**: `__tests__/e2e/admin/photoUpload.spec.ts` (likely)
**Test**: B2 storage integration
**Likely Issue**: B2 credentials or bucket configuration in E2E environment

#### Section Management (1 test)
**File**: `__tests__/e2e/admin/sectionManagement.spec.ts` (likely)
**Test**: Rich text editor interaction
**Likely Issue**: BlockNote editor timing or content saving

#### Admin Navigation (4 tests)
**File**: `__tests__/e2e/admin/navigation.spec.ts` (likely)
**Tests**: Navigation between admin pages
**Likely Issues**:
- Route transitions
- Active state indicators
- Breadcrumb navigation

#### Admin Dashboard (3 tests)
**File**: `__tests__/e2e/admin/dashboard.spec.ts` (likely)
**Tests**: Dashboard widgets and data display
**Likely Issues**:
- Data loading timing
- Widget rendering
- Chart/graph initialization

---

## Systematic Fix Approach

### Step 1: Verify Email Management Fix (5 minutes)
```bash
npm run test:e2e -- emailManagement.spec.ts -g "should select recipients by group"
```

**Expected**: Test passes  
**If fails**: Check API route and test timeout values

---

### Step 2: Run Full Suite to Get Exact Failures (10 minutes)
```bash
npm run test:e2e > e2e-results.log 2>&1
```

**Purpose**: Get exact error messages and stack traces for all 27 failures

---

### Step 3: Fix by Pattern (Not Individual Tests)

#### Pattern A: CSS/Styling Issues (6 tests)
**Root Cause**: Next.js 16 CSS bundling changes + timing issues

**Fix**:
1. Update CSS detection logic to handle Next.js 16 output
2. Add proper wait conditions for styles to apply
3. Use more flexible selectors for styled elements

**Files to Modify**:
- `__tests__/e2e/system/uiInfrastructure.spec.ts`

**Estimated Time**: 30 minutes

---

#### Pattern B: Accessibility Issues (3 tests)
**Root Cause**: Missing ARIA attributes or keyboard navigation

**Fix**:
1. Add missing `aria-label` attributes
2. Ensure proper `tabindex` on interactive elements
3. Add focus indicators
4. Verify touch target sizes

**Files to Modify**:
- Admin dashboard components
- Navigation components
- Form components

**Estimated Time**: 45 minutes

---

#### Pattern C: Timing/Loading Issues (8 tests)
**Root Cause**: Async operations not properly awaited

**Fix**:
1. Add proper wait conditions for data loading
2. Increase timeouts for slow operations
3. Use `waitForLoadState('commit')` instead of `networkidle`
4. Add explicit waits for specific elements

**Files to Modify**:
- Test files with navigation/loading issues

**Estimated Time**: 30 minutes

---

#### Pattern D: External Service Issues (2 tests)
**Root Cause**: B2 storage and external APIs not configured in E2E

**Fix**:
1. Mock B2 service in E2E tests
2. Add environment checks for external services
3. Skip tests that require external services in E2E

**Files to Modify**:
- Photo upload tests
- Email sending tests (if needed)

**Estimated Time**: 20 minutes

---

#### Pattern E: Rich Text Editor Issues (1 test)
**Root Cause**: BlockNote editor timing or content saving

**Fix**:
1. Add proper wait for editor initialization
2. Use editor-specific selectors
3. Wait for content to be saved

**Files to Modify**:
- Section management tests

**Estimated Time**: 15 minutes

---

#### Pattern F: Navigation Issues (6 tests)
**Root Cause**: Route transitions or active state

**Fix**:
1. Wait for navigation to complete
2. Verify URL changes
3. Check active state indicators

**Files to Modify**:
- Admin navigation tests
- Admin dashboard tests

**Estimated Time**: 30 minutes

---

## Total Estimated Time

| Phase | Tests | Time | Priority |
|-------|-------|------|----------|
| 4B: Email Management | 1 | 5 min | 🔴 High |
| 4C: Accessibility | 3 | 45 min | 🟡 Medium |
| 4D: System Infrastructure | 8 | 60 min | 🔴 High |
| 4E: Remaining Features | 9 | 95 min | 🟡 Medium |
| **Total** | **27** | **~3.5 hours** | |

---

## Execution Plan

### Session 1: Quick Wins (30 minutes)
1. ✅ Verify email management fix (5 min)
2. Run full suite to get exact failures (10 min)
3. Fix CSS detection issues (15 min)

**Expected Result**: 334-340/360 passing (93-94%)

---

### Session 2: Pattern-Based Fixes (1.5 hours)
1. Fix timing/loading issues (30 min)
2. Fix accessibility issues (45 min)
3. Fix navigation issues (30 min)

**Expected Result**: 350-355/360 passing (97-99%)

---

### Session 3: External Services & Edge Cases (1 hour)
1. Fix B2 storage issues (20 min)
2. Fix rich text editor issues (15 min)
3. Fix remaining edge cases (25 min)

**Expected Result**: 360/360 passing (100%)

---

## Success Criteria

### Quantitative
- ✅ 360/360 tests passing (100%)
- ✅ All test suites green
- ✅ No flaky tests
- ✅ Test execution time < 15 minutes

### Qualitative
- ✅ All core functionality tested
- ✅ Accessibility compliance verified
- ✅ No external service dependencies in E2E
- ✅ Clear test failure messages

---

## Risk Mitigation

### Risk 1: External Service Dependencies
**Mitigation**: Mock external services (B2, Resend) in E2E tests

### Risk 2: Flaky Tests
**Mitigation**: Add proper wait conditions and increase timeouts

### Risk 3: Next.js 16 Breaking Changes
**Mitigation**: Update test selectors and wait strategies

### Risk 4: Time Overrun
**Mitigation**: Focus on pattern-based fixes, not individual tests

---

## Next Steps

1. **Immediate**: Verify email management fix
2. **Short-term**: Run full suite and analyze failures
3. **Medium-term**: Apply pattern-based fixes
4. **Long-term**: Add test quality gates to prevent regressions

---

## Files to Read Next

1. `E2E_FEB16_2026_SESSION_SUMMARY.md` - Current status
2. `E2E_FEB16_2026_ALL_FIXES_VERIFIED_COMPLETE.md` - Recent fixes
3. Test output logs - Exact failure messages

---

## Key Insights

### What We Know ✅
- Core functionality is solid (92.5% passing)
- RSVP, Guest Groups, Content Management all working
- Recent fixes (CSS, race conditions, validation) are working

### What We Need to Fix ⚠️
- Accessibility attributes and keyboard navigation
- CSS detection for Next.js 16
- Timing issues in navigation and loading
- External service mocking

### What We Should Avoid ❌
- Fixing tests individually (use patterns)
- Increasing timeouts without understanding root cause
- Skipping tests instead of fixing them
- Adding unnecessary complexity

---

**Status**: Ready to execute  
**Confidence**: High (pattern-based approach)  
**Timeline**: 3-4 hours to 100%
