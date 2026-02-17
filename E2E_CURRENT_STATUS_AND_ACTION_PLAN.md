# E2E Test Suite - Current Status & Action Plan

**Date**: February 11, 2026  
**Status**: Step 1.1 Complete - Initial Test Run Analysis  
**Next**: Step 1.2 - Fix Critical Blockers

## Executive Summary

Ran initial batch of system tests (health, routing, uiInfrastructure) to identify failure patterns. Found 11 failures across 3 main categories:

1. **Database Setup Issues** (4 tests) - Test data not being created properly
2. **CSS Detection Issues** (3 tests) - Tailwind classes not being found
3. **Page Navigation Issues** (4 tests) - Wrong page being loaded or server connection issues

## Test Run Results

### Command Executed
```bash
npx playwright test __tests__/e2e/system/health.spec.ts \
  __tests__/e2e/system/routing.spec.ts \
  __tests__/e2e/system/uiInfrastructure.spec.ts \
  --reporter=list --max-failures=10
```

### Results Summary
- **Total Tests**: 52 tests attempted
- **Passed**: 37 (71%)
- **Failed**: 11 (21%)
- **Skipped**: 1 (2%)
- **Did Not Run**: 34 (stopped at max failures)
- **Execution Time**: 1.2 minutes

## Failure Analysis

### Pattern A: Database Setup Failures (4 tests)

**Files**: `__tests__/e2e/system/routing.spec.ts`

**Error**:
```
TypeError: Cannot read properties of null (reading 'id')
  49 |     testEventId = event.id;
```

**Root Cause**: The `.insert().select().single()` chain is returning `null` instead of the created record.

**Affected Tests**:
1. System Routing › Event Routing › should load event page by slug
2. System Routing › Activity Routing › should redirect activity UUID to slug
3. System Routing › Content Page Routing › should show 404 for draft content page without preview mode
4. System Routing › Dynamic Route Handling › should handle browser back/forward with dynamic routes

**Fix Strategy**:
1. Check if insert is actually succeeding (check `error` from Supabase)
2. Add error handling for failed inserts
3. Verify RLS policies allow test data creation
4. Consider using `.maybeSingle()` instead of `.single()`

**Priority**: 🔴 **CRITICAL** - Blocks 4+ tests

### Pattern B: CSS Class Detection Failures (3 tests)

**Files**: `__tests__/e2e/system/uiInfrastructure.spec.ts`

**Error**:
```
Error: expect(received).toBeGreaterThan(expected)
Expected: > 0
Received:   0

const whiteElements = await page.locator('.bg-white').count();
expect(whiteElements).toBeGreaterThan(0);
```

**Root Cause**: Tests are looking for specific Tailwind classes (`.bg-white`, `[class*="border"]`, `[class*="shadow"]`) but finding 0 elements.

**Possible Causes**:
1. Page not fully loaded when test runs
2. CSS not applied yet (hydration issue)
3. Admin page doesn't actually use these specific classes
4. Test is on wrong page

**Affected Tests**:
1. CSS Delivery & Loading › should apply Tailwind utility classes correctly
2. CSS Delivery & Loading › should apply borders, shadows, and responsive classes
3. CSS Delivery & Loading › should render consistently across viewport sizes

**Fix Strategy**:
1. Add wait for page to be fully loaded and hydrated
2. Verify which page the test is actually on
3. Update test to look for classes that actually exist on the page
4. Consider using computed styles instead of class names

**Priority**: 🟡 **MEDIUM** - Tests may need updating to match actual implementation

### Pattern C: Page Navigation Failures (4 tests)

**Files**: `__tests__/e2e/system/uiInfrastructure.spec.ts`

**Error 1** (First attempt):
```
Error: expect(locator).toContainText(expected) failed
Locator: locator('h1')
Expected substring: "Wedding Admin"
Received string:    "🌴 Welcome Back"
```

**Error 2** (Retry attempt):
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/admin
```

**Root Cause**: 
1. Test expects "Wedding Admin" but page shows "🌴 Welcome Back" (different page or changed UI)
2. On retry, server connection is refused (server may have crashed or stopped)

**Affected Tests**:
1. Form Submissions & Validation › should submit valid guest form successfully
2. Form Submissions & Validation › should show validation errors for missing required fields
3. Form Submissions & Validation › should validate email format
4. Form Submissions & Validation › should show loading state during submission

**Fix Strategy**:
1. Update test expectations to match actual page content ("🌴 Welcome Back")
2. Investigate why server connection is refused on retries
3. Ensure dev server stays running during test execution
4. Add better error handling for navigation failures

**Priority**: 🟡 **MEDIUM** - Tests need updating to match current UI

## Immediate Action Plan

### Step 1: Fix Database Setup (Pattern A) - 30 minutes

**Goal**: Get test data creation working properly

**Actions**:
1. Read the full `beforeAll` hook in `routing.spec.ts`
2. Add error checking after each insert
3. Verify RLS policies allow test data creation
4. Update to use `.maybeSingle()` and check for null
5. Add better error messages

**Expected Impact**: Fixes 4 tests

### Step 2: Fix CSS Detection Tests (Pattern B) - 20 minutes

**Goal**: Update tests to match actual page implementation

**Actions**:
1. Navigate to `/admin` in browser and inspect actual classes used
2. Update test selectors to match real classes
3. Add proper wait for hydration
4. Consider using computed styles instead of class names

**Expected Impact**: Fixes 3 tests

### Step 3: Fix Page Navigation Tests (Pattern C) - 20 minutes

**Goal**: Update test expectations to match current UI

**Actions**:
1. Update expected text from "Wedding Admin" to "🌴 Welcome Back"
2. Investigate server connection issues on retries
3. Add better navigation error handling

**Expected Impact**: Fixes 4 tests

### Step 4: Run Full System Tests - 10 minutes

**Goal**: Verify all system tests pass

**Actions**:
1. Run all 3 system test files again
2. Verify 100% pass rate
3. Document any remaining issues

**Expected Impact**: Baseline established for system tests

## Next Steps After System Tests

### Phase 1: Admin Tests
```bash
npx playwright test __tests__/e2e/admin/ --reporter=list --max-failures=20
```

Expected patterns:
- Form submission issues
- Data table issues
- API error handling issues

### Phase 2: Guest Tests
```bash
npx playwright test __tests__/e2e/guest/ --reporter=list --max-failures=20
```

Expected patterns:
- Authentication issues
- Guest view issues

### Phase 3: Auth Tests
```bash
npx playwright test __tests__/e2e/auth/ --reporter=list --max-failures=20
```

Expected patterns:
- Magic link issues
- Email matching issues

### Phase 4: Accessibility Tests
```bash
npx playwright test __tests__/e2e/accessibility/ --reporter=list --max-failures=20
```

Expected patterns:
- ARIA attribute issues
- Touch target size issues

## Success Metrics

### Current Status
- ✅ Tests running successfully
- ✅ Failure patterns identified
- ⏳ Fixes in progress

### Target for System Tests
- 🎯 100% pass rate (all 52 tests)
- 🎯 Execution time <2 minutes
- 🎯 No flaky tests

### Target for Full Suite
- 🎯 95%+ pass rate (345+/362 tests)
- 🎯 Execution time <30 minutes
- 🎯 <2% flaky tests

## Timeline

- **Now**: Step 1 - Fix database setup (30 min)
- **+30 min**: Step 2 - Fix CSS detection (20 min)
- **+50 min**: Step 3 - Fix page navigation (20 min)
- **+70 min**: Step 4 - Verify system tests (10 min)
- **+80 min**: Move to admin tests

**Total for System Tests**: ~80 minutes

## Key Learnings

1. **Database setup is critical** - Many tests depend on test data being created properly
2. **CSS class detection is fragile** - Better to test computed styles or visual regression
3. **Page content changes** - Tests need to be updated when UI changes
4. **Server stability matters** - Connection refused errors indicate server issues

## Files to Modify

### Priority 1 (Critical)
- `__tests__/e2e/system/routing.spec.ts` - Fix database setup

### Priority 2 (Medium)
- `__tests__/e2e/system/uiInfrastructure.spec.ts` - Fix CSS detection and page navigation tests

## Conclusion

We have a clear picture of the failure patterns in the system tests. The main issues are:
1. Database setup not working properly (critical)
2. CSS detection tests need updating (medium)
3. Page navigation tests need updating (medium)

With focused fixes on these 3 patterns, we can get all system tests passing in ~80 minutes, then move on to the larger test suites.

**Status**: ✅ **STEP 1.1 COMPLETE** - Ready for Step 1.2 (Fix Database Setup)

---

## Quick Commands

### Run System Tests Only
```bash
npx playwright test __tests__/e2e/system/ --reporter=list
```

### Debug Specific Test
```bash
npx playwright test --headed --debug --grep "should load event page by slug"
```

### Check Test Data Creation
```bash
# Run this to verify database connection and RLS policies
node scripts/test-e2e-database-connection.mjs
```

**Let's fix Pattern A (database setup) first! 🚀**
