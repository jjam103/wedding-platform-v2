# Pre-Manual Testing Validation Plan

**Date**: February 2, 2026
**Purpose**: Automated validation to ensure system readiness before manual testing
**Goal**: Catch and fix technical issues so manual testing focuses on usability and UX

---

## Overview

This plan runs comprehensive automated tests to validate:
1. TypeScript compilation
2. Build process
3. Unit tests
4. Integration tests (API routes, database)
5. E2E tests (critical workflows)
6. Accessibility tests
7. Security validation

**Estimated Time**: 30-45 minutes for full validation

---

## Phase 1: Environment Setup (5 minutes)

### 1.1 Verify Environment Variables

**Action**: Check all required environment variables are set

```bash
# Check .env.local exists and has required keys
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY"
```

**Expected**: All three keys present and non-empty

**If Missing**: Copy from `.env.local.example` and configure

### 1.2 Verify Test Database

**Action**: Check test database configuration

```bash
# Check .env.test exists
cat .env.test | grep -E "SUPABASE_TEST_URL|SUPABASE_TEST_ANON_KEY|SUPABASE_TEST_SERVICE_ROLE_KEY"
```

**Expected**: Test database keys present

**Database Restart**: ⚠️ **YES - RECOMMENDED**

Run the test database setup script to ensure clean state:

```bash
node scripts/setup-test-database.mjs
```

This will:
- Reset test database
- Run all migrations
- Seed test data
- Verify RLS policies

### 1.3 Install Dependencies

**Action**: Ensure all dependencies are installed

```bash
npm install
```

**Expected**: No errors, all packages installed

---

## Phase 2: TypeScript Validation (2 minutes)

### 2.1 Type Check

**Action**: Run TypeScript compiler

```bash
npm run type-check
```

**Expected**: Zero TypeScript errors

**If Errors Found**:
- Review error messages
- Fix type issues
- Re-run type check

### 2.2 Lint Check

**Action**: Run ESLint

```bash
npm run lint
```

**Expected**: Zero linting errors

**If Errors Found**:
- Run `npm run lint -- --fix` to auto-fix
- Manually fix remaining issues

---

## Phase 3: Build Validation (5 minutes)

### 3.1 Production Build

**Action**: Build for production

```bash
npm run build
```

**Expected**:
- ✓ Compiled successfully
- ✓ All routes generated (110+)
- ✓ Zero build errors
- ✓ Zero warnings

**If Build Fails**:
- Review error messages
- Check for missing imports
- Check for Next.js compatibility issues
- Fix and rebuild

### 3.2 Build Output Verification

**Action**: Verify build artifacts

```bash
ls -la .next/
```

**Expected**:
- `.next/` directory exists
- Contains `server/`, `static/`, `cache/` directories
- Build info file present

---

## Phase 4: Unit Tests (10 minutes)

### 4.1 Service Tests

**Action**: Run all service tests

```bash
npm run test -- services/
```

**Expected**:
- All service tests pass
- Coverage > 90% for services
- Zero test failures

**Critical Services to Verify**:
- guestService
- rsvpService
- eventService
- activityService
- photoService
- emailService
- contentPagesService
- sectionsService

### 4.2 Component Tests

**Action**: Run component tests

```bash
npm run test -- components/
```

**Expected**:
- All component tests pass
- Coverage > 70% for components
- Zero test failures

### 4.3 Utility Tests

**Action**: Run utility tests

```bash
npm run test -- utils/
```

**Expected**:
- All utility tests pass
- Coverage > 95% for utilities
- Zero test failures

---

## Phase 5: Integration Tests (10 minutes)

### 5.1 API Route Tests

**Action**: Run API integration tests

```bash
npm run test -- __tests__/integration/
```

**Expected**:
- All API route tests pass
- Authentication tests pass
- RLS policy tests pass
- Database operation tests pass

**Critical API Routes to Verify**:
- `/api/admin/guests`
- `/api/admin/events`
- `/api/admin/activities`
- `/api/admin/rsvps`
- `/api/guest/events`
- `/api/guest/activities`
- `/api/guest/rsvps`
- `/api/auth/guest/email-match`
- `/api/auth/guest/magic-link`

### 5.2 Database Tests

**Action**: Run database integration tests

```bash
npm run test -- __tests__/integration/databaseIsolation.integration.test.ts
npm run test -- __tests__/integration/rlsPolicies.integration.test.ts
```

**Expected**:
- Database isolation working
- RLS policies enforced
- No data leakage between tests

---

## Phase 6: E2E Tests (15 minutes)

### 6.1 Authentication Flows

**Action**: Run authentication E2E tests

```bash
npm run test:e2e -- __tests__/e2e/guestAuthenticationFlow.spec.ts
npm run test:e2e -- __tests__/e2e/guestEmailMatchingAuth.spec.ts
npm run test:e2e -- __tests__/e2e/guestMagicLinkAuth.spec.ts
```

**Expected**:
- Email matching authentication works
- Magic link authentication works
- Session management works

### 6.2 Admin Workflows

**Action**: Run admin E2E tests

```bash
npm run test:e2e -- __tests__/e2e/adminNavigationFlow.spec.ts
npm run test:e2e -- __tests__/e2e/adminUserManagementFlow.spec.ts
```

**Expected**:
- Admin navigation works
- Admin user management works
- Forms submit correctly

### 6.3 Guest Workflows

**Action**: Run guest E2E tests

```bash
npm run test:e2e -- __tests__/e2e/guestRsvpFlow.spec.ts
npm run test:e2e -- __tests__/e2e/guestViewNavigation.spec.ts
```

**Expected**:
- Guest RSVP submission works
- Guest navigation works
- Itinerary displays correctly

### 6.4 Form Submissions

**Action**: Run form submission tests

```bash
npm run test:e2e -- __tests__/e2e/formSubmissions.spec.ts
```

**Expected**:
- All forms submit correctly
- Validation works
- Error messages display
- Success messages display

### 6.5 Critical Workflows

**Action**: Run critical workflow tests

```bash
npm run test:e2e -- __tests__/e2e/contentPageFlow.spec.ts
npm run test:e2e -- __tests__/e2e/referenceBlockFlow.spec.ts
npm run test:e2e -- __tests__/e2e/emailCompositionFlow.spec.ts
```

**Expected**:
- Content page creation works
- Reference blocks work
- Email composition works

---

## Phase 7: Regression Tests (5 minutes)

### 7.1 Known Bug Prevention

**Action**: Run regression tests

```bash
npm run test -- __tests__/regression/
```

**Expected**:
- All regression tests pass
- No previously fixed bugs reappear

**Critical Regression Tests**:
- Guest authentication
- RSVP system
- Reference blocks
- Cascade deletion
- Slug management
- Guest groups RLS
- Content pages RLS

---

## Phase 8: Accessibility Tests (3 minutes)

### 8.1 Automated Accessibility

**Action**: Run accessibility tests

```bash
npm run test -- __tests__/accessibility/
```

**Expected**:
- All accessibility tests pass (28/28)
- WCAG 2.1 Level AA compliance
- Zero accessibility violations

---

## Phase 9: Smoke Tests (2 minutes)

### 9.1 API Health Check

**Action**: Run smoke tests

```bash
npm run test -- __tests__/smoke/
```

**Expected**:
- All API routes respond
- No 500 errors
- Authentication works

---

## Phase 10: Runtime Validation (5 minutes)

### 10.1 Dev Server Check

**Action**: Verify dev server is running

```bash
# Dev server should already be running at http://localhost:3000
curl http://localhost:3000/api/health || echo "Health check endpoint needed"
```

**Expected**:
- Server responds
- No console errors
- No runtime errors

### 10.2 Page Load Check

**Action**: Verify critical pages load

**Pages to Check**:
- http://localhost:3000/ (home)
- http://localhost:3000/admin (admin dashboard)
- http://localhost:3000/auth/guest-login (guest login)

**Expected**:
- Pages load without errors
- No console errors
- CSS loads correctly
- JavaScript loads correctly

### 10.3 Console Error Check

**Action**: Check browser console for errors

**Expected**:
- Zero console errors
- Zero console warnings (except deprecation warnings)
- No network errors

---

## Validation Summary Checklist

After running all phases, verify:

- [ ] TypeScript: Zero errors
- [ ] Lint: Zero errors
- [ ] Build: Successful
- [ ] Unit Tests: All passing (600+ tests)
- [ ] Integration Tests: All passing (200+ tests)
- [ ] E2E Tests: All passing (50+ tests)
- [ ] Regression Tests: All passing (200+ tests)
- [ ] Accessibility Tests: All passing (28 tests)
- [ ] Smoke Tests: All passing
- [ ] Dev Server: Running without errors
- [ ] Critical Pages: Loading correctly

---

## Quick Validation Script

For convenience, run all validations in sequence:

```bash
#!/bin/bash

echo "=== Pre-Manual Testing Validation ==="
echo ""

echo "Phase 1: Environment Setup"
node scripts/setup-test-database.mjs
echo "✓ Test database reset"
echo ""

echo "Phase 2: TypeScript Validation"
npm run type-check
echo "✓ TypeScript check complete"
echo ""

echo "Phase 3: Build Validation"
npm run build
echo "✓ Build complete"
echo ""

echo "Phase 4: Unit Tests"
npm run test -- --testPathPattern="(services|components|utils)/" --passWithNoTests
echo "✓ Unit tests complete"
echo ""

echo "Phase 5: Integration Tests"
npm run test -- --testPathPattern="__tests__/integration/" --passWithNoTests
echo "✓ Integration tests complete"
echo ""

echo "Phase 6: E2E Tests"
npm run test:e2e
echo "✓ E2E tests complete"
echo ""

echo "Phase 7: Regression Tests"
npm run test -- --testPathPattern="__tests__/regression/" --passWithNoTests
echo "✓ Regression tests complete"
echo ""

echo "Phase 8: Accessibility Tests"
npm run test -- --testPathPattern="__tests__/accessibility/" --passWithNoTests
echo "✓ Accessibility tests complete"
echo ""

echo "=== Validation Complete ==="
echo ""
echo "Review results above. If all passed, system is ready for manual testing."
```

Save as `scripts/pre-manual-testing-validation.sh` and run:

```bash
chmod +x scripts/pre-manual-testing-validation.sh
./scripts/pre-manual-testing-validation.sh
```

---

## Expected Issues & Fixes

### Common Issues

**Issue**: Test database connection fails
**Fix**: Run `node scripts/setup-test-database.mjs`

**Issue**: E2E tests timeout
**Fix**: Ensure dev server is running, increase timeout in playwright.config.ts

**Issue**: TypeScript errors in test files
**Fix**: Update test file types, ensure @types packages installed

**Issue**: Build fails with module not found
**Fix**: Check imports, ensure all dependencies installed

**Issue**: RLS policy tests fail
**Fix**: Verify test database has correct RLS policies, run migrations

---

## Next Steps After Validation

Once all automated tests pass:

1. **Review Test Results**: Check for any warnings or skipped tests
2. **Fix Any Issues**: Address any failures before manual testing
3. **Document Issues**: Note any issues found for tracking
4. **Proceed to Manual Testing**: Use the manual testing plan below

---

## Manual Testing Plan

See `MANUAL_TESTING_PLAN.md` for comprehensive manual testing checklist.

---

**Status**: Ready to execute
**Estimated Time**: 30-45 minutes
**Prerequisites**: Dev server running, test database configured
**Output**: Validation report with pass/fail for each phase

