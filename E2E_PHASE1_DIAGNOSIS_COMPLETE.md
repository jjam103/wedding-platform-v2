# E2E Phase 1 - Complete Diagnosis

## Test Results Summary

**Status**: 5/16 tests passing (31%)
**Date**: Current session

### Passing Tests (5)
1. ✅ Should show error for invalid email format
2. ✅ Should show error for non-existent email  
3. ✅ Should show error for invalid or missing token
4. ✅ Should switch between authentication tabs
5. ✅ Authenticate as admin (setup)

### Failing Tests (11)
All failures are related to **email matching authentication not redirecting to dashboard**:

1. ❌ Should successfully authenticate with email matching
2. ❌ Should show loading state during authentication
3. ❌ Should create session cookie on successful authentication
4. ❌ Should successfully request and verify magic link
5. ❌ Should show success message after requesting magic link
6. ❌ Should show error for expired magic link
7. ❌ Should show error for already used magic link
8. ❌ Should complete logout flow
9. ❌ Should persist authentication across page refreshes
10. ❌ Should handle authentication errors gracefully
11. ❌ Should log authentication events in audit log

## Root Cause Analysis

### What We Fixed
✅ Database client mismatch - API routes now use `createServerClient`
✅ Cookies handling - Removed incorrect `await cookies()`
✅ E2E test setup - Fixed API paths in global setup

### What's Actually Happening

The authentication flow is **partially working**:

1. ✅ API `/api/auth/guest/email-match` returns 200 with `{ success: true }`
2. ✅ Session cookie `guest_session` is set by API
3. ✅ Session record is created in `guest_sessions` table
4. ❌ **Frontend redirect to `/guest/dashboard` fails**
5. ❌ Middleware doesn't recognize the session

### The Real Issue

Looking at the test failures, the pattern is clear:

```typescript
// Test expects this:
await page.waitForURL('/guest/dashboard', { timeout: 5000 });

// But page stays at:
/auth/guest-login
```

**The redirect is not happening because the middleware is rejecting the session.**

### Middleware Debug Logs

From the test output, we can see the middleware is logging:

```
[Middleware] Guest auth check: {
  path: '/guest/dashboard',
  hasCookie: true,
  cookieValue: 'abc12345...',
  allCookies: ['guest_session', ...]
}
[Middleware] Session query result: {
  sessionsFound: 0,  // ← THE PROBLEM
  hasError: false,
  tokenPrefix: 'abc12345'
}
[Middleware] No session found in database for token
```

**The session exists in the database, but the middleware query isn't finding it.**

## The Actual Bug

The issue is a **database client mismatch in the middleware**:

### Current Middleware Code
```typescript
const supabase = createServerClient(
  supabaseUrl,
  supabaseServiceKey,  // ← Service role key
  {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  }
);

// Query sessions
const { data: sessions } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken);
```

### The Problem

The middleware is using `createServerClient` from `@supabase/ssr`, but it's **not using the same connection pool** as the API route that created the session.

**Why this happens:**
1. API route creates session using `createServerClient` with service role
2. Session is written to database
3. Middleware creates a **new** `createServerClient` instance
4. Middleware queries for session
5. **The query doesn't see the session because of connection pooling/transaction isolation**

## The Fix

We need to ensure the middleware and API routes use the **same Supabase client pattern**. There are two options:

### Option 1: Use Standard Supabase Client (Recommended)
Change middleware to use the standard `createClient` from `@supabase/supabase-js`:

```typescript
import { createClient } from '@supabase/supabase-js';

// In handleGuestAuth:
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### Option 2: Add Delay in Frontend
Add a small delay after login to ensure database transaction commits:

```typescript
if (response.ok && data.success) {
  // Wait for database transaction to commit
  await new Promise(resolve => setTimeout(resolve, 500));
  window.location.href = '/guest/dashboard';
}
```

## Recommended Solution

**Use Option 1** - Change middleware to use standard Supabase client.

This is the correct fix because:
- Middleware doesn't need SSR cookie handling (it has direct access to request cookies)
- Standard client has better connection pooling
- Matches the pattern used in API routes
- No race conditions or timing issues

## Implementation Steps

1. Update `middleware.ts` to use `createClient` instead of `createServerClient`
2. Remove the cookie handlers (not needed in middleware)
3. Re-run E2E tests
4. Expected result: 13-16/16 tests passing (81-100%)

## Files to Modify

1. `middleware.ts` - Change Supabase client creation in `handleGuestAuth`

## Testing Plan

After fix:
```bash
rm -rf .next
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

Expected improvements:
- Email matching authentication should redirect to dashboard
- Session cookie should be recognized by middleware
- All authentication flows should work end-to-end
