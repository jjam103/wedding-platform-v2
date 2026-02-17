# E2E Test #10 - Cookie Format Fix Applied

## Status: ✅ FIX APPLIED

## Summary

Fixed the cookie authentication issue in E2E Test #10 by using the correct Supabase cookie format. The cookie value must be **base64-encoded with a `base64-` prefix**, not a plain JSON string.

## Root Cause

The test was setting Supabase auth cookies with a plain JSON string value:

```typescript
// ❌ WRONG - Plain JSON string
value: JSON.stringify({
  access_token: signInData.session.access_token,
  refresh_token: signInData.session.refresh_token,
  // ...
})
```

However, Supabase expects the cookie value to be base64-encoded with a `base64-` prefix:

```typescript
// ✅ CORRECT - Base64-encoded with prefix
const cookieValue = { /* session data */ };
const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');
value: `base64-${base64Value}`
```

## Solution Applied

### 1. Updated Test Cookie Format

**File**: `__tests__/e2e/admin/referenceBlocks.spec.ts` (Test #10, lines ~1020-1040)

**Changes**:
- Create cookie value object
- Base64 encode the JSON string
- Add `base64-` prefix to the encoded value
- Set cookie with correct format

```typescript
// Create the cookie value object
const cookieValue = {
  access_token: signInData.session.access_token,
  refresh_token: signInData.session.refresh_token,
  expires_at: signInData.session.expires_at,
  expires_in: signInData.session.expires_in,
  token_type: 'bearer',
  user: signInData.session.user,
};

// Base64 encode the cookie value (Supabase expects base64-encoded format)
const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');

await page.context().addCookies([
  {
    name: `sb-${projectRef}-auth-token`,
    value: `base64-${base64Value}`,  // Supabase expects "base64-" prefix
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  },
]);
```

### 2. Updated Diagnostic Script

**File**: `scripts/test-reference-api.mjs`

**Changes**:
- Updated to test with cookies instead of Bearer token
- Uses same base64-encoded cookie format as test
- Sends cookie in Cookie header

```typescript
const cookieValue = { /* session data */ };
const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');
const cookieString = `sb-${projectRef}-auth-token=base64-${base64Value}`;

const response = await fetch(url, {
  headers: {
    'Cookie': cookieString,
    'Content-Type': 'application/json',
  },
});
```

## Why This Fix Works

1. **Supabase Cookie Format**: Supabase's `@supabase/ssr` package expects cookies to be base64-encoded with a `base64-` prefix. This is the standard format used by Supabase for storing session data in cookies.

2. **API Endpoint Compatibility**: The API endpoint uses `createServerClient({ cookies })` which reads cookies in the Supabase format. With the correct cookie format, the endpoint can now successfully read the session.

3. **Authentication Flow**: 
   - Test creates guest user ✅
   - Test signs in guest user ✅
   - Test sets cookies in correct format ✅
   - API endpoint reads session from cookies ✅
   - RLS policies allow authenticated access ✅

## Evidence

### Research Source
Found the correct cookie format from this GitHub Gist:
https://gist.github.com/solace/2535d75909c5e53d111a26650aaa44e4

Key code from the gist:
```typescript
export function createSupabaseCookie(userEmail: string, userId: string) {
  return encodeToBase64({
    access_token: createSupabaseToken(userEmail, userId),
    refresh_token: 'refresh_token',
    expires_in: EXPIRES_IN,
    expires_at: Date.now() + EXPIRES_IN,
    token_type: 'bearer',
    user: { /* user data */ },
  });
}

// Cookie is set as:
{
  name: `sb-${SUPABASE_APP_ID}-auth-token`,
  value: `base64-${createSupabaseCookie('test@email', uuid())}`,
  // ...
}
```

## Verification Steps

### 1. Test Diagnostic Script
```bash
# Start dev server
npm run dev

# In another terminal, run diagnostic script
node --env-file=.env.test.e2e scripts/test-reference-api.mjs
```

**Expected Output**:
```
✅ API endpoint working correctly with cookies!
   Event name: API Test Event
   Event description: Test event for API diagnostics
   Location: API Test Location
```

### 2. Run E2E Test
```bash
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view" --reporter=list
```

**Expected Result**: Test passes, event details are displayed correctly

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts`
   - Updated cookie format in Test #10 (lines ~1020-1040)
   - Added base64 encoding with `base64-` prefix

2. `scripts/test-reference-api.mjs`
   - Updated to test with cookies instead of Bearer token
   - Uses same base64-encoded cookie format

## No Changes Needed

The following files are correct and require no changes:

1. ✅ `app/api/admin/references/[type]/[id]/route.ts`
   - API endpoint correctly uses `createServerClient({ cookies })`
   - Works for both admin and guest authenticated users
   - RLS policies handle access control

2. ✅ Database RLS Policies
   - Require `authenticated` role (not `anon`)
   - Correctly restrict access to published content
   - No anon access policies needed

3. ✅ Migration 057
   - This migration was incorrect and should be deleted
   - It attempted to add anon access, which is wrong
   - Guests should be authenticated, not anonymous

## Next Steps

1. **Delete Incorrect Migration**:
   ```bash
   rm supabase/migrations/057_allow_anon_access_to_locations.sql
   ```

2. **Test the Fix**:
   ```bash
   # Run diagnostic script
   node --env-file=.env.test.e2e scripts/test-reference-api.mjs
   
   # Run E2E test
   npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"
   ```

3. **Verify Success**:
   - Diagnostic script shows 200 OK with event details
   - E2E test passes
   - Event details are displayed in guest view

## Key Learnings

1. **Supabase Cookie Format**: Always use base64-encoded values with `base64-` prefix for Supabase auth cookies in E2E tests.

2. **Authentication Model**: Guests viewing published content should be authenticated users, not anonymous. This is the correct security model.

3. **Testing with Cookies**: When testing API endpoints that use `createServerClient({ cookies })`, you must set cookies in the exact format Supabase expects.

4. **Research First**: When facing authentication issues, research the correct format/approach before trying multiple solutions. The GitHub gist provided the exact answer.

---

**Date**: 2026-02-15
**Status**: ✅ Fix applied, ready for testing
**Impact**: Test #10 should now pass with correct cookie authentication
**Next Action**: Run diagnostic script and E2E test to verify fix
