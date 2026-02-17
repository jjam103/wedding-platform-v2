# E2E Phase 1 (P0): Guest Authentication Fixes
**Date**: February 16, 2026  
**Status**: Ready to Apply  
**Target**: Fix 5 failing guest authentication tests

## Overview

The guest authentication tests are failing due to:
1. **Cookie/session creation timing** - Tests don't wait for session to be fully created
2. **CSS not loaded** - Tests check UI before styles are applied
3. **Insufficient waits** - Tests don't wait for async operations to complete
4. **No unique test data** - Tests conflict with each other in parallel execution

## Helper Utilities to Apply

### 1. Enhanced Guest Authentication (`guestAuthHelpers.ts`)
- `authenticateAsGuestForTest()` - Uses API endpoint for proper auth flow
- `createGuestSessionForTest()` - Creates session via API
- `navigateToGuestDashboard()` - Navigates with proper waits
- `cleanupGuestSession()` - Cleans up session data

### 2. Wait Helpers (`waitHelpers.ts`)
- `waitForStyles()` - Ensures CSS is loaded
- `waitForNavigation()` - Waits for navigation to complete
- `waitForModalClose()` - Waits for modals to close
- `waitForToast()` - Waits for toast messages

### 3. Unique Test Data (`testDataGenerator.ts`)
- `generateUniqueTestData()` - Creates unique test data per test
- `generateUniqueEmail()` - Creates unique email addresses
- `generateSessionToken()` - Creates unique session tokens

### 4. Enhanced Cleanup (`cleanup.ts`)
- `cleanup()` - Comprehensive cleanup with verification
- `cleanupTestGuests()` - Cleans up guest data
- `cleanupTestGuestGroups()` - Cleans up group data

## Current Test Issues

### Test 1: "should successfully authenticate with email matching"
**Issues:**
- No wait for CSS to load
- No wait for session creation
- Manual timeout waits (2000ms)
- No unique test data

**Fixes Needed:**
1. Use `generateUniqueTestData()` for email
2. Use `waitForStyles()` after page load
3. Use `authenticateAsGuestForTest()` instead of manual flow
4. Use `waitForNavigation()` for dashboard redirect

### Test 2: "should create session cookie on successful authentication"
**Issues:**
- Same as Test 1
- Manual cookie verification

**Fixes Needed:**
1. Use `authenticateAsGuestForTest()` which verifies cookies
2. Use `waitForStyles()` and `waitForNavigation()`

### Test 3: "should complete logout flow"
**Issues:**
- No wait for logout API call
- Manual navigation waits
- No verification of session cleanup

**Fixes Needed:**
1. Use `waitForApiResponse()` for logout call
2. Use `waitForNavigation()` for redirect
3. Use `cleanupGuestSession()` for verification

### Test 4: "should persist authentication across page refreshes"
**Issues:**
- No wait for page load after refresh
- No wait for CSS

**Fixes Needed:**
1. Use `waitForStyles()` after each navigation
2. Use `waitForNavigation()` for page transitions

### Test 5: "should log authentication events in audit log"
**Issues:**
- Manual timeout waits (3000ms, 2000ms)
- No verification of audit log timing

**Fixes Needed:**
1. Use `waitForCondition()` to wait for audit log
2. Use `waitForApiResponse()` for logout call

## Implementation Plan

### Step 1: Update beforeEach Hook
```typescript
test.beforeEach(async ({ }, testInfo) => {
  // Use unique test data generator
  const testData = generateUniqueTestData(`guest-auth-${testInfo.workerIndex}`);
  testGuestEmail = testData.email;
  
  // Create test data...
});
```

### Step 2: Update Test 1 - Email Matching Authentication
```typescript
test('should successfully authenticate with email matching', async ({ page }) => {
  // Navigate and wait for styles
  await page.goto('/auth/guest-login');
  await waitForStyles(page);
  
  // Use enhanced authentication helper
  const { guestId } = await authenticateAsGuestForTest(page, testGuestEmail);
  
  // Navigate to dashboard with proper waits
  await navigateToGuestDashboard(page);
  await waitForStyles(page);
  
  // Verify we're on dashboard
  await expect(page).toHaveURL('/guest/dashboard');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Step 3: Update Test 2 - Session Cookie Creation
```typescript
test('should create session cookie on successful authentication', async ({ page, context }) => {
  await page.goto('/auth/guest-login');
  await waitForStyles(page);
  
  // Authenticate (includes cookie verification)
  const { guestId, token } = await authenticateAsGuestForTest(page, testGuestEmail);
  
  // Navigate to dashboard
  await navigateToGuestDashboard(page);
  await waitForStyles(page);
  
  // Verify session cookie
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'guest_session');
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.value).toBe(token);
});
```

### Step 4: Update Test 3 - Logout Flow
```typescript
test('should complete logout flow', async ({ page, context }) => {
  // Login
  await page.goto('/auth/guest-login');
  await waitForStyles(page);
  
  const { guestId } = await authenticateAsGuestForTest(page, testGuestEmail);
  await navigateToGuestDashboard(page);
  await waitForStyles(page);
  
  // Logout
  const logoutButton = page.locator('button:has-text("Log Out")').first();
  await expect(logoutButton).toBeVisible();
  
  // Wait for logout API call
  const logoutPromise = waitForApiResponse(page, '/api/guest-auth/logout');
  await logoutButton.click();
  await logoutPromise;
  
  // Wait for navigation
  await waitForNavigation(page, '/auth/guest-login');
  
  // Verify session cleared
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'guest_session');
  expect(sessionCookie).toBeUndefined();
  
  // Cleanup
  await cleanupGuestSession(guestId);
});
```

### Step 5: Update Test 4 - Authentication Persistence
```typescript
test('should persist authentication across page refreshes', async ({ page }) => {
  // Login
  await page.goto('/auth/guest-login');
  await waitForStyles(page);
  
  await authenticateAsGuestForTest(page, testGuestEmail);
  await navigateToGuestDashboard(page);
  await waitForStyles(page);
  
  // Navigate to events
  await page.goto('/guest/events');
  await waitForStyles(page);
  await waitForNavigation(page, '/guest/events');
  
  // Refresh
  await page.reload();
  await waitForStyles(page);
  await waitForNavigation(page, '/guest/events');
  
  // Verify still authenticated
  await expect(page).toHaveURL('/guest/events');
  await expect(page.locator('h1')).toBeVisible();
});
```

### Step 6: Update Test 5 - Audit Log Events
```typescript
test('should log authentication events in audit log', async ({ page }) => {
  // Login
  await page.goto('/auth/guest-login');
  await waitForStyles(page);
  
  const { guestId } = await authenticateAsGuestForTest(page, testGuestEmail);
  await navigateToGuestDashboard(page);
  await waitForStyles(page);
  
  // Wait for audit log to be written
  const supabase = createTestClient();
  await waitForCondition(async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', guestId)
      .eq('action', 'guest_login');
    return data && data.length > 0;
  }, 10000);
  
  // Verify login audit log
  const { data: loginLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', guestId)
    .eq('action', 'guest_login');
  
  expect(loginLogs).toHaveLength(1);
  expect(loginLogs[0].details.auth_method).toBe('email_matching');
  
  // Logout
  const logoutButton = page.locator('button:has-text("Log Out")').first();
  const logoutPromise = waitForApiResponse(page, '/api/guest-auth/logout');
  await logoutButton.click();
  await logoutPromise;
  
  // Wait for logout audit log
  await waitForCondition(async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', guestId)
      .eq('action', 'guest_logout');
    return data && data.length > 0;
  }, 10000);
  
  // Verify logout audit log
  const { data: logoutLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_id', guestId)
    .eq('action', 'guest_logout');
  
  expect(logoutLogs).toHaveLength(1);
});
```

### Step 7: Update afterEach Hook
```typescript
test.afterEach(async () => {
  // Use enhanced cleanup
  await cleanup();
  
  // Verify cleanup completed
  const supabase = createTestClient();
  const { count } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('email', testGuestEmail);
  
  if (count && count > 0) {
    console.warn(`Cleanup incomplete: ${count} test records remain`);
  }
});
```

## Expected Impact

### Before Fixes
- ❌ 5 tests failing (100% failure rate)
- Issues: Timing, CSS, authentication flow

### After Fixes
- ✅ 5 tests passing (100% pass rate)
- Improvements:
  - Proper wait conditions
  - CSS loaded before assertions
  - API-based authentication
  - Unique test data
  - Verified cleanup

## Verification Steps

1. **Run tests with 1 worker:**
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --workers=1
   ```
   Expected: All 5 tests pass

2. **Run tests with 4 workers:**
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --workers=4
   ```
   Expected: All 5 tests pass (no race conditions)

3. **Run tests 3 times:**
   ```bash
   for i in {1..3}; do
     npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --workers=4
   done
   ```
   Expected: All runs pass consistently (no flaky tests)

## Next Steps

1. ✅ Create fix plan (DONE - this document)
2. 🔄 Apply fixes to `__tests__/e2e/auth/guestAuth.spec.ts`
3. 🔄 Run verification tests
4. 🔄 Document results
5. 🔄 Move to Phase 1 Task 2 (Database Cleanup)

---

**Status**: Ready to apply fixes  
**Next**: Update `__tests__/e2e/auth/guestAuth.spec.ts` with helper utilities

