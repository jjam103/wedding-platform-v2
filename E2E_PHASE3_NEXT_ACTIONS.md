# E2E Phase 3 - Next Actions

## Current Status

**Test Run**: Incomplete (timed out)
**Confirmed Passing**: 30 tests (31%)
**Confirmed Failing**: 20 tests (21%)
**Not Run**: 47 tests (48%)

**Application Fixes Applied**: 3 (DataTable, Semantic HTML, ARIA attributes)
**Expected Impact**: 9 tests should now pass

## Immediate Next Steps

### 1. Re-run Tests with Increased Timeout ⚡ PRIORITY

```bash
# Run with 2-minute timeout per test
npm run test:e2e -- --timeout=120000

# Or run specific suites
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts --timeout=120000
npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts --timeout=120000
```

**Why**: Test suite timed out before completion. Need full results to assess impact of fixes.

### 2. Quick Test Code Fixes (6 tests) 🔧

#### Fix A: Update Authentication Routes (3 tests)
**Tests**: 24, 25, 28

```typescript
// In __tests__/e2e/accessibility/suite.spec.ts

// Line ~540: Test 24 - "should be responsive across admin pages"
- await page.goto('/auth/admin-login');
+ await page.goto('/auth/login');

// Line ~560: Test 25 - "should be responsive across guest pages"  
- await page.goto('/auth/guest-login');
+ await page.goto('/auth/login');
+ // Then authenticate as guest

// Line ~640: Test 28 - "should support 200% zoom"
- await page.goto('/auth/admin-login');
+ await page.goto('/auth/login');
```

#### Fix B: Add Guest Authentication (3 tests)
**Tests**: 7, 23

```typescript
// In __tests__/e2e/accessibility/suite.spec.ts

// Before Test 7 (line ~136) and Test 23 (line ~484)
// Add authentication helper:
async function authenticateAsGuest(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'guest@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/guest\//);
}

// Then call before accessing protected routes:
await authenticateAsGuest(page);
await page.goto('/guest/rsvp');
```

### 3. Verify DataTable Fixes (7 tests) 🔍

**Tests**: 34-40

The DataTable component was fixed, but tests may still be failing due to:
- Timing issues (debounce delays)
- Test expectations need adjustment
- Additional bugs in URL state management

**Action**: Run these tests individually to see detailed failure messages:

```bash
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should update URL with search parameter"
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should restore search state"
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "should update URL when filter"
```

### 4. Investigate Navigation Failures (10 tests) 🔎

**Tests**: 82-86, 89-92, 95

Multiple navigation tests are failing. Need to determine root cause:

**Possible Issues**:
- Sidebar navigation component not rendering correctly
- Mobile menu button missing or has wrong aria-label
- Keyboard navigation not working
- Browser back/forward navigation broken

**Action**: Run navigation tests individually and check browser console:

```bash
npm run test:e2e -- __tests__/e2e/admin/navigation.spec.ts --headed
```

### 5. Investigate Remaining Failures (3 tests) 🐛

#### Test 22: ARIA Expanded States
- **Status**: Fixed in code, but may still be failing
- **Action**: Verify CollapsibleForm unique ID generation is working

#### Test 26: Touch Targets
- **Issue**: Hamburger menu button not found or too small
- **Action**: Check admin layout mobile menu button

#### Test 27: Swipe Gestures
- **Issue**: Feature may not be implemented
- **Action**: Decide if this is a requirement or skip test

#### Test 42: Content Page Validation
- **Issue**: Form validation not working as expected
- **Action**: Check ContentPageForm validation logic

#### Test 67: CSV Validation
- **Issue**: CSV import/export validation failing
- **Action**: Test CSV functionality manually

#### Test 79: Email XSS Prevention
- **Issue**: Email sanitization test failing
- **Action**: Verify DOMPurify integration in email composer

## Execution Plan

### Phase 1: Get Complete Results (30 minutes)
1. Re-run full E2E suite with increased timeout
2. Analyze complete results
3. Categorize failures: test code vs application code

### Phase 2: Quick Wins (1 hour)
1. Fix authentication routes in tests (3 tests)
2. Add guest authentication to protected route tests (3 tests)
3. Re-run to verify fixes

### Phase 3: Verify Application Fixes (1 hour)
1. Run DataTable tests individually
2. Check browser console for errors
3. Adjust test expectations if needed
4. Verify CollapsibleForm ARIA fix

### Phase 4: Deep Investigation (2-3 hours)
1. Run navigation tests with --headed flag
2. Manually test navigation functionality
3. Fix any application bugs found
4. Update tests if expectations are wrong

### Phase 5: Final Cleanup (1 hour)
1. Investigate remaining 3 failures
2. Decide on swipe gesture requirement
3. Fix or skip tests as appropriate
4. Document any known issues

## Success Criteria

- [ ] Full E2E suite completes without timeout
- [ ] All 9 expected fixes are confirmed working
- [ ] Test code issues are resolved (6 tests)
- [ ] Navigation issues are identified and fixed
- [ ] Final pass rate > 90%

## Commands Reference

```bash
# Run full suite with timeout
npm run test:e2e -- --timeout=120000

# Run specific test file
npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts

# Run specific test by name
npm run test:e2e -- -g "should update URL with search parameter"

# Run with browser visible (for debugging)
npm run test:e2e -- --headed

# Run with debug mode
npm run test:e2e -- --debug

# Generate HTML report
npm run test:e2e -- --reporter=html
```

## Notes

- The 3 application fixes we made are solid and should work
- Most remaining failures appear to be test code issues or need investigation
- Navigation tests are the biggest unknown - need systematic debugging
- DataTable tests may just need timing adjustments
- Overall progress is good - we fixed real application bugs

## Estimated Time to Complete

- **Quick wins** (test code fixes): 1-2 hours
- **Verification** (DataTable, ARIA): 1-2 hours  
- **Investigation** (navigation, other): 2-4 hours
- **Total**: 4-8 hours to get to 90%+ pass rate

## Risk Assessment

**Low Risk**: Test code fixes (authentication routes)
**Medium Risk**: DataTable verification (may need timing adjustments)
**High Risk**: Navigation tests (unknown root cause, could be complex)

## Recommendation

Start with Phase 1 (re-run with timeout) to get complete picture, then tackle quick wins in Phase 2. This will give us momentum and reduce the failure count quickly before diving into the more complex navigation issues.
