# E2E Authentication Fix: API Cookie Injection (Solution B)

**Status**: ✅ Implemented  
**Date**: 2025-01-XX  
**Approach**: Direct API session cookie injection

## Problem Summary

The E2E global setup was failing because browser-based login wasn't working:
- API authentication via `supabase.auth.signInWithPassword()` worked perfectly
- Browser form login failed (environment variables not accessible in browser)
- Tests couldn't proceed without authenticated browser context

## Solution: API Cookie Injection

Instead of trying to make the browser login work, we now:

1. **Authenticate via API** (already working)
   - Use `supabase.auth.signInWithPassword()` to get session tokens
   - This returns `access_token` and `refresh_token`

2. **Inject cookies directly into browser**
   - Create browser context
   - Add Supabase auth cookies (`sb-access-token`, `sb-refresh-token`)
   - These cookies match what Supabase sets during normal browser login

3. **Verify authentication**
   - Navigate to `/admin` page
   - Check we're not redirected to login
   - Verify admin UI is visible

4. **Save state for tests**
   - Save browser storage state to `.auth/admin.json`
   - All E2E tests use this authenticated state

## Implementation Details

### Cookie Names
Supabase uses these cookie names (as of Supabase Auth v2):
- `sb-access-token`: JWT access token
- `sb-refresh-token`: Refresh token for session renewal

### Cookie Configuration
```typescript
{
  name: 'sb-access-token',
  value: accessToken,
  domain: 'localhost', // or test domain
  path: '/',
  httpOnly: false,     // Supabase cookies are not httpOnly
  secure: false,       // true for HTTPS
  sameSite: 'Lax',
}
```

### Why This Works

1. **Bypasses browser environment issues**
   - No need for browser to access environment variables
   - No form submission complexity
   - No waiting for redirects

2. **Uses working API authentication**
   - API auth already proven to work
   - Gets real session tokens from Supabase
   - Same tokens browser would get from login

3. **Middleware recognizes cookies**
   - Next.js middleware reads these cookies
   - Supabase client validates tokens
   - Authentication works exactly as if user logged in via browser

## Advantages Over Form Login

| Aspect | Form Login (Old) | Cookie Injection (New) |
|--------|------------------|------------------------|
| Reliability | ❌ Fails (env vars) | ✅ Works (API tokens) |
| Speed | Slower (form + redirect) | Faster (direct injection) |
| Debugging | Complex (form, redirect, errors) | Simple (API response) |
| Maintenance | Fragile (UI changes break it) | Robust (API stable) |

## Testing the Fix

Run the E2E global setup:
```bash
npx playwright test --project=chromium --grep="@smoke"
```

Expected output:
```
🚀 E2E Global Setup Starting...

📊 Verifying test database connection...
✅ Test database connected

🧹 Cleaning up test data...
✅ Test data cleaned

🌐 Verifying Next.js server...
✅ Next.js server is running

🔐 Setting up admin authentication...
   Authenticating via Supabase API...
   ✅ API authentication successful (User ID: xxx)
   Injecting session cookies into browser...
   ✅ Session cookies injected
   Verifying authentication...
   Current URL: http://localhost:3000/admin
   ✅ Admin UI is visible
   ✅ Authentication verified
   Logged in as: admin@test.com
   Auth state saved to: .auth/admin.json
✅ Admin authentication saved

✨ E2E Global Setup Complete!
```

## Troubleshooting

### If authentication still fails:

1. **Check cookie names**
   - Supabase may change cookie names in future versions
   - Check browser DevTools → Application → Cookies after manual login
   - Update cookie names in global-setup.ts if needed

2. **Check middleware**
   - Ensure middleware reads cookies correctly
   - Check `middleware.ts` for cookie parsing logic
   - Verify Supabase client configuration

3. **Check domain**
   - Cookie domain must match test URL
   - Use `localhost` for local testing
   - Use actual domain for deployed tests

4. **Check token expiry**
   - Access tokens expire (default: 1 hour)
   - Tests should complete within token lifetime
   - Consider refreshing tokens for long test runs

## Next Steps

1. ✅ Implement cookie injection (DONE)
2. ⏳ Test with location hierarchy E2E test
3. ⏳ Verify all E2E tests pass with new auth
4. ⏳ Document cookie refresh strategy if needed
5. ⏳ Add monitoring for auth failures

## Related Files

- `__tests__/e2e/global-setup.ts` - Authentication setup
- `playwright.config.ts` - Uses `.auth/admin.json`
- `middleware.ts` - Reads auth cookies
- `.env.e2e` - Environment variables

## References

- [Supabase Auth Cookies](https://supabase.com/docs/guides/auth/server-side/cookies)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [E2E_GLOBAL_SETUP_AUTH_FIX_STATUS.md](./E2E_GLOBAL_SETUP_AUTH_FIX_STATUS.md)
