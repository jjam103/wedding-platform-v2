# E2E Guest Authentication - Root Cause Analysis and Fix

## Problem Summary

Guest authentication tests are failing with a redirect loop:
- Tests submit login form successfully
- API creates session and sets cookie
- Frontend tries to navigate to `/guest/dashboard`
- Middleware redirects back to `/auth/guest-login`
- **Result**: Infinite redirect loop, tests timeout

## Root Cause

The middleware's guest authentication logic has a critical flaw in how it validates session cookies:

### Issue 1: Cookie Reading Problem
```typescript
// middleware.ts line ~40
const sessionToken = request.cookies.get('guest_session')?.value;
```

The cookie is being set by the API route, but the middleware might not be reading it correctly due to:
1. Cookie propagation timing (cookie set in response, but next request doesn't include it)
2. Browser cookie handling in E2E tests
3. SameSite/Secure attribute mismatches

### Issue 2: Database Query Returns Multiple Sessions
```typescript
// middleware.ts line ~60
const { data: sessions, error: sessionError } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken);

// Check if we got exactly one session
if (!sessions || sessions.length === 0) {
  console.log('[Middleware] No session found in database for token');
  return redirectToGuestLogin(request);
}

if (sessions.length > 1) {
  return redirectToGuestLogin(request);  // ❌ FAILS if multiple sessions exist
}
```

**Problem**: The query doesn't use `.single()` or `.maybeSingle()`, so it returns an array. If there are multiple sessions for the same token (shouldn't happen, but possible in tests with cleanup issues), it fails.

### Issue 3: Test Cleanup Race Condition
```typescript
// guestAuth.spec.ts afterEach
test.afterEach(async () => {
  // CRITICAL: Wait for all async operations to complete before cleanup
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete only sessions for this test's guest
  if (testGuestId) {
    await supabase
      .from('guest_sessions')
      .delete()
      .eq('guest_id', testGuestId);
  }
});
```

**Problem**: The 5-second delay might not be enough if the test navigates to dashboard and triggers API calls. The cleanup might delete the session while the test is still running.

## The Fix

### Fix 1: Use `.maybeSingle()` in Middleware

```typescript
// middleware.ts - BEFORE
const { data: sessions, error: sessionError } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken);

if (!sessions || sessions.length === 0) {
  return redirectToGuestLogin(request);
}

if (sessions.length > 1) {
  return redirectToGuestLogin(request);
}

const session = sessions[0];

// middleware.ts - AFTER
const { data: session, error: sessionError } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken)
  .maybeSingle();  // ✅ Returns null if not found, single object if found

if (sessionError) {
  console.log('[Middleware] Session query error:', sessionError);
  return redirectToGuestLogin(request);
}

if (!session) {
  console.log('[Middleware] No session found in database for token');
  return redirectToGuestLogin(request);
}
```

### Fix 2: Add Cookie Propagation Delay in Login Page

```typescript
// app/auth/guest-login/page.tsx - BEFORE
if (response.ok && data.success) {
  // Success - navigate to dashboard
  await new Promise(resolve => setTimeout(resolve, 500));
  window.location.href = '/guest/dashboard';
}

// app/auth/guest-login/page.tsx - AFTER
if (response.ok && data.success) {
  // Success - navigate to dashboard
  // CRITICAL: Wait for cookie to be set AND database transaction to commit
  // This prevents race condition where middleware checks before session is ready
  await new Promise(resolve => setTimeout(resolve, 1000));  // ✅ Increased from 500ms
  
  // Verify cookie was set before redirecting
  const cookieCheck = document.cookie.includes('guest_session');
  if (!cookieCheck) {
    console.warn('Cookie not set yet, waiting additional time...');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Use window.location.href for full page navigation (ensures cookies are sent)
  window.location.href = '/guest/dashboard';
}
```

### Fix 3: Increase Test Cleanup Delay

```typescript
// __tests__/e2e/auth/guestAuth.spec.ts - BEFORE
test.afterEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  // ... cleanup
});

// __tests__/e2e/auth/guestAuth.spec.ts - AFTER
test.afterEach(async () => {
  // CRITICAL: Wait for all async operations to complete before cleanup
  // Increased to 8 seconds to account for:
  // - Dashboard navigation (1s)
  // - Dashboard API calls (4 requests taking 3-5s total)
  // - Audit log writes (async, fire-and-forget)
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // ... cleanup
});
```

### Fix 4: Add Session Uniqueness Constraint

```sql
-- Migration: Add unique constraint on token column
ALTER TABLE guest_sessions
ADD CONSTRAINT guest_sessions_token_unique UNIQUE (token);
```

This prevents duplicate sessions with the same token from being created.

## Implementation Priority

1. **Fix 1 (Middleware)** - CRITICAL, fixes the core issue
2. **Fix 2 (Login Page)** - HIGH, ensures cookie propagation
3. **Fix 3 (Test Cleanup)** - MEDIUM, prevents test pollution
4. **Fix 4 (Database)** - LOW, prevents future issues

## Testing Strategy

After applying fixes:

1. Run single guest auth test:
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts:154 --headed
   ```

2. Run full guest auth suite:
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts
   ```

3. Run full E2E suite to verify unblocking:
   ```bash
   npx playwright test --reporter=list --max-failures=50
   ```

## Expected Results

- Guest auth tests should pass (15/15)
- Tests that depend on guest auth should now run (174 tests currently not running)
- Overall pass rate should increase from 31.5% to 60%+

## Verification

Check middleware logs for successful session validation:
```
[Middleware] Guest auth check: { path: '/guest/dashboard', hasCookie: true, ... }
[Middleware] Session query result: { sessionsFound: 1, hasError: false, ... }
```

Check browser console for successful navigation:
```
[Test] About to click submit button
[API] Setting guest session cookie: { tokenPrefix: '...', ... }
```
