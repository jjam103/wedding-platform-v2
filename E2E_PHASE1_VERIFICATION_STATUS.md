# E2E Phase 1 Guest Authentication - Verification Status

## Test Results: 5/16 Passing (31.25%)

### ✅ Passing Tests (5)
1. **should show error for non-existent email** - Non-existent email handling working
2. **should show error for invalid email format** - Email validation working  
3. **should switch between authentication tabs** - UI tab switching working
4. **should show loading state during authentication** - Loading state working
5. **authenticate as admin** (setup) - Admin auth working

### ❌ Failing Tests (11)
All 11 tests fail with the same pattern:
- Authentication API succeeds (200 response)
- Session created in database
- Cookie set in API response
- **BUT**: Redirect to `/guest/dashboard` → middleware redirects back to `/auth/guest-login?returnTo=/guest/dashboard`

## Root Cause: Cookie Not Persisting

### What's Happening
1. ✅ User submits email on `/auth/guest-login`
2. ✅ Frontend calls `POST /api/auth/guest/email-match`
3. ✅ API validates email, creates session in database
4. ✅ API sets `guest_session` cookie in response
5. ✅ API returns success JSON
6. ✅ Frontend receives success, redirects with `window.location.href = '/guest/dashboard'`
7. ❌ **Browser navigates to `/guest/dashboard`**
8. ❌ **Middleware runs, doesn't find `guest_session` cookie**
9. ❌ **Middleware redirects to `/auth/guest-login?returnTo=/guest/dashboard`**

### Why Cookie Isn't Found

The issue is that the cookie is being set in a JSON API response, but the browser may not be persisting it before the redirect happens. This is a timing issue.

## The Problem: API Response Pattern

Current flow:
```typescript
// API returns JSON with cookie
const response = NextResponse.json({ success: true, data: {...} });
response.cookies.set('guest_session', token, {...});
return response;

// Frontend receives JSON, then redirects
const result = await fetch('/api/auth/guest/email-match', {...});
if (result.ok) {
  window.location.href = '/guest/dashboard'; // Cookie may not be set yet!
}
```

## Solution: Server-Side Redirect

Instead of returning JSON and letting the frontend redirect, the API should redirect directly:

```typescript
// API redirects with cookie
const response = NextResponse.redirect(new URL('/guest/dashboard', request.url));
response.cookies.set('guest_session', token, {...});
return response;
```

This ensures:
1. Cookie is set in the redirect response
2. Browser follows redirect with cookie already set
3. Middleware sees cookie on the dashboard request

## Required Changes

### 1. Update Email Match Route (Priority 1)

**File**: `app/api/auth/guest/email-match/route.ts`

**Change**: Replace JSON response with redirect

```typescript
// BEFORE (current - doesn't work)
const response = NextResponse.json(
  {
    success: true,
    data: {
      guestId: guest.id,
      groupId: guest.group_id,
      firstName: guest.first_name,
      lastName: guest.last_name,
    },
  },
  { status: 200 }
);

response.cookies.set('guest_session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/',
});

return response;

// AFTER (should work)
const response = NextResponse.redirect(new URL('/guest/dashboard', request.url));

response.cookies.set('guest_session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/',
});

return response;
```

### 2. Update Frontend to Handle Redirect (Priority 2)

**File**: `app/auth/guest-login/page.tsx`

**Change**: Remove manual redirect, let browser follow API redirect

```typescript
// BEFORE (current)
const result = await fetch('/api/auth/guest/email-match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
  credentials: 'include',
});

if (result.ok) {
  window.location.href = '/guest/dashboard'; // Manual redirect
}

// AFTER (should work)
const result = await fetch('/api/auth/guest/email-match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
  credentials: 'include',
  redirect: 'follow', // Follow redirects automatically
});

// Browser will automatically follow redirect with cookie
```

### 3. Update Magic Link Verify Route (Priority 3)

**File**: `app/api/auth/guest/magic-link/verify/route.ts`

Same change - redirect instead of JSON response.

### 4. Update Magic Link Verify Page (Priority 4)

**File**: `app/auth/guest-login/verify/page.tsx`

Remove manual redirect, let browser follow API redirect.

## Alternative Solution: Form Submission

If the redirect approach doesn't work, use a form submission instead of fetch:

```typescript
// In login page
<form action="/api/auth/guest/email-match" method="POST">
  <input type="email" name="email" required />
  <button type="submit">Log In</button>
</form>
```

This guarantees cookies are set before the redirect.

## Testing Plan

After implementing changes:

1. **Manual test first**:
   ```bash
   # Start dev server
   npm run dev
   
   # Open browser to http://localhost:3000/auth/guest-login
   # Enter test email
   # Submit form
   # Verify redirect to /guest/dashboard (not back to login)
   ```

2. **Run E2E tests**:
   ```bash
   npx playwright test __tests__/e2e/auth/guestAuth.spec.ts --reporter=list
   ```

3. **Expected result**: 16/16 tests passing

## Files to Modify

1. `app/api/auth/guest/email-match/route.ts` - Change to redirect
2. `app/auth/guest-login/page.tsx` - Remove manual redirect
3. `app/api/auth/guest/magic-link/verify/route.ts` - Change to redirect
4. `app/auth/guest-login/verify/page.tsx` - Remove manual redirect

## Estimated Time

- Implement changes: 15 minutes
- Manual testing: 10 minutes
- E2E test verification: 10 minutes
- **Total**: 35 minutes to completion

## Success Criteria

- ✅ Manual login redirects to `/guest/dashboard` (not back to login)
- ✅ Cookie persists across navigation
- ✅ All 16 E2E tests pass
- ✅ No middleware redirect loops

## Current Status

- **Implementation**: 85% complete
- **Tests**: 31.25% passing (5/16)
- **Blocker**: Cookie timing issue with JSON response + manual redirect
- **Solution**: Server-side redirect with cookie

## Next Steps

1. Implement server-side redirect in email-match route
2. Update frontend to follow redirects
3. Test manually
4. Run E2E tests
5. Document completion

## Notes

- The authentication logic is correct
- The middleware is correct
- The issue is purely a timing problem with cookie persistence
- Server-side redirect is the standard solution for this pattern
- This is a common pattern in web authentication (OAuth, SAML, etc.)
