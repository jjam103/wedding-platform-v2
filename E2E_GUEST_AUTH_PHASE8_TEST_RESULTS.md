# E2E Guest Authentication - Phase 8 Test Results

**Date**: 2025-02-06  
**Status**: ⚠️ 3/15 passing (20%) - Issues Identified

## Test Results Summary

### ✅ Passing Tests (3/15 - 20%)
1. ✅ Test 3: Show error for non-existent email
2. ✅ Test 4: Show error for invalid email format  
3. ✅ Test 5: Create session cookie on successful authentication

### ❌ Failing Tests (12/15 - 80%)

#### Category 1: Navigation Timeout Issues (2 tests)
- ❌ Test 1: Successfully authenticate with email matching - **TIMEOUT** waiting for dashboard
- ❌ Test 2: Show loading state during authentication - **NAVIGATION TOO FAST** (button already gone)

#### Category 2: Magic Link Issues (4 tests)
- ❌ Test 6: Successfully request and verify magic link - **NO SUCCESS MESSAGE** (green-50 not visible)
- ❌ Test 7: Show success message after requesting magic link - **NO SUCCESS MESSAGE**
- ❌ Test 8: Show error for expired magic link - **WRONG ERROR MESSAGE** ("Invalid Link" instead of "Link Expired")
- ❌ Test 9: Show error for already used magic link - **NO SUCCESS MESSAGE** on initial request

#### Category 3: Storage State Issues (6 tests)
- ❌ Test 10: Show error for invalid or missing token - **STORAGE STATE ERROR** (.auth/user.json missing)
- ❌ Test 11: Complete logout flow - **STORAGE STATE ERROR**
- ❌ Test 12: Persist authentication across page refreshes - **STORAGE STATE ERROR**
- ❌ Test 13: Switch between authentication tabs - **STORAGE STATE ERROR**
- ❌ Test 14: Handle authentication errors gracefully - **STORAGE STATE ERROR**
- ❌ Test 15: Log authentication events in audit log - **STORAGE STATE ERROR**

---

## Root Cause Analysis

### Issue 1: Navigation Timing (Tests 1-2)

**Test 1 Error**:
```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation to "/guest/dashboard" until "load"
  navigated to "http://localhost:3000/guest/dashboard"
  "domcontentloaded" event fired
```

**Root Cause**: The page navigates to `/guest/dashboard` and fires `domcontentloaded`, but the `load` event never fires within 10 seconds. This suggests:
1. The dashboard page has resources that are slow to load or timing out
2. The `waitForLoadState('networkidle')` is waiting for network activity to stop
3. There may be pending requests that never complete

**Test 2 Error**:
```
Error: expect(locator).toBeDisabled() failed
Expected: disabled
Error: element(s) not found
navigated to "http://localhost:3000/guest/dashboard"
```

**Root Cause**: The navigation happens SO FAST that by the time the test checks if the button is disabled, the page has already navigated away. The button no longer exists because we're on the dashboard.

### Issue 2: Magic Link Success Messages Not Showing (Tests 6-7, 9)

**Error**:
```
Error: expect(locator).toBeVisible() failed
Locator: locator('.bg-green-50')
Expected: visible
Error: element(s) not found
```

**Root Cause**: The magic link route is NOT redirecting back to the login page with success parameters. Looking at the route code, it should redirect with:
```typescript
const url = new URL('/auth/guest-login', request.url);
url.searchParams.set('success', 'magic_link_sent');
url.searchParams.set('message', 'Check your email for a login link...');
return NextResponse.redirect(url);
```

But the test is not seeing the success message. This suggests:
1. The redirect is not happening
2. The login page is not displaying the success message from query params
3. The form submission is not being detected as a form submission (content-type check)

### Issue 3: Expired Magic Link Error Message (Test 8)

**Error**:
```
Expected substring: "Link Expired"
Received string:    "Invalid Link"
```

**Root Cause**: The magic link verify route is returning "Invalid Link" for expired tokens instead of "Link Expired". The route needs to distinguish between:
- Invalid token format → "Invalid Link"
- Token not found in database → "Invalid Link"  
- Token expired → "Link Expired"
- Token already used → "Link Already Used"

### Issue 4: Storage State Missing (Tests 10-15)

**Error**:
```
Error reading storage state from .auth/user.json:
ENOENT: no such file or directory, open '.auth/user.json'
```

**Root Cause**: These tests are trying to use admin authentication state (`.auth/user.json`), but:
1. Guest authentication tests should NOT use admin auth state
2. The tests should be independent and not require pre-existing auth
3. The playwright config may be incorrectly configured to use storage state for all tests

---

## Fixes Required

### Priority 1: Fix Magic Link Form Submission Detection

**File**: `app/api/guest-auth/magic-link/request/route.ts`  
**Issue**: The route checks content-type to determine if it's a form submission, but the test is submitting via JavaScript click, not a real form submission.

**Solution**: The route should handle both form submissions AND programmatic submissions. The test is clicking a button, which triggers a form submit event, but the content-type might be `application/json` or empty.

### Priority 2: Fix Login Page Success Message Display

**File**: `app/auth/guest-login/page.tsx` (needs verification)  
**Issue**: The login page is not displaying success messages from query parameters.

**Solution**: The page needs to read `success` and `message` query params and display them in a green alert box.

### Priority 3: Fix Magic Link Verify Route Error Messages

**File**: `app/api/guest-auth/magic-link/verify/route.ts` (needs verification)  
**Issue**: The route is not distinguishing between expired and invalid tokens.

**Solution**: Check token expiration date and return appropriate error message.

### Priority 4: Remove Storage State from Guest Auth Tests

**File**: `playwright.config.ts` or test file  
**Issue**: Tests are trying to use admin auth state when they shouldn't.

**Solution**: Guest auth tests should NOT use storage state. Remove the storage state configuration for these tests.

### Priority 5: Fix Navigation Timing

**Options**:
1. Change `waitForURL` to not wait for `load` event (use `domcontentloaded` instead)
2. Increase timeout further (20 seconds)
3. Remove `waitForLoadState('networkidle')` which may be causing issues
4. Use `waitForURL` with `waitUntil: 'domcontentloaded'` option

---

## Recommended Next Steps

### Step 1: Check Login Page Implementation

```bash
# Verify the login page displays success messages
cat app/auth/guest-login/page.tsx | grep -A 10 "searchParams"
```

### Step 2: Check Magic Link Verify Route

```bash
# Verify the verify route distinguishes error types
cat app/api/guest-auth/magic-link/verify/route.ts | grep -A 5 "expired"
```

### Step 3: Fix Storage State Configuration

Check if the test file or playwright config is incorrectly using storage state for guest tests.

### Step 4: Fix Navigation Timing

Change the navigation wait strategy to be more lenient:
```typescript
// Instead of:
await page.waitForLoadState('networkidle');
await page.waitForURL('/guest/dashboard', { timeout: 10000 });

// Use:
await page.waitForURL('/guest/dashboard', { 
  timeout: 10000, 
  waitUntil: 'domcontentloaded' 
});
```

---

## Analysis of Fixes Applied

### ✅ What Worked
1. RSVPs route graceful error handling - No longer causing 500 errors
2. Magic link route query fix - Using `.maybeSingle()` correctly
3. Audit log insertion - Already implemented correctly

### ⚠️ What Didn't Work
1. Test timeouts - Still timing out (need different approach)
2. Magic link success messages - Not showing (login page issue)
3. Storage state - Tests incorrectly configured

### 🔍 What Needs Investigation
1. Why is the dashboard page taking so long to load?
2. Why is the login page not showing success messages?
3. Why are tests trying to use admin storage state?
4. Why is the magic link verify route not distinguishing error types?

---

## Comparison to Previous Session

### Previous Session: 8/15 passing (53%)
- Tests 1-3, 5, 10-13 were passing
- Magic link tests (6-9) were failing
- Test 4 was failing (API route issue)
- Tests 14-15 were failing

### Current Session: 3/15 passing (20%)
- **REGRESSION**: Lost 5 passing tests (1-2, 10-13)
- **IMPROVEMENT**: Test 5 now passing (session cookie)
- **SAME**: Tests 3-4 passing (error handling)
- **SAME**: Magic link tests still failing (6-9)
- **NEW ISSUE**: Storage state errors (10-15)

### Why the Regression?

The regression is likely due to:
1. **Storage State Configuration**: Tests 10-15 are now failing due to missing `.auth/user.json` file
2. **Navigation Timing**: Tests 1-2 are now timing out due to `waitForLoadState('networkidle')` addition
3. **Test Environment**: Something changed in the test environment between sessions

---

## Immediate Actions Required

1. **Remove `waitForLoadState('networkidle')`** - This is causing navigation timeouts
2. **Fix storage state configuration** - Guest tests should not use admin auth
3. **Investigate login page** - Why are success messages not showing?
4. **Check magic link verify route** - Ensure it distinguishes error types

---

**Status**: ⚠️ Regression Identified - Additional Fixes Required  
**Next Action**: Remove `waitForLoadState` and fix storage state configuration  
**Expected Outcome**: 8-10/15 tests passing after fixes

