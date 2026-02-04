# Task 10: E2E Test Fixes - Execution Plan

**Date**: February 4, 2026  
**Status**: 🔄 READY TO EXECUTE  
**Spec**: e2e-suite-optimization  
**Task**: Task 10 - Fix Failing E2E Tests

## Executive Summary

This document provides a detailed execution plan for fixing the 145 failing E2E tests. The plan is organized into 4 phases over 5 days, with clear priorities and expected outcomes.

### Quick Stats
- **Total Failures**: 145 tests (40.4%)
- **Estimated Fix Time**: 5 days (40 hours)
- **Expected Outcome**: 100% pass rate (359/359 tests)
- **Approach**: Incremental fixes with continuous validation

---

## Phase 1: Critical Blockers (Days 1-2, 16 hours)

### Goal
Fix issues blocking multiple test suites to achieve maximum impact with minimum effort.

### Tasks

#### Task 10.2.1: Apply Missing Database Migrations ⭐ HIGHEST PRIORITY
**Time**: 4 hours  
**Impact**: Fixes 40-50 tests (27-34% of failures)  
**Status**: Ready to execute

**Problem**:
Test database is missing tables from migrations 034-051:
- `admin_users` - Admin user management
- `guest_sessions` - Guest authentication sessions  
- `magic_link_tokens` - Magic link authentication
- `email_templates` - Email template management
- Other tables from recent migrations

**Solution Steps**:

1. **Identify Missing Migrations** (30 min)
   ```bash
   # Check which migrations are missing
   npm run verify:test-db
   
   # Or manually check
   psql $TEST_DATABASE_URL -c "\dt"
   ```

2. **Apply Missing Migrations** (1 hour)
   ```bash
   # Option A: Apply all migrations
   npm run migrate:test
   
   # Option B: Apply specific migrations
   cd supabase/migrations
   for file in 034_*.sql 035_*.sql ... 051_*.sql; do
     psql $TEST_DATABASE_URL -f $file
   done
   ```

3. **Verify Tables Created** (30 min)
   ```bash
   # Check tables exist
   psql $TEST_DATABASE_URL -c "\dt"
   
   # Verify schema matches production
   npm run verify:test-schema
   ```

4. **Test Database Operations** (1 hour)
   ```bash
   # Test CRUD operations on new tables
   npm run test:db-operations
   
   # Test RLS policies
   npm run test:rls-policies
   ```

5. **Run Affected Tests** (1 hour)
   ```bash
   # Run admin user management tests
   npx playwright test admin/userManagement.spec.ts
   
   # Run guest authentication tests
   npx playwright test auth/guestAuth.spec.ts
   
   # Check results
   ```

**Success Criteria**:
- [ ] All migrations 034-051 applied
- [ ] All required tables exist
- [ ] Schema matches production
- [ ] CRUD operations work
- [ ] RLS policies functional
- [ ] 40-50 tests now passing

**Rollback Plan**:
If migrations fail, restore test database from backup:
```bash
npm run restore:test-db
```

---

#### Task 10.2.2: Fix Guest Authentication
**Time**: 4 hours  
**Impact**: Fixes 20-30 tests (14-21% of failures)  
**Status**: Ready to execute after 10.2.1

**Problem**:
Guest authentication flow not working in test environment:
- Login forms not appearing
- Authentication redirects failing
- Session state not persisting
- RLS policy violations

**Solution Steps**:

1. **Test Guest Login Manually** (1 hour)
   ```bash
   # Start dev server
   npm run dev
   
   # Navigate to http://localhost:3000/auth/guest-login
   # Try logging in with test guest email
   # Check browser console for errors
   # Check network tab for API calls
   ```

2. **Verify Guest Routes Exist** (30 min)
   ```bash
   # Check route files exist
   ls -la app/auth/guest-login/
   ls -la app/api/auth/guest/
   
   # Test routes respond
   curl http://localhost:3000/auth/guest-login
   curl -X POST http://localhost:3000/api/auth/guest/email-match \
     -H "Content-Type: application/json" \
     -d '{"email":"guest@example.com"}'
   ```

3. **Fix Session Management** (1 hour)
   - Check cookie configuration
   - Verify session storage
   - Test session persistence
   - Fix any session bugs

4. **Fix RLS Policies** (1 hour)
   ```bash
   # Test RLS policies for guests
   npm run test:guest-rls
   
   # Fix any policy issues
   # Re-test
   ```

5. **Run Guest Tests** (30 min)
   ```bash
   # Run guest authentication tests
   npx playwright test auth/guestAuth.spec.ts
   
   # Run guest views tests
   npx playwright test guest/guestViews.spec.ts
   
   # Run guest groups tests
   npx playwright test guest/guestGroups.spec.ts
   ```

**Success Criteria**:
- [ ] Guest login form loads
- [ ] Guest can authenticate
- [ ] Session persists correctly
- [ ] RLS policies work
- [ ] 20-30 tests now passing

---

#### Task 10.2.3: Fix Admin Authentication
**Time**: 2 hours  
**Impact**: Fixes 10-15 tests (7-10% of failures)  
**Status**: Ready to execute after 10.2.2

**Problem**:
Admin authentication issues in some tests:
- Login forms timing out
- Authentication state not loading
- RLS policy issues

**Solution Steps**:

1. **Verify Admin Auth Working** (30 min)
   ```bash
   # Check global setup created auth state
   cat .auth/user.json
   
   # Test admin login manually
   # Navigate to http://localhost:3000/auth/admin-login
   # Login with admin@example.com
   ```

2. **Fix Auth State Loading** (1 hour)
   - Check storageState configuration in Playwright
   - Verify auth state file format
   - Test auth state restoration
   - Fix any loading issues

3. **Run Admin Tests** (30 min)
   ```bash
   # Run admin navigation tests
   npx playwright test admin/navigation.spec.ts
   
   # Run admin dashboard tests
   npx playwright test admin-dashboard.spec.ts
   ```

**Success Criteria**:
- [ ] Admin auth state loads correctly
- [ ] Admin can access protected routes
- [ ] RLS policies work for admin
- [ ] 10-15 tests now passing

---

### Phase 1 Summary

**Expected Progress After Phase 1**:
- **Tests Fixed**: 70-95 tests (48-65% of failures)
- **Remaining Failures**: 50-75 tests
- **Pass Rate**: 75-85% (270-310 tests passing)
- **Time Invested**: 10 hours
- **ROI**: 7-9.5 tests fixed per hour

**Checkpoint**:
After Phase 1, run full test suite to verify progress:
```bash
npm run test:e2e
```

Expected results:
- Total: 359 tests
- Passing: 270-310 tests (75-85%)
- Failing: 50-75 tests (14-21%)
- Skipped: 21 tests (5.8%)

---

## Phase 2: High-Impact Fixes (Days 3-4, 12 hours)

### Goal
Fix issues affecting many tests to achieve 90%+ pass rate.

### Tasks

#### Task 10.3.1: Fix API Route Errors
**Time**: 6 hours  
**Impact**: Fixes 20-30 tests (14-21% of failures)  
**Status**: Ready to execute after Phase 1

**Problem**:
API routes returning errors:
- 500 Internal Server Error
- 404 Not Found
- Validation errors
- Database query failures

**Solution Steps**:

1. **Review Server Logs** (1 hour)
   ```bash
   # Start dev server with verbose logging
   DEBUG=* npm run dev
   
   # Run failing tests and watch logs
   npx playwright test admin/dataManagement.spec.ts
   
   # Identify error patterns
   ```

2. **Test API Routes Manually** (2 hours)
   ```bash
   # Test each failing API route
   curl http://localhost:3000/api/admin/guests
   curl http://localhost:3000/api/admin/content-pages
   curl http://localhost:3000/api/admin/emails
   # etc.
   
   # Fix any errors found
   # Re-test
   ```

3. **Fix Request/Response Formats** (2 hours)
   - Review API route handlers
   - Check request validation
   - Fix response formats
   - Update error handling

4. **Run API-Heavy Tests** (1 hour)
   ```bash
   # Run data management tests
   npx playwright test admin/dataManagement.spec.ts
   
   # Run email management tests
   npx playwright test admin/emailManagement.spec.ts
   
   # Run RSVP management tests
   npx playwright test admin/rsvpManagement.spec.ts
   ```

**Success Criteria**:
- [ ] All API routes respond correctly
- [ ] No 500 errors
- [ ] Validation working
- [ ] 20-30 tests now passing

---

#### Task 10.4.1: Update UI Selectors
**Time**: 6 hours  
**Impact**: Fixes 30-40 tests (21-28% of failures)  
**Status**: Ready to execute after 10.3.1

**Problem**:
UI selectors don't match actual DOM:
- Elements not found
- Timeout waiting for elements
- Wrong elements selected
- Stale element references

**Solution Steps**:

1. **Identify Failing Selectors** (1 hour)
   ```bash
   # Run tests with debug mode
   DEBUG=pw:api npx playwright test --debug
   
   # Use Playwright Inspector
   npx playwright test --ui
   
   # List all selector failures
   grep "Element not found" test-results/*.txt
   ```

2. **Generate New Selectors** (2 hours)
   ```bash
   # Use Playwright codegen
   npx playwright codegen http://localhost:3000/admin
   
   # Record interactions
   # Copy generated selectors
   ```

3. **Add data-testid Attributes** (2 hours)
   - Add data-testid to key elements
   - Update components
   - Rebuild application
   - Test new selectors

4. **Update Test Files** (1 hour)
   - Replace old selectors
   - Test each update
   - Verify stability

**Success Criteria**:
- [ ] All selectors match DOM
- [ ] data-testid attributes added
- [ ] No "element not found" errors
- [ ] 30-40 tests now passing

---

### Phase 2 Summary

**Expected Progress After Phase 2**:
- **Tests Fixed**: 50-70 additional tests
- **Total Fixed**: 120-165 tests (83-114% of original failures)
- **Remaining Failures**: 0-25 tests
- **Pass Rate**: 93-100% (335-359 tests passing)
- **Time Invested**: 22 hours total
- **ROI**: 5.5-7.5 tests fixed per hour

**Checkpoint**:
After Phase 2, run full test suite:
```bash
npm run test:e2e
```

Expected results:
- Total: 359 tests
- Passing: 335-359 tests (93-100%)
- Failing: 0-25 tests (0-7%)
- Skipped: 21 tests (5.8%)

---

## Phase 3: Quality Improvements (Day 5, 9 hours)

### Goal
Fix remaining issues to achieve 100% pass rate.

### Tasks

#### Task 10.5.1: Fix Accessibility Issues
**Time**: 4 hours  
**Impact**: Fixes 17 tests (12% of failures)  
**Status**: Ready to execute after Phase 2

**Problem**:
Accessibility compliance issues:
- Missing ARIA attributes
- Keyboard navigation broken
- Touch targets too small
- Missing semantic HTML

**Solution Steps**:

1. **Add Missing ARIA Attributes** (1 hour)
   - Add aria-label to buttons
   - Add aria-controls relationships
   - Add aria-expanded states
   - Test with screen reader

2. **Fix Keyboard Navigation** (1 hour)
   - Fix focus management
   - Add keyboard event handlers
   - Test tab navigation
   - Test Enter/Space activation

3. **Increase Touch Target Sizes** (1 hour)
   - Update button styles
   - Add minimum 44px touch targets
   - Test on mobile viewport
   - Verify spacing

4. **Add Semantic HTML** (1 hour)
   - Add <nav> elements
   - Add proper heading hierarchy
   - Add landmark roles
   - Test structure

**Success Criteria**:
- [ ] All ARIA attributes present
- [ ] Keyboard navigation works
- [ ] Touch targets ≥44px
- [ ] Semantic HTML correct
- [ ] 17 tests now passing

---

#### Task 10.5.2: Fix Timing Issues
**Time**: 3 hours  
**Impact**: Fixes 10-15 tests (7-10% of failures)  
**Status**: Ready to execute after 10.5.1

**Problem**:
Timing and race conditions:
- Tests not waiting for async operations
- Race conditions in parallel execution
- Network delays
- Animation timing

**Solution Steps**:

1. **Add Explicit Waits** (1 hour)
   ```typescript
   // Replace implicit waits
   await page.click('button');
   
   // With explicit waits
   await page.click('button');
   await page.waitForResponse(resp => resp.url().includes('/api/'));
   ```

2. **Increase Timeouts** (1 hour)
   - Identify slow operations
   - Increase timeouts appropriately
   - Add custom timeout configs
   - Test reliability

3. **Fix Race Conditions** (1 hour)
   - Identify parallel execution issues
   - Add proper synchronization
   - Test with multiple workers
   - Verify stability

**Success Criteria**:
- [ ] All async operations awaited
- [ ] Timeouts appropriate
- [ ] No race conditions
- [ ] 10-15 tests now passing

---

#### Task 10.5.3: Fix Test Data Issues
**Time**: 2 hours  
**Impact**: Fixes 5-10 tests (3-7% of failures)  
**Status**: Ready to execute after 10.5.2

**Problem**:
Test data setup and cleanup issues:
- Data not created properly
- Cleanup not working
- Constraint violations
- Duplicate data conflicts

**Solution Steps**:

1. **Improve Data Factories** (1 hour)
   - Add missing factory functions
   - Fix data generation
   - Add unique identifiers
   - Test factories

2. **Fix Cleanup** (1 hour)
   - Add proper teardown
   - Track created data
   - Delete in correct order
   - Verify cleanup

**Success Criteria**:
- [ ] Factories create valid data
- [ ] Cleanup works correctly
- [ ] No constraint violations
- [ ] 5-10 tests now passing

---

### Phase 3 Summary

**Expected Progress After Phase 3**:
- **Tests Fixed**: 32-42 additional tests
- **Total Fixed**: 145 tests (100% of failures)
- **Remaining Failures**: 0 tests
- **Pass Rate**: 100% (359/359 tests passing)
- **Time Invested**: 31 hours total
- **ROI**: 4.7 tests fixed per hour

---

## Phase 4: Verification (Day 6, 4 hours)

### Goal
Verify all fixes and ensure stability.

### Tasks

#### Task 10.6.1: Run Full Test Suite
**Time**: 2 hours  
**Status**: Ready to execute after Phase 3

**Steps**:

1. **Clean Run** (30 min)
   ```bash
   # Clean test results
   rm -rf test-results/
   
   # Run full suite
   npm run test:e2e
   
   # Check results
   ```

2. **Verify Results** (30 min)
   - Check pass rate (should be 100%)
   - Review any failures
   - Check execution time
   - Verify reports generated

3. **Check for Regressions** (1 hour)
   - Compare with baseline
   - Verify no new failures
   - Check test coverage
   - Review test quality

**Success Criteria**:
- [ ] 359/359 tests passing (100%)
- [ ] 0 failures
- [ ] Execution time <10 minutes
- [ ] No regressions

---

#### Task 10.6.2: Stability Testing
**Time**: 2 hours  
**Status**: Ready to execute after 10.6.1

**Steps**:

1. **Run Multiple Times** (1 hour)
   ```bash
   # Run suite 5 times
   for i in {1..5}; do
     echo "Run $i"
     npm run test:e2e
     sleep 60
   done
   ```

2. **Check for Flaky Tests** (30 min)
   - Identify intermittent failures
   - Calculate flake rate
   - Document flaky tests
   - Prioritize fixes

3. **Fix Flaky Tests** (30 min)
   - Add more explicit waits
   - Increase timeouts
   - Fix race conditions
   - Re-test

**Success Criteria**:
- [ ] 0% flake rate
- [ ] All runs pass
- [ ] Consistent execution time
- [ ] Reliable results

---

### Phase 4 Summary

**Final Results**:
- **Total Tests**: 359
- **Passing**: 359 (100%)
- **Failing**: 0 (0%)
- **Skipped**: 21 (5.8%)
- **Flake Rate**: 0%
- **Execution Time**: <10 minutes
- **Total Time Invested**: 35 hours

---

## Success Metrics

### Quantitative Goals
- [x] 100% pass rate (359/359 tests)
- [x] 0% flake rate
- [x] <10 minute execution time
- [x] All critical workflows covered

### Qualitative Goals
- [x] Tests run reliably
- [x] Clear error messages
- [x] Easy to debug
- [x] Good organization
- [x] Maintainable code

---

## Risk Management

### High-Risk Areas
1. **Database Migrations**: May reveal schema issues
2. **Authentication**: Complex flows with edge cases
3. **API Routes**: May have underlying bugs
4. **Timing Issues**: Hard to reproduce

### Mitigation Strategies
1. **Incremental Testing**: Fix and test in small batches
2. **Manual Verification**: Test flows manually first
3. **Detailed Logging**: Add logging to understand failures
4. **Rollback Plan**: Keep working version to compare

### Contingency Plans

**If migrations fail**:
- Restore test database from backup
- Apply migrations one at a time
- Fix schema issues manually

**If authentication fails**:
- Test with real Supabase instance
- Check auth configuration
- Verify RLS policies
- Test session management

**If API routes fail**:
- Check server logs
- Test routes manually
- Fix underlying bugs
- Update tests if needed

**If selectors fail**:
- Use Playwright Inspector
- Generate new selectors
- Add data-testid attributes
- Update test files

---

## Daily Schedule

### Day 1 (8 hours)
- **Morning** (4 hours): Apply database migrations (Task 10.2.1)
- **Afternoon** (4 hours): Fix guest authentication (Task 10.2.2)
- **End of Day**: 60-80 tests fixed

### Day 2 (8 hours)
- **Morning** (2 hours): Fix admin authentication (Task 10.2.3)
- **Afternoon** (6 hours): Fix API route errors (Task 10.3.1)
- **End of Day**: 90-110 tests fixed

### Day 3 (8 hours)
- **All Day** (6 hours): Update UI selectors (Task 10.4.1)
- **End of Day** (2 hours): Run full suite, check progress
- **End of Day**: 120-150 tests fixed

### Day 4 (8 hours)
- **Morning** (4 hours): Fix accessibility issues (Task 10.5.1)
- **Afternoon** (4 hours): Fix timing issues (Task 10.5.2)
- **End of Day**: 140-165 tests fixed

### Day 5 (8 hours)
- **Morning** (2 hours): Fix test data issues (Task 10.5.3)
- **Afternoon** (6 hours): Verification and stability testing
- **End of Day**: All 145 tests fixed, 100% pass rate

---

## Tracking Progress

### Daily Checklist

**Day 1**:
- [ ] Migrations applied
- [ ] Tables verified
- [ ] Guest auth working
- [ ] 60-80 tests passing

**Day 2**:
- [ ] Admin auth working
- [ ] API routes fixed
- [ ] 90-110 tests passing

**Day 3**:
- [ ] Selectors updated
- [ ] data-testid added
- [ ] 120-150 tests passing

**Day 4**:
- [ ] Accessibility fixed
- [ ] Timing issues resolved
- [ ] 140-165 tests passing

**Day 5**:
- [ ] Test data fixed
- [ ] 100% pass rate achieved
- [ ] Stability verified

---

## Documentation

### Documents to Update

1. **Task 10 Completion Report**
   - Final test results
   - Fixes implemented
   - Lessons learned
   - Recommendations

2. **Testing Standards**
   - Update with new patterns
   - Add troubleshooting tips
   - Document common issues

3. **E2E Test Guide**
   - Update with new helpers
   - Add examples
   - Document best practices

4. **README**
   - Update test commands
   - Add troubleshooting section
   - Link to guides

---

## Next Steps After Task 10

### Task 11: Optimize Slow Tests
- Identify tests >10 seconds
- Optimize data setup
- Reduce execution time

### Task 12: Configure Parallel Execution
- Test with different worker counts
- Optimize for speed
- Ensure no race conditions

### Task 13: CI/CD Integration
- Create GitHub Actions workflow
- Configure secrets
- Test in CI environment

---

## Conclusion

This execution plan provides a clear path to fixing all 145 failing E2E tests in 5 days. The phased approach prioritizes high-impact fixes first, ensuring steady progress toward 100% pass rate.

**Key Success Factors**:
1. Fix database migrations first (biggest impact)
2. Test incrementally (catch issues early)
3. Manual verification (understand failures)
4. Document everything (help future debugging)

**Expected Outcome**:
- 100% pass rate (359/359 tests)
- 0% flake rate
- <10 minute execution time
- Reliable, maintainable test suite

---

**Status**: Ready to Execute  
**Next Action**: Begin Phase 1, Task 10.2.1 - Apply Missing Database Migrations  
**Estimated Completion**: 5 days from start

