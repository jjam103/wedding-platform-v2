# E2E Guest Auth - Email Matching Root Cause Analysis

## Test 4: Email Matching Authentication FAILURE

**Status:** FAILING (Page stays on `/auth/guest-login`, doesn't redirect to `/guest/dashboard`)

## Root Cause Identified

The email matching authentication flow has a **timing/race condition issue** between:
1. Cookie being set by the API
2. Client-side redirect executing
3. Middleware validating the session

### Current Flow (BROKEN):

```
1. User submits form → fetch('/api/guest-auth/email-match')
2. API creates session in DB → returns JSON { success: true } + sets cookie
3. Client receives response → executes window.location.href = '/guest/dashboard'
4. Browser navigates to /guest/dashboard
5. Middleware checks cookie → ❌ FAILS (cookie not yet available or session not committed)
6. Middleware redirects back to /auth/guest-login
7. User sees login page again (STUCK)
```

### Why This Happens:

**Issue 1: Cookie Timing**
- API sets cookie in response headers
- Client-side redirect happens immediately after receiving response
- Browser may not have processed/stored the cookie yet
- Next navigation doesn't include the cookie

**Issue 2: Database Transaction Timing**
- Session inserted into `guest_sessions` table
- API returns immediately
- Database transaction may not be fully committed
- Middleware query runs before commit completes
- Middleware finds 0 sessions → redirects to login

**Issue 3: No Delay for Cookie/DB Propagation**
- Current code has 200ms delay, but it's not enough
- Need to ensure both cookie AND database are ready

## Evidence from Logs:

```
[API] Setting guest session cookie: { tokenPrefix: '...', guestId: '...' }
[Middleware] Guest auth check: { hasCookie: false, path: '/guest/dashboard' }
[Middleware] No guest session cookie found - redirecting to login
```

## Solution:

Add proper delays and verification before redirect:
1. Increase delay to 500ms (allow DB commit + cookie propagation)
2. Verify cookie is set before redirecting
3. Add retry logic if cookie not immediately available
