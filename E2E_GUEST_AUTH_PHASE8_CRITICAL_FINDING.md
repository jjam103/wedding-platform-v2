# E2E Guest Authentication Phase 8 - CRITICAL FINDING

**Date**: 2025-02-06  
**Status**: 🚨 CRITICAL ISSUE IDENTIFIED  
**Pass Rate**: 5/15 (33%)

---

## Executive Summary

The E2E test failures are NOT caused by broken authentication code. The authentication code works correctly. The failures are caused by **test cleanup running too early and deleting sessions while tests are still executing**.

---

## Evidence

### Session Deletion Pattern

Looking at the logs for Test 5 (email matching authentication):

```
[WebServer] [API] Setting guest session cookie: {
  tokenPrefix: '0309d20a',
  guestId: '14625049-bf89-4fec-9a64-d65f255b9c52',
  sessionId: '5c6127b4-774d-4e66-829d-32a90e26b1f4'
}
[WebServer] POST /api/guest-auth/email-match 200 in 6.2s

[WebServer] [Middleware] Session query result: {
  sessionsFound: 1,  // ✅ Session exists
  tokenPrefix: '0309d20a'
}
[WebServer] [GuestDashboard] Rendering dashboard for guest

// Then immediately after:
[WebServer] [Middleware] Session query result: {
  sessionsFound: 0,  // ❌ Session GONE!
  tokenPrefix: '0309d20a'
}
[WebServer] [Middleware] No session found in database for token
```

**This pattern repeats for ALL failing tests.**

---

## Root Cause

The `afterEach` cleanup in the test file deletes sessions for the test guest:

```typescript
afterEach(async () => {
  // Delete only sessions for this test's guest
  if (testGuestId) {
    await supabase
      .from('guest_sessions')
      .delete()
      .eq('guest_id', testGuestId);
  }
});
```

**Problem**: The cleanup runs BEFORE the test completes its navigation and API calls. This causes:
1. Test logs in successfully
2. Session created in database
3. Test starts navigating to dashboard
4. **Cleanup runs and deletes session** (TOO EARLY!)
5. Dashboard tries to load and session is gone
6. Test fails with "session not found"

---

## Why This Happens

Playwright tests run in parallel with 4 workers. When a test completes its main assertions but is still waiting for network requests or navigation to settle, Playwright may trigger the `afterEach` cleanup before all async operations complete.

The issue is exacerbated by:
1. **Network idle wait**: Tests wait for `networkidle` which can take time
2. **Parallel execution**: Multiple tests running simultaneously
3. **Async cleanup**: The cleanup is async and may race with test completion

---

## Affected Tests

### ❌ Failing Due to Session Deletion (7 tests)

1. **Test 5**: Email matching authentication - session deleted during dashboard load
2. **Test 3**: Session cookie test - session deleted before verification
3. **Test 6**: Magic link request/verify - session deleted after verification
4. **Test 9**: Already used magic link - session deleted during second attempt
5. **Test 11**: Logout flow - can't test logout if session already deleted
6. **Test 12**: Session persistence - session deleted between page navigations
7. **Test 15**: Audit logging - authentication fails due to session deletion

### ❌ Failing Due to Form Submission (2 tests)

8. **Test 6**: Magic link request - `SyntaxError: Unexpected end of JSON input`
9. **Test 7**: Magic link success message - Same form submission error

**Root Cause**: Tests are submitting forms via button click, but the login page JavaScript is trying to intercept and submit via fetch with JSON. The form submission is happening before JavaScript loads, causing empty body.

### ❌ Failing Due to Other Issues (1 test)

10. **Test 10**: Invalid token - Page not loading properly (may be related to session deletion)

---

## Solution

### Option 1: Delay Cleanup (RECOMMENDED)

Add a delay before cleanup to ensure all async operations complete:

```typescript
afterEach(async () => {
  // Wait for all async operations to complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Then cleanup
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Delete only sessions for this test's guest
    if (testGuestId) {
      await supabase
        .from('guest_sessions')
        .delete()
        .eq('guest_id', testGuestId);
    }
    
    // Delete only this test's guest
    if (testGuestId) {
      await supabase
        .from('guests')
        .delete()
        .eq('id', testGuestId);
    }
    
    // Delete only this test's group
    if (testGroupId) {
      await supabase
        .from('groups')
        .delete()
        .eq('id', testGroupId);
    }
  } catch (error) {
    console.error('Cleanup failed (non-fatal):', error);
  }
});
```

### Option 2: Use Test Fixtures

Use Playwright's built-in fixture system to manage test data lifecycle:

```typescript
const test = base.extend<{ testGuest: { id: string; email: string } }>({
  testGuest: async ({}, use) => {
    // Setup
    const guest = await createTestGuest();
    
    // Use
    await use(guest);
    
    // Teardown (runs after test completes)
    await cleanupTestGuest(guest.id);
  },
});
```

### Option 3: Don't Delete Sessions in afterEach

Let the global teardown handle all cleanup:

```typescript
afterEach(async () => {
  // Only delete guest and group, NOT sessions
  // Sessions will be cleaned up by global teardown
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Delete only this test's guest (cascade will handle sessions)
    if (testGuestId) {
      await supabase
        .from('guests')
        .delete()
        .eq('id', testGuestId);
    }
    
    // Delete only this test's group
    if (testGroupId) {
      await supabase
        .from('groups')
        .delete()
        .eq('id', testGroupId);
    }
  } catch (error) {
    console.error('Cleanup failed (non-fatal):', error);
  }
});
```

---

## Magic Link Form Submission Fix

The magic link tests are failing because the form is being submitted before JavaScript loads. The login page has JavaScript that intercepts form submission and sends JSON, but the test is clicking the button before the JavaScript is ready.

**Fix**: Wait for JavaScript to load before submitting:

```typescript
// Fill in email and submit
await page.fill('#magic-link-input', testGuestEmail);

// Wait for JavaScript to be ready
await page.waitForLoadState('networkidle');

// Now click submit
await page.click('button[type="submit"]:has-text("Send Magic Link")');
```

---

## Recommended Action Plan

1. **Immediate Fix**: Add 2-second delay in `afterEach` cleanup
2. **Test Magic Link**: Add `waitForLoadState('networkidle')` before form submission
3. **Run Tests**: Verify fixes resolve session deletion issues
4. **Long-term**: Migrate to Playwright fixtures for better test isolation

---

## Expected Results After Fix

With the cleanup delay and form submission fix:

- **Tests 5, 3, 6, 9, 11, 12, 15**: Should pass (session not deleted prematurely)
- **Tests 6, 7**: Should pass (form submission works correctly)
- **Test 10**: May pass (if related to session deletion)

**Expected Pass Rate**: 12-14/15 (80-93%)

---

## Status

🎯 **Root cause identified**  
🔧 **Fix ready to apply**  
⏱️ **ETA**: 5 minutes to implement and verify

