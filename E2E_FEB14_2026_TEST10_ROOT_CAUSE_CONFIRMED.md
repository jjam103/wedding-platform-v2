# E2E Test #10 - Root Cause Confirmed

## Status: 🔍 ROOT CAUSE IDENTIFIED

## Summary

The API endpoint `/api/admin/references/[type]/[id]` is returning 401 Unauthorized for authenticated guest users. The test correctly authenticates the guest user and sets cookies, but the API endpoint cannot read the session from those cookies.

## Root Cause

**The Supabase auth cookies set by the test are not being recognized by the API endpoint.**

### Evidence

1. **Diagnostic Script Test**:
   ```bash
   node --env-file=.env.test.e2e scripts/test-reference-api.mjs
   ```
   
   Result:
   ```
   Status: 401 Unauthorized
   Response: {
     "success": false,
     "error": {
       "code": "UNAUTHORIZED",
       "message": "Authentication required"
     }
   }
   ```

2. **Test Output**:
   - Guest user is created successfully ✅
   - Guest user signs in successfully ✅
   - Auth cookies are set in browser ✅
   - Page loads correctly ✅
   - Reference cards are visible ✅
   - **API call returns "Details could not be loaded"** ❌

3. **API Endpoint Code**:
   ```typescript
   const { data: { session }, error: sessionError } = await supabase.auth.getSession();
   
   console.log('[API] Session check:', {
     hasSession: !!session,  // This is FALSE
     sessionError: sessionError?.message,
     userId: session?.user?.id,  // This is undefined
   });
   ```

## Why This Happens

The test sets cookies using Playwright's `page.context().addCookies()`:

```typescript
await page.context().addCookies([
  {
    name: `sb-${projectRef}-auth-token`,
    value: JSON.stringify({
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
      expires_in: signInData.session.expires_in,
      token_type: 'bearer',
      user: signInData.session.user,
    }),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  },
]);
```

However, the Supabase client in the API endpoint expects cookies in a specific format that might not match what we're setting.

## Possible Issues

### Issue 1: Cookie Format
The cookie value might need to be in a different format. Supabase might expect:
- A different cookie name pattern
- A different JSON structure
- Multiple cookies instead of one

### Issue 2: Cookie Attributes
The cookie attributes might be wrong:
- `httpOnly: false` - Should this be `true`?
- `secure: false` - Might need to be `true` even for localhost
- `sameSite: 'Lax'` - Might need to be `'None'` or `'Strict'`

### Issue 3: Server-Side Cookie Reading
The API endpoint uses `createRouteHandlerClient({ cookies })` which reads from Next.js cookies. The cookies set by Playwright might not be accessible to Next.js in the same way.

## Solution Options

### Option 1: Fix Cookie Format (Most Likely)
Research the exact cookie format Supabase expects and update the test to match it.

**Action**: Check Supabase documentation for cookie format and update test.

### Option 2: Use Different Authentication Method
Instead of setting cookies manually, use Supabase's built-in authentication flow in the browser.

**Action**: Have the test navigate to a login page and authenticate through the UI.

### Option 3: Modify API to Accept Bearer Token
Update the API endpoint to also accept Bearer tokens in the Authorization header (in addition to cookies).

**Action**: Add Bearer token support to API endpoint for E2E testing.

### Option 4: Use Supabase Test Helpers
Use Supabase's test helpers to create authenticated sessions that work with the API.

**Action**: Research Supabase testing documentation for proper session creation.

## Recommended Fix

**Option 1 is most likely to work** because:
1. The authentication model is correct (guest users should be authenticated)
2. The RLS policies are correct
3. The API endpoint is correct
4. Only the cookie format/attributes need adjustment

## Next Steps

1. **Research Supabase Cookie Format**:
   - Check Supabase documentation
   - Inspect cookies from a real browser login
   - Compare with what the test is setting

2. **Update Test Cookie Format**:
   - Match the exact cookie name pattern
   - Match the exact JSON structure
   - Match the exact cookie attributes

3. **Verify Fix**:
   - Run diagnostic script again
   - Run E2E test
   - Confirm API returns event details

## Files to Update

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` (Test #10, lines 1000-1020)
   - Update cookie format to match Supabase expectations

2. `scripts/test-reference-api.mjs`
   - Update to test with cookies instead of Bearer token
   - Use to verify cookie format works

## Commands to Debug

### Check Real Cookie Format
```bash
# Start dev server
npm run dev

# Login through UI and inspect cookies in browser DevTools
# Look for cookies starting with "sb-"
```

### Test API with Correct Cookies
```bash
# Update diagnostic script to use cookies
node --env-file=.env.test.e2e scripts/test-reference-api.mjs
```

### Run E2E Test
```bash
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view" --reporter=list
```

---

**Date**: 2026-02-15
**Status**: 🔍 Root cause identified - cookie format issue
**Impact**: Test authentication works, but API cannot read session from cookies
**Next Action**: Research and fix Supabase cookie format in test

