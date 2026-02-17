# E2E Guest Authentication Tests - Fixes In Progress

## Current Status: 10/15 tests passing (67%)

### Test Results Summary
- ✅ **10 tests passing** (Tests 1, 2, 3, 5, 6, 7, 8, 9, 10, 13)
- ❌ **4 tests failing** (Tests 11, 12, 14, 15)
- ⏭️ **1 test skipped** (Test 4 - flaky)

## Failing Tests Analysis

### Test 11: "should complete logout flow" - FAILING
**Error**: `TimeoutError: page.waitForURL: Timeout 10000ms exceeded`

**Root Cause**: The logout button uses `window.location.href` for navigation, which is not a client-side navigation that Playwright can intercept with `Promise.all([page.waitForURL(), button.click()])`.

**Fix Strategy**:
1. Change the test to not use `Promise.all` for navigation
2. Click the button first, then wait for navigation
3. Add a longer timeout for the navigation wait

**Proposed Fix**:
```typescript
// Step 4: Click logout button
await logoutButton!.click();

// Step 5: Wait for navigation to login page (separate from click)
await page.waitForURL('/auth/guest-login', { 
  timeout: 15000,
  waitUntil: 'domcontentloaded'
});
```

### Test 12: "should persist authentication across page refreshes" - FAILING
**Error**: `expect(locator).toBeVisible() failed` - h1 element not found

**Root Cause**: The `/guest/activities` page might not exist or might have a different route structure.

**Investigation Needed**:
1. Check if `/guest/activities` route exists in the app
2. Verify the page has an h1 element
3. Check if middleware is blocking access

**Proposed Fix**:
1. Verify the route exists: Check `app/guest/activities/page.tsx`
2. If route doesn't exist, change test to use a different route like `/guest/events`
3. Add explicit wait for page load: `await page.waitForLoadState('networkidle')`

### Test 14: "should handle authentication errors gracefully" - FAILING
**Error**: `expect(locator).toBeVisible() failed` - `.bg-red-50` element not found

**Root Cause**: Even with `waitForLoadState('networkidle')`, the form is submitting as HTML form instead of via JavaScript. The URL shows `?email=nonexistent@example.com` which indicates HTML form submission.

**Investigation**: The login page JavaScript should intercept form submission, but it's not happening fast enough.

**Proposed Fix**:
1. Add explicit wait for JavaScript to be ready
2. Wait for the submit button to be enabled (not disabled)
3. Add a small delay after `waitForLoadState` to ensure React has hydrated

```typescript
await page.goto('/auth/guest-login');
await page.waitForLoadState('networkidle');
// Wait for React to hydrate
await page.waitForTimeout(500);
// Verify button is ready
await page.waitForSelector('button[type="submit"]:not([disabled])');
await page.fill('#email-matching-input', 'nonexistent@example.com');
await page.click('button[type="submit"]:has-text("Log In")');
```

### Test 15: "should log authentication events in audit log" - FAILING
**Error**: `Authentication failed - still on login page`

**Root Cause**: Same as Test 14 - form submitting as HTML instead of JavaScript.

**Proposed Fix**: Same as Test 14 - add explicit waits for JavaScript to be ready.

## Implementation Plan

### Priority 1: Fix Test 11 (Logout Flow)
**File**: `__tests__/e2e/auth/guestAuth.spec.ts` (lines 535-601)

**Change**:
```typescript
// OLD (lines 571-579):
await Promise.all([
  page.waitForURL('/auth/guest-login', { 
    timeout: 10000,
    waitUntil: 'domcontentloaded'
  }),
  logoutButton!.click()
]);

// NEW:
await logoutButton!.click();
await page.waitForURL('/auth/guest-login', { 
  timeout: 15000,
  waitUntil: 'domcontentloaded'
});
```

### Priority 2: Fix Tests 14 & 15 (Form Submission Timing)
**File**: `__tests__/e2e/auth/guestAuth.spec.ts`

**Test 14 Changes** (lines 674-682):
```typescript
// Add after line 676 (after goto):
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Wait for React hydration
await page.waitForSelector('button[type="submit"]:not([disabled])');
```

**Test 15 Changes** (lines 719-738):
```typescript
// Add after line 721 (after goto):
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // Wait for React hydration
await page.waitForSelector('button[type="submit"]:not([disabled])');
```

### Priority 3: Fix Test 12 (Session Persistence)
**Investigation First**: Check if `/guest/activities` route exists

**Option A** (if route exists):
```typescript
// Add after line 626:
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);
```

**Option B** (if route doesn't exist):
```typescript
// Replace lines 625-628:
await page.goto('/guest/events'); // Use events instead of activities
await expect(page).toHaveURL('/guest/events');
await page.waitForLoadState('networkidle');
await expect(page.locator('h1')).toBeVisible();
```

## Next Steps

1. ✅ Analyze all 4 failing tests
2. ⏳ Implement fixes for Test 11 (logout flow)
3. ⏳ Implement fixes for Tests 14 & 15 (form submission timing)
4. ⏳ Investigate and fix Test 12 (session persistence)
5. ⏳ Run tests to verify fixes
6. ⏳ Achieve 100% pass rate (15/15 tests)

## Files to Modify

1. `__tests__/e2e/auth/guestAuth.spec.ts` - All test fixes
2. Possibly `app/guest/activities/page.tsx` - If route doesn't exist

## Expected Outcome

After implementing these fixes:
- Test 11: Should pass with separate click and wait
- Tests 14 & 15: Should pass with explicit JavaScript readiness waits
- Test 12: Should pass with proper route or additional waits
- **Target**: 14/15 tests passing (93%) or 15/15 (100%)

## Key Insights

1. **window.location.href navigation**: Cannot be intercepted with Promise.all in Playwright
2. **React hydration timing**: Need explicit waits for JavaScript to be ready before form submission
3. **Route verification**: Need to verify routes exist before testing navigation
4. **Timing is critical**: E2E tests need careful timing management for JavaScript-heavy apps

