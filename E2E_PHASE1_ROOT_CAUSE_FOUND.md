# E2E Phase 1 - Root Cause Found

**Date**: February 6, 2026  
**Status**: Root Cause Identified - Cookie Timing Issue

## The Real Problem

The fixes were already applied, but tests still fail because of a **cookie timing/propagation issue** between the API response and the navigation request.

## Flow Analysis

### What Happens (Current Behavior)

1. User submits login form
2. Frontend calls `/api/auth/guest/email-match` with `fetch()`
3. API validates credentials and creates session in database
4. API sets `guest_session` cookie in response
5. API returns `{ success: true, data: {...} }`
6. Frontend receives response and calls `window.location.href = '/guest/dashboard'`
7. **Browser makes NEW request to `/guest/dashboard`**
8. Middleware intercepts request and checks for `guest_session` cookie
9. **Middleware doesn't find cookie or session** → Redirects to login

### Why It Fails

The issue is in step 9. The middleware query at line 68-75 in `middleware.ts`:

```typescript
const { data: sessions, error: sessionError } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken);
```

This query is failing or returning no results, causing the redirect.

## Possible Causes

### Cause #1: Cookie Not Being Sent (Most Likely)
When `window.location.href` triggers a new page load, the browser might not include the cookie that was just set in the previous response.

**Why**: Cookies set via `Set-Cookie` header might not be immediately available for the next request, especially if:
- The cookie domain doesn't match
- The cookie path is wrong
- The cookie is being set but not persisted
- Browser security restrictions

### Cause #2: Session Not Yet in Database
The session insert might not be committed to the database before the middleware query runs.

**Why**: Database write might be async or delayed.

### Cause #3: Cookie Value Mismatch
The cookie value being sent doesn't match what's in the database.

**Why**: Encoding issues, whitespace, or token generation mismatch.

## The Solution

We need to ensure the cookie is properly set and available before navigation. Here are the options:

### Option A: Add Small Delay Before Navigation (Quick Fix)
```typescript
if (response.ok && data.success) {
  // Wait for cookie to be set
  await new Promise(resolve => setTimeout(resolve, 100));
  window.location.href = '/guest/dashboard';
}
```

**Pros**: Simple, quick to test
**Cons**: Hacky, not reliable

### Option B: Verify Cookie Before Navigation (Better)
```typescript
if (response.ok && data.success) {
  // Verify cookie was set
  const cookies = document.cookie;
  if (cookies.includes('guest_session')) {
    window.location.href = '/guest/dashboard';
  } else {
    // Cookie not set, show error
    setFormState(prev => ({
      ...prev,
      loading: false,
      error: 'Session creation failed. Please try again.',
    }));
  }
}
```

**Pros**: More reliable, checks cookie exists
**Cons**: HttpOnly cookies can't be read by JavaScript

### Option C: Use Server-Side Redirect (Best)
Change the API to return a redirect response instead of JSON when called from a form:

```typescript
// In API route
if (contentType.includes('application/x-www-form-urlencoded')) {
  // Set cookie
  response.cookies.set('guest_session', sessionToken, {...});
  
  // Return redirect
  return NextResponse.redirect(new URL('/guest/dashboard', request.url));
}
```

**Pros**: Server handles redirect, cookie guaranteed to be set
**Cons**: Changes API behavior, need to update frontend

### Option D: Fix Cookie Settings (Most Likely Solution)
The cookie settings in the API might be wrong. Check line 160-166 in `app/api/auth/guest/email-match/route.ts`:

```typescript
response.cookies.set('guest_session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',
});
```

**Potential issues**:
- `secure: false` in development might cause issues
- `sameSite: 'lax'` might not work for all scenarios
- Cookie domain not explicitly set

**Fix**:
```typescript
response.cookies.set('guest_session', sessionToken, {
  httpOnly: true,
  secure: false, // Explicitly false in development
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/',
  domain: undefined, // Let browser set domain
});
```

## Recommended Action Plan

### Step 1: Add Debug Logging
Add logging to see what's happening:

```typescript
// In middleware.ts, line 40
const sessionToken = request.cookies.get('guest_session')?.value;
console.log('[Middleware] Guest session cookie:', sessionToken ? 'present' : 'missing');

if (!sessionToken) {
  console.log('[Middleware] No guest session cookie found');
  return redirectToGuestLogin(request);
}

// After database query, line 75
console.log('[Middleware] Sessions found:', sessions?.length || 0);
```

### Step 2: Run Tests with Logging
Run tests and check logs to see:
- Is cookie being set by API?
- Is cookie being sent to middleware?
- Is session found in database?

### Step 3: Apply Fix Based on Logs
- If cookie not set → Fix API cookie settings
- If cookie not sent → Fix cookie domain/path
- If session not found → Fix database query or timing

## Quick Test

To test if this is the issue, we can temporarily bypass middleware for `/guest/dashboard`:

```typescript
// In middleware.ts, line 110
if (
  pathname.startsWith('/auth') ||
  pathname === '/' ||
  pathname === '/guest/dashboard' || // TEMPORARY - for testing
  pathname.startsWith('/api/auth') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/static')
) {
  return NextResponse.next();
}
```

If tests pass with this change, we know middleware is the issue.

## Expected Results After Fix

- **Navigation tests**: 5 tests should pass (currently failing)
- **Magic link tests**: Still need separate fix for 404 issue
- **Error mapping tests**: Should already work (fixes applied)
- **Total**: Potentially 10-12/16 passing after this fix

---

**Next Step**: Add debug logging and run tests to confirm root cause
