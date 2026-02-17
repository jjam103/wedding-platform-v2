# E2E Pattern 1 - Remaining UI Fixes

## Status: In Progress

## Issues Identified

### Issue 1: Magic Link Button Visibility (2 tests failing/flaky)

**Test**: "should show success message after requesting magic link"

**Root Cause**: Test timing issue - the test isn't waiting properly for the tab switch to complete before trying to interact with the button.

**Current Test Code**:
```typescript
// Switch to magic link tab
await page.click('button:has-text("Magic Link")');

// Fill email and submit
await page.fill('input[name="email"]', testGuestEmail);
await page.click('button:has-text("Send Magic Link")'); // TIMES OUT HERE
```

**Problem**: The test clicks the tab but doesn't wait for the tab panel to become visible and interactive. The button exists but may not be clickable yet due to the `hidden` attribute on the tab panel.

**Solution**: Add proper wait conditions after tab switch:
```typescript
// Switch to magic link tab
await page.click('button:has-text("Magic Link")');

// Wait for the magic link panel to be visible
await page.waitForSelector('#magic-link-panel:not([hidden])', { state: 'visible' });

// Wait for the button to be visible and enabled
await page.waitForSelector('button:has-text("Send Magic Link")', { 
  state: 'visible',
  timeout: 5000 
});

// Fill email and submit
await page.fill('input[name="email"]', testGuestEmail);
await page.click('button:has-text("Send Magic Link")');
```

### Issue 2: Logout Flow (1 test failing)

**Test**: "should complete logout flow"

**Root Cause**: The logout API exists and works correctly, but the test isn't waiting long enough for the logout to complete and the redirect to happen.

**Current Logout Flow**:
1. User clicks "Log Out" button in GuestDashboard
2. Button calls `/api/guest-auth/logout` (POST)
3. API deletes session from database
4. API clears cookie
5. Component redirects to `/auth/guest-login` using `window.location.href`

**Current Test Code**:
```typescript
const logoutSelectors = [
  'button:has-text("Log Out")',
  'button:has-text("Logout")',
  'a:has-text("Log Out")',
  'a:has-text("Logout")'
];

let logoutButton = null;
for (const selector of logoutSelectors) {
  const button = page.locator(selector).first();
  if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
    logoutButton = button;
    break;
  }
}

if (logoutButton) {
  await logoutButton.click();
  // Wait for logout to complete
  await page.waitForTimeout(2000); // NOT ENOUGH TIME
}
```

**Problem**: 
1. The test only waits 2 seconds after clicking logout
2. It doesn't verify the navigation actually happened
3. The logout API call + database deletion + cookie clearing + redirect can take longer than 2 seconds

**Solution**: Wait for the actual navigation to login page:
```typescript
// Find and click logout button
const logoutButton = page.locator('button:has-text("Log Out")').first();
await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
await logoutButton.click();

// Wait for navigation to login page (this is the key fix)
await page.waitForURL('**/auth/guest-login', { 
  timeout: 10000,
  waitUntil: 'networkidle' 
});

// Verify we're on the login page
await expect(page).toHaveURL(/\/auth\/guest-login/);
```

## Implementation Plan

### Step 1: Fix Magic Link Button Test
- Update test to wait for tab panel visibility
- Add explicit wait for button to be clickable
- Verify success message appears

### Step 2: Fix Logout Flow Test
- Update test to wait for URL navigation instead of arbitrary timeout
- Add verification that we're on login page
- Ensure audit log check happens after navigation completes

### Step 3: Verify Fixes
- Run individual tests to confirm fixes
- Run full guest auth suite to ensure no regressions
- Document the proper wait patterns for future tests

## Expected Outcome

After fixes:
- Magic link button test: PASS (currently flaky/failing)
- Logout flow test: PASS (currently failing)
- Full guest auth suite: 15/15 passing (100%)

## Files to Modify

1. `__tests__/e2e/auth/guestAuth.spec.ts` - Update both test cases with proper wait conditions
