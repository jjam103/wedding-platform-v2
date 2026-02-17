# E2E Guest Authentication Test Fixes - Final Analysis

## Current Status

**8/15 tests passing (53%)** - Regression from previous 12/15 (80%)

## Root Cause Analysis

### Issue 1: Magic Link Error Pages Not Rendering (Tests 9, 10, 14)
**Tests Affected**: 9, 10, 14

**Problem**: The magic link verification page (`/auth/guest-login/verify`) is not properly rendering error states. Instead of showing "Invalid Link", "Link Already Used", etc., it shows "Verifying Your Link" indefinitely.

**Root Cause**: The verification page likely has a client-side component that:
1. Reads the `error` and `message` query parameters
2. Should display the error state immediately
3. But instead shows a loading state ("Verifying Your Link")

**Fix Required**: Update `/app/auth/guest-login/verify/page.tsx` to:
- Check for `error` query parameter on page load
- Display error state immediately if error parameter exists
- Only show "Verifying Your Link" when actually verifying a token

### Issue 2: Logout Not Triggering Navigation (Test 11)
**Test Affected**: 11

**Problem**: After clicking the logout button, the page doesn't navigate to `/auth/guest-login`. The test times out waiting for the URL change.

**Root Cause**: The `GuestDashboard` component's `handleLogout` function uses `window.location.href = '/auth/guest-login'` which should work, but the test is using `Promise.all([page.waitForURL(...), logoutButton.click()])` which may not properly wait for the client-side navigation.

**Fix Required**: Update the test to:
- Click the logout button
- Wait for the navigation event using `page.waitForNavigation()` or similar
- Don't use `Promise.all` for client-side redirects

### Issue 3: Session Not Persisting (Test 12)
**Test Affected**: 12

**Problem**: After logging in and navigating to `/guest/events`, then refreshing, the session is lost and user is redirected to login page.

**Root Cause**: Either:
1. Session cookie is not being set with correct attributes (domain, path, sameSite)
2. Middleware is not properly validating the session cookie
3. Session is expiring too quickly

**Fix Required**: 
- Verify session cookie attributes in `/api/guest-auth/email-match/route.ts`
- Check middleware configuration for guest routes
- Ensure session validation in `lib/guestAuth.ts` is working correctly

### Issue 4: Authentication Failing in Audit Log Test (Test 15)
**Test Affected**: 15

**Problem**: The login form submission doesn't work in this specific test - stays on login page after clicking submit.

**Root Cause**: This test is the last one to run and may be affected by:
1. Test data cleanup issues from previous tests
2. Database state inconsistencies
3. Timing issues with form submission

**Fix Required**:
- Add more robust wait conditions before form submission
- Verify test guest exists before attempting login
- Add debugging to see why authentication fails

## Recommended Fix Order

### Priority 1: Fix Magic Link Error Pages (Tests 9, 10, 14)
This will fix 3 tests with a single change to the verification page.

**File to modify**: `app/auth/guest-login/verify/page.tsx`

**Changes needed**:
1. Check for `error` query parameter on mount
2. Display error state immediately if error exists
3. Only show loading state when actually verifying

### Priority 2: Fix Logout Navigation (Test 11)
Update the test to properly wait for client-side navigation.

**File to modify**: `__tests__/e2e/auth/guestAuth.spec.ts`

**Changes needed**:
1. Remove `Promise.all` wrapper
2. Click logout button
3. Use `page.waitForLoadState()` or `page.waitForTimeout()` to wait for navigation
4. Then check URL

### Priority 3: Fix Session Persistence (Test 12)
Investigate why session cookie is not persisting across page navigation.

**Files to check**:
1. `app/api/guest-auth/email-match/route.ts` - cookie settings
2. `middleware.ts` - guest route protection
3. `lib/guestAuth.ts` - session validation

### Priority 4: Fix Audit Log Test (Test 15)
Add more robust error handling and debugging to this test.

**File to modify**: `__tests__/e2e/auth/guestAuth.spec.ts`

**Changes needed**:
1. Add verification that test guest exists before login
2. Add longer waits for form submission
3. Add error logging to see why authentication fails

## Next Steps

1. Read and fix the magic link verification page
2. Update the logout test
3. Investigate session persistence issue
4. Fix the audit log test

## Files to Modify

1. `app/auth/guest-login/verify/page.tsx` - Fix error state rendering
2. `__tests__/e2e/auth/guestAuth.spec.ts` - Fix logout and audit log tests
3. `middleware.ts` (possibly) - Check guest route protection
4. `app/api/guest-auth/email-match/route.ts` (possibly) - Verify cookie settings
