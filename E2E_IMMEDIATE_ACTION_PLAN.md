# E2E Immediate Action Plan

## Test Results Summary

**Overall**: 195/360 passing (54.2%)
- ✅ 195 passed
- ❌ 121 failed
- ⚠️ 23 flaky
- ⏭️ 3 skipped
- ⏸️ 21 did not run

## Top 3 Priorities (Next 4-7 Hours)

### Priority 1: Section Management Tests (2-3 hours) 🔴

**Problem**: 4+ tests failing due to "Manage Sections" button not visible

**Failing Tests**:
- "should create new section"
- "should edit existing section"
- "should delete section with confirmation"
- "should save all sections and show preview"

**Root Cause**: Button selector or visibility issue

**Fix Steps**:
1. Check if "Manage Sections" button exists on content pages
2. Verify the button is rendered in the UI
3. Update selector if needed
4. Add proper wait conditions

**Commands**:
```bash
# Run section management tests
npx playwright test __tests__/e2e/admin/sectionManagement.spec.ts --headed

# Debug specific test
npx playwright test --debug -g "should create new section"
```

**Files to Check**:
- `app/admin/content-pages/page.tsx` - Check if button exists
- `__tests__/e2e/admin/sectionManagement.spec.ts` - Check selector
- `components/admin/SectionEditor.tsx` - Check button rendering

**Expected Outcome**: 4 tests passing (1.1% improvement)

---

### Priority 2: Guest Authentication Tests (1-2 hours) 🔴

**Problem**: 2+ tests failing due to navigation timeout and selector issues

**Failing Tests**:
- "should successfully authenticate with email matching"
- "should show error for non-existent email"

**Root Cause**: 
- Navigation timeout (15s not enough)
- Error message selector incorrect

**Fix Steps**:
1. Increase navigation timeout to 30s
2. Fix error message selector (`.text-red-800`)
3. Add proper wait conditions for page load
4. Verify authentication flow works

**Commands**:
```bash
# Run guest auth tests
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --headed

# Debug specific test
npx playwright test --debug -g "should successfully authenticate"
```

**Files to Check**:
- `__tests__/e2e/auth/guestAuth.spec.ts` - Update timeout and selectors
- `app/auth/guest-login/page.tsx` - Verify error message classes
- `app/api/auth/guest/email-match/route.ts` - Check response format

**Expected Outcome**: 2 tests passing (0.6% improvement)

---

### Priority 3: Admin Pages Styling Tests (1-2 hours) 🟡

**Problem**: 2+ tests failing due to CSS loading checks

**Failing Tests**:
- "should have styled dashboard, guests, and events pages"
- "should have styled activities and vendors pages"

**Root Cause**: CSS loading timing issues

**Fix Steps**:
1. Wait for CSS to fully load before checking
2. Check for specific styled elements instead of colors
3. Add proper wait conditions
4. Verify Tailwind CSS is applied

**Commands**:
```bash
# Run styling tests
npx playwright test __tests__/e2e/system/uiInfrastructure.spec.ts -g "Admin Pages Styling" --headed

# Debug specific test
npx playwright test --debug -g "should have styled dashboard"
```

**Files to Check**:
- `__tests__/e2e/system/uiInfrastructure.spec.ts` - Update CSS checks
- `app/globals.css` - Verify CSS is loaded
- `tailwind.config.ts` - Check configuration

**Expected Outcome**: 2 tests passing (0.6% improvement)

---

## Quick Wins Summary

**Total Time**: 4-7 hours
**Total Tests Fixed**: 8 tests
**Improvement**: 2.3% (from 54.2% to 56.5%)

## Execution Plan

### Step 1: Section Management (Now)
1. Open `app/admin/content-pages/page.tsx`
2. Search for "Manage Sections" button
3. Check if button is rendered
4. Run test in headed mode to see what's happening
5. Fix selector or add button if missing
6. Verify tests pass

### Step 2: Guest Authentication (After Step 1)
1. Open `__tests__/e2e/auth/guestAuth.spec.ts`
2. Increase timeout from 15s to 30s
3. Fix error message selector
4. Run test in headed mode
5. Verify authentication flow
6. Verify tests pass

### Step 3: Admin Pages Styling (After Step 2)
1. Open `__tests__/e2e/system/uiInfrastructure.spec.ts`
2. Update CSS loading checks
3. Wait for specific elements instead of colors
4. Run test in headed mode
5. Verify CSS is applied
6. Verify tests pass

## Success Criteria

### After Priority 1 (Section Management)
- ✅ 4 section management tests passing
- ✅ "Manage Sections" button visible
- ✅ Section CRUD operations work

### After Priority 2 (Guest Authentication)
- ✅ 2 guest auth tests passing
- ✅ Email matching authentication works
- ✅ Error messages display correctly

### After Priority 3 (Admin Pages Styling)
- ✅ 2 styling tests passing
- ✅ CSS loads correctly
- ✅ Admin pages are styled

### Overall After Quick Wins
- ✅ 203/360 tests passing (56.5%)
- ✅ 8 critical tests fixed
- ✅ Clear path to 80%+ passing

## Next Steps After Quick Wins

### Priority 4: Reference Blocks (2-4 hours)
- Multiple tests failing
- Component interaction issues
- High impact on overall pass rate

### Priority 5: Photo Upload (1-2 hours)
- 1 test failing
- Metadata handling issue
- Low impact but easy fix

### Priority 6: Flaky Tests (4-6 hours)
- 23 flaky tests
- Stability issues
- Medium impact on reliability

## Commands Reference

### Run All Tests
```bash
npx playwright test
```

### Run Specific Suite
```bash
npx playwright test __tests__/e2e/admin/sectionManagement.spec.ts
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

### Run in Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test
```bash
npx playwright test -g "test name"
```

### View Report
```bash
npx playwright show-report
```

## Monitoring Progress

### After Each Fix
1. Run the specific test suite
2. Verify tests pass
3. Update this document
4. Commit changes

### After All Quick Wins
1. Run full test suite
2. Verify overall pass rate improved
3. Create summary document
4. Plan next priorities

## Conclusion

Focus on these 3 priorities to fix 8 critical tests in 4-7 hours. This will improve the pass rate from 54.2% to 56.5% and establish momentum for reaching 80%+ passing this week.

**Start with Section Management** - it has the highest impact and clearest root cause.

---

**Last Updated**: February 10, 2026, 9:05 PM
**Next Action**: Fix Section Management tests (Priority 1)
**Estimated Time**: 2-3 hours

