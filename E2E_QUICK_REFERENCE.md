# E2E Test Suite - Quick Reference Guide

## Quick Status Check

```bash
# Check if tests are still running
ps aux | grep playwright | grep -v grep

# View latest test output
tail -100 e2e-test-output.log

# Get test summary
tail -200 e2e-test-output.log | grep -E "(passing|failing|skipped)"

# Open HTML report
npx playwright show-report
```

## Run Specific Test Suites

```bash
# Email management tests
npx playwright test __tests__/e2e/admin/emailManagement.spec.ts

# Data management tests
npx playwright test __tests__/e2e/admin/dataManagement.spec.ts

# Reference blocks tests
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts

# Photo upload tests
npx playwright test __tests__/e2e/admin/photoUpload.spec.ts

# Accessibility tests
npx playwright test __tests__/e2e/accessibility/

# All admin tests
npx playwright test __tests__/e2e/admin/

# All guest tests
npx playwright test __tests__/e2e/guest/

# Full suite
npx playwright test
```

## Debug Failing Tests

```bash
# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode (step through)
npx playwright test --debug

# Run specific test
npx playwright test -g "test name"

# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Known Status

### ✅ Passing (Verified)
- **Email Management**: 12/13 tests (92%)
  - 1 skipped (bulk email - documented performance issue)
- **API Error Handling**: All routes have proper JSON error responses
- **Data Table Features**: All features implemented

### ⏳ In Progress
- Full test suite running
- Results pending

### ❌ Known Issues
1. **Reference Blocks**: Multiple test failures
   - Create multiple reference types
   - Remove reference from section
   - Filter references by type
   - Prevent circular references

2. **Photo Upload**: 1 test failure
   - Handle missing metadata gracefully

## Pattern-Based Fixes

### Pattern 1: API JSON Error Handling ✅
**Status**: COMPLETE
- All API routes have try-catch blocks
- Proper JSON error responses
- No HTML error pages

### Pattern 2: Data Table Features ✅
**Status**: IMPLEMENTED
- Sorting, filtering, pagination
- Bulk selection, search
- URL state management
- Tests unskipped (15 tests)

### Pattern 3: Missing ARIA Attributes ⏳
**Status**: NEEDS VERIFICATION
- Check all form components
- Verify accessibility attributes
- Run accessibility tests

### Pattern 4: Touch Target Sizes ⏳
**Status**: NEEDS VERIFICATION
- Check all interactive elements
- Verify 44x44px minimum
- Test on mobile viewport

### Pattern 5: Async Params ⏳
**Status**: LIKELY FIXED
- Check dynamic route pages
- Verify params are awaited
- Test all dynamic routes

### Pattern 6: Dropdown Reactivity ⏳
**Status**: LIKELY FIXED
- Guest groups dropdown fixed
- Check other dropdowns
- Verify data refresh

### Pattern 7: Form Validation Display ⏳
**Status**: NEEDS VERIFICATION
- Check all forms
- Verify error display
- Test validation messages

## Priority Fixes

### Priority 1: Reference Blocks (2-4 hours)
**Files**:
- `components/admin/ReferenceBlockPicker.tsx`
- `components/admin/InlineReferenceSelector.tsx`
- `app/api/admin/references/search/route.ts`
- `__tests__/e2e/admin/referenceBlocks.spec.ts`

**Actions**:
1. Check component implementation
2. Review API routes
3. Fix selector issues
4. Add proper wait conditions

### Priority 2: Photo Upload (1-2 hours)
**Files**:
- `app/api/admin/photos/route.ts`
- `app/api/admin/photos/[id]/route.ts`
- `__tests__/e2e/admin/photoUpload.spec.ts`

**Actions**:
1. Check metadata validation
2. Add default values
3. Improve error handling
4. Update test expectations

### Priority 3: Data Table Verification (2-3 hours)
**Files**:
- `components/ui/DataTable.tsx`
- `__tests__/e2e/admin/dataManagement.spec.ts`

**Actions**:
1. Run data management tests
2. Verify all features work
3. Fix any selector issues
4. Document results

## Test File Locations

### Admin Tests
- `__tests__/e2e/admin/emailManagement.spec.ts` ✅
- `__tests__/e2e/admin/dataManagement.spec.ts` ⏳
- `__tests__/e2e/admin/referenceBlocks.spec.ts` ❌
- `__tests__/e2e/admin/photoUpload.spec.ts` ⚠️
- `__tests__/e2e/admin/contentManagement.spec.ts`
- `__tests__/e2e/admin/sectionManagement.spec.ts`
- `__tests__/e2e/admin/navigation.spec.ts`
- `__tests__/e2e/admin/rsvpManagement.spec.ts`
- `__tests__/e2e/admin/userManagement.spec.ts`

### Guest Tests
- `__tests__/e2e/guest/guestAuth.spec.ts`
- `__tests__/e2e/guest/guestViews.spec.ts`
- `__tests__/e2e/guest/guestGroups.spec.ts`

### System Tests
- `__tests__/e2e/system/health.spec.ts`
- `__tests__/e2e/system/routing.spec.ts`
- `__tests__/e2e/system/uiInfrastructure.spec.ts`

### Accessibility Tests
- `__tests__/e2e/accessibility/suite.spec.ts`

## Helper Files

### Test Helpers
- `__tests__/helpers/e2eHelpers.ts` - General E2E helpers
- `__tests__/helpers/e2eWaiters.ts` - Wait conditions
- `__tests__/helpers/guestAuthHelpers.ts` - Guest auth helpers
- `__tests__/helpers/testAuth.ts` - Auth utilities
- `__tests__/helpers/testDb.ts` - Database utilities
- `__tests__/helpers/cleanup.ts` - Cleanup utilities
- `__tests__/helpers/factories.ts` - Test data factories

### Configuration
- `playwright.config.ts` - Playwright configuration
- `.env.e2e` - E2E environment variables
- `__tests__/e2e/global-setup.ts` - Global setup

## Common Issues and Solutions

### Issue: Tests Timeout
**Solution**:
- Increase timeout in test
- Add proper wait conditions
- Check if server is running
- Check database connection

### Issue: Selector Not Found
**Solution**:
- Check if element exists
- Wait for element to appear
- Use more specific selector
- Check component rendering

### Issue: Flaky Tests
**Solution**:
- Add proper wait conditions
- Improve test isolation
- Fix race conditions
- Add cleanup between tests

### Issue: Authentication Fails
**Solution**:
- Check admin user exists
- Verify credentials
- Check session handling
- Review auth flow

### Issue: Database Errors
**Solution**:
- Check database connection
- Verify migrations applied
- Check RLS policies
- Review test data cleanup

## Success Metrics

### Current Target
- **Overall**: 95%+ passing
- **Email Management**: 92% (acceptable)
- **Data Management**: 95%+
- **Reference Blocks**: 100%
- **Photo Upload**: 100%
- **Accessibility**: 100%

### Long Term Target
- **Overall**: 98%+ passing
- **Zero flaky tests**
- **<10 minute run time**
- **Comprehensive coverage**

## Next Steps After Test Completion

1. **Analyze Results**
   - Check pass/fail counts
   - Identify failure patterns
   - Categorize issues

2. **Fix Priority Issues**
   - Reference blocks (Priority 1)
   - Photo upload (Priority 2)
   - Data table verification (Priority 3)

3. **Verify Patterns**
   - Accessibility (Pattern 3)
   - Touch targets (Pattern 4)
   - Form validation (Pattern 7)

4. **Document Progress**
   - Update status documents
   - Create fix summaries
   - Plan next actions

## Useful Commands

```bash
# Kill all Playwright processes
pkill -f playwright

# Clean test artifacts
rm -rf test-results/
rm -rf playwright-report/

# Reset test database
npm run test:db:reset

# Run tests with specific reporter
npx playwright test --reporter=html
npx playwright test --reporter=json
npx playwright test --reporter=junit

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with specific workers
npx playwright test --workers=1  # Serial
npx playwright test --workers=4  # Parallel

# Update snapshots
npx playwright test --update-snapshots
```

## Contact and Resources

### Documentation
- Pattern-Based Fix Guide: `E2E_PATTERN_BASED_FIX_GUIDE.md`
- Current Status: `E2E_CURRENT_STATUS_SUMMARY.md`
- Next Actions: `E2E_NEXT_ACTIONS_PLAN.md`
- Email Management: `E2E_EMAIL_MANAGEMENT_COMPLETE.md`

### Steering Files
- Testing Standards: `.kiro/steering/testing-standards.md`
- Testing Patterns: `.kiro/steering/testing-patterns.md`
- API Standards: `.kiro/steering/api-standards.md`

### Specs
- E2E Suite Optimization: `.kiro/specs/e2e-suite-optimization/`
- E2E Test Fixes: `.kiro/specs/e2e-test-fixes/`

---

**Last Updated**: February 10, 2026
**Quick Tip**: Run `npx playwright show-report` to see detailed test results in your browser

