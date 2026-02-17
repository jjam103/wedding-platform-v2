# E2E Phase 1 Action Plan: Critical Path Fixes

**Goal**: Fix critical path issues to get to 58% pass rate  
**Timeline**: Week 1  
**Current Pass Rate**: 47.0% (170/362 tests)  
**Target Pass Rate**: 58% (210/362 tests)  
**Expected Gain**: +40 tests passing

---

## Task 1: Fix Guest Authentication (Priority 1)

**Impact**: +8 tests passing  
**Estimated Time**: 4-6 hours

### Problem Analysis

**Failing Tests**:
1. `accessibility/suite.spec.ts` - Keyboard navigation on guest pages (timeout)
2. `accessibility/suite.spec.ts` - Responsive design on guest pages (ERR_ABORTED)
3. `auth/guestAuth.spec.ts` - Magic link request and verification (ERR_ABORTED)
4. `auth/guestAuth.spec.ts` - Success message after requesting magic link (timeout)
5. `auth/guestAuth.spec.ts` - Error for already used magic link (timeout)
6. `guest/guestViews.spec.ts` - Guest portal navigation (various)

**Common Error Patterns**:
```
TimeoutError: page.goto: Timeout 15000ms exceeded at /guest/dashboard
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/guest/events
Error: page.waitForURL: net::ERR_ABORTED; maybe frame was detached?
```

### Root Cause Hypothesis

1. **Guest session cookie not being set correctly**
   - Cookie domain/path mismatch
   - Cookie not being sent with requests
   - Session validation failing

2. **Guest dashboard route protection issues**
   - Middleware redirecting incorrectly
   - Session check failing
   - Infinite redirect loop

3. **Magic link flow issues**
   - Token generation/validation
   - Email sending in test environment
   - Token expiration handling

### Investigation Steps

1. **Check Guest Session Cookie**
   ```bash
   # Review guest session creation
   grep -r "guest_session" app/api/
   grep -r "guest_session" app/guest/
   ```

2. **Check Guest Route Middleware**
   ```bash
   # Review guest route protection
   find app/guest -name "*.tsx" -o -name "*.ts" | xargs grep -l "middleware\|auth"
   ```

3. **Check Magic Link Service**
   ```bash
   # Review magic link implementation
   grep -r "magicLink" services/
   grep -r "magic_link" app/api/
   ```

### Fix Strategy

#### Step 1: Review Guest Session Handling
- [ ] Check `app/api/auth/guest/email-match/route.ts`
- [ ] Verify session cookie is set with correct domain/path
- [ ] Test session validation in guest routes
- [ ] Add logging to track session flow

#### Step 2: Fix Guest Route Protection
- [ ] Review `app/guest/layout.tsx` or middleware
- [ ] Ensure proper redirect logic
- [ ] Add error handling for auth failures
- [ ] Test with E2E helper `authenticateAsGuest()`

#### Step 3: Fix Magic Link Flow
- [ ] Review `services/magicLinkService.ts`
- [ ] Check token generation and validation
- [ ] Verify email sending in test environment (should be mocked)
- [ ] Test token expiration handling

#### Step 4: Add Better Error Handling
- [ ] Add error boundaries for guest routes
- [ ] Add logging for auth failures
- [ ] Add user-friendly error messages
- [ ] Add fallback for session failures

### Testing

```bash
# Test guest authentication specifically
npx playwright test auth/guestAuth.spec.ts --headed

# Test guest views
npx playwright test guest/guestViews.spec.ts --headed

# Test accessibility with guest auth
npx playwright test accessibility/suite.spec.ts --grep "guest" --headed
```

### Success Criteria
- [ ] All 8 guest auth tests passing
- [ ] Guest dashboard loads without timeout
- [ ] Magic link flow completes successfully
- [ ] Guest portal navigation works
- [ ] No ERR_ABORTED errors on guest routes

---

## Task 2: Fix Admin Page Load Issues (Priority 2)

**Impact**: +17 tests passing  
**Estimated Time**: 6-8 hours

### Problem Analysis

**Failing Tests**:
1. `accessibility/suite.spec.ts` - Admin dashboard navigation (ERR_ABORTED)
2. `accessibility/suite.spec.ts` - Responsive design on admin pages (timeout)
3. `accessibility/suite.spec.ts` - Data table state restoration (ERR_ABORTED)
4. `admin/contentManagement.spec.ts` - Section editor operations (timeout)
5. `admin/emailManagement.spec.ts` - Email template management (timeout)
6. `admin/rsvpManagement.spec.ts` - RSVP management (timeout)

**Common Error Patterns**:
```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/admin/guests
TimeoutError: page.waitForLoadState: Timeout 30000ms exceeded
Error: expect(locator).toBeVisible() failed
```

### Root Cause Hypothesis

1. **Slow database queries**
   - Admin pages loading too much data
   - Missing indexes
   - N+1 query problems

2. **Blocking operations**
   - Synchronous operations blocking render
   - Large data processing on page load
   - Missing loading states

3. **Infinite loops or errors**
   - React component re-rendering infinitely
   - useEffect dependencies causing loops
   - Unhandled errors causing crashes

### Investigation Steps

1. **Profile Admin Page Load Times**
   ```bash
   # Add performance monitoring
   # Check browser console for errors
   # Review Network tab for slow requests
   ```

2. **Check Database Queries**
   ```bash
   # Review admin page data fetching
   grep -r "from\(" app/admin/
   grep -r "supabase" app/admin/
   ```

3. **Check for Blocking Operations**
   ```bash
   # Look for synchronous operations
   grep -r "await.*forEach" app/admin/
   grep -r "for.*await" app/admin/
   ```

### Fix Strategy

#### Step 1: Optimize Database Queries
- [ ] Review queries in `app/admin/guests/page.tsx`
- [ ] Add pagination to large datasets
- [ ] Add indexes for frequently queried fields
- [ ] Use `select()` to limit fields returned
- [ ] Implement query caching where appropriate

#### Step 2: Add Loading States
- [ ] Add skeleton screens for admin pages
- [ ] Add loading indicators for data fetching
- [ ] Implement progressive loading
- [ ] Add error boundaries

#### Step 3: Fix Blocking Operations
- [ ] Move heavy processing to server components
- [ ] Use React.lazy for code splitting
- [ ] Implement virtual scrolling for large lists
- [ ] Optimize React component rendering

#### Step 4: Add Performance Monitoring
- [ ] Add performance marks
- [ ] Log slow queries
- [ ] Track page load times
- [ ] Add error tracking

### Testing

```bash
# Test admin page load
npx playwright test admin/contentManagement.spec.ts --headed

# Test admin navigation
npx playwright test admin/navigation.spec.ts --headed

# Test data table functionality
npx playwright test accessibility/suite.spec.ts --grep "Data Table" --headed
```

### Success Criteria
- [ ] All 17 admin page load tests passing
- [ ] Admin pages load in <5 seconds
- [ ] No ERR_ABORTED errors
- [ ] No timeout errors
- [ ] Loading states visible during data fetch

---

## Task 3: Fix UI Infrastructure Issues (system/uiInfrastructure.spec.ts)

**Impact**: +15 tests passing  
**Estimated Time**: 4-6 hours

### Problem Analysis

**Failing Tests** (15 total in this file):
- Toast notification system
- Loading states and skeletons
- Error boundaries
- Form validation feedback
- Modal dialogs

**Common Error Patterns**:
```
Error: expect(locator).toBeVisible() failed
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded
```

### Root Cause Hypothesis

1. **Toast notifications not appearing**
   - Toast component not rendering
   - Toast context not available
   - Timing issues with toast display

2. **Loading states not showing**
   - Loading component not rendering
   - Suspense boundaries not working
   - Loading state not being set

3. **Error boundaries not catching errors**
   - Error boundary not implemented
   - Errors not being thrown correctly
   - Fallback UI not rendering

### Investigation Steps

1. **Check Toast Implementation**
   ```bash
   # Review toast component and context
   find components -name "*Toast*" -o -name "*toast*"
   grep -r "useToast" components/
   ```

2. **Check Loading States**
   ```bash
   # Review loading components
   find components -name "*Loading*" -o -name "*Skeleton*"
   grep -r "isLoading" components/
   ```

3. **Check Error Boundaries**
   ```bash
   # Review error boundary implementation
   find components -name "*Error*"
   grep -r "ErrorBoundary" components/
   ```

### Fix Strategy

#### Step 1: Fix Toast Notifications
- [ ] Review `components/ui/Toast.tsx`
- [ ] Check toast context provider
- [ ] Verify toast is added to layout
- [ ] Test toast display timing
- [ ] Add data-testid for reliable selection

#### Step 2: Fix Loading States
- [ ] Review loading components
- [ ] Check Suspense boundaries
- [ ] Verify loading state management
- [ ] Add skeleton screens where missing
- [ ] Test loading state transitions

#### Step 3: Fix Error Boundaries
- [ ] Review `components/ui/ErrorBoundary.tsx`
- [ ] Ensure error boundaries wrap components
- [ ] Test error throwing and catching
- [ ] Add fallback UI
- [ ] Add error logging

#### Step 4: Add Test Helpers
- [ ] Create helper for waiting for toast
- [ ] Create helper for waiting for loading
- [ ] Create helper for triggering errors
- [ ] Add to `__tests__/helpers/e2eHelpers.ts`

### Testing

```bash
# Test UI infrastructure
npx playwright test system/uiInfrastructure.spec.ts --headed

# Test specific components
npx playwright test system/uiInfrastructure.spec.ts --grep "Toast" --headed
npx playwright test system/uiInfrastructure.spec.ts --grep "Loading" --headed
npx playwright test system/uiInfrastructure.spec.ts --grep "Error" --headed
```

### Success Criteria
- [ ] All 15 UI infrastructure tests passing
- [ ] Toast notifications appear reliably
- [ ] Loading states show during data fetch
- [ ] Error boundaries catch and display errors
- [ ] Form validation feedback works
- [ ] Modal dialogs open and close correctly

---

## Phase 1 Execution Plan

### Day 1-2: Guest Authentication
- Morning: Investigation and root cause analysis
- Afternoon: Implement fixes
- Evening: Test and verify

### Day 3-4: Admin Page Load Issues
- Morning: Profile and identify slow queries
- Afternoon: Optimize queries and add loading states
- Evening: Test and verify

### Day 5: UI Infrastructure
- Morning: Fix toast and loading states
- Afternoon: Fix error boundaries
- Evening: Test and verify

### Day 6: Integration Testing
- Morning: Run full E2E suite
- Afternoon: Fix any regressions
- Evening: Document results

### Day 7: Buffer/Documentation
- Review all fixes
- Update documentation
- Prepare for Phase 2

---

## Monitoring and Validation

### Daily Checks
```bash
# Run affected tests
npm run test:e2e -- --grep "guest|admin|infrastructure"

# Check pass rate
node scripts/analyze-e2e-failures.mjs
```

### Success Metrics
- [ ] Pass rate increases from 47% to 58%
- [ ] +40 tests passing
- [ ] No new failures introduced
- [ ] Flaky test rate stays same or decreases

### Rollback Plan
If fixes cause regressions:
1. Revert specific commits
2. Re-run tests to verify
3. Document issues
4. Create new fix plan

---

## Resources

- **E2E Test Helpers**: `__tests__/helpers/e2eHelpers.ts`
- **Global Setup**: `__tests__/e2e/global-setup.ts`
- **Test Results**: `test-results/e2e-results.json`
- **Analysis Script**: `scripts/analyze-e2e-failures.mjs`

---

## Next Steps After Phase 1

Once Phase 1 is complete (58% pass rate):
1. Review results and document learnings
2. Update Phase 2 plan based on findings
3. Begin Phase 2: Major Features (Content Management, Guest Groups, Guest Views)
4. Target: 68% pass rate by end of Week 2

---

## Notes

- Focus on one task at a time
- Test frequently during development
- Document all findings
- Keep fixes minimal and focused
- Don't introduce new features, just fix existing issues
- Prioritize stability over perfection
