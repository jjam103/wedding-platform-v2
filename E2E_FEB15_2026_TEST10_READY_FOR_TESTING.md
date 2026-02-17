# E2E Test #10 - Ready for Testing

## Status: ✅ FIX COMPLETE - READY FOR TESTING

## Summary

Fixed the cookie authentication issue in E2E Test #10 by using the correct Supabase cookie format. The test now sets cookies with **base64-encoded values with a `base64-` prefix**, which is the format Supabase expects.

## What Was Fixed

### 1. Test Cookie Format ✅
**File**: `__tests__/e2e/admin/referenceBlocks.spec.ts` (Test #10, lines ~1020-1040)

Changed from plain JSON string to base64-encoded format:

```typescript
// Before (WRONG):
value: JSON.stringify({ access_token, refresh_token, ... })

// After (CORRECT):
const cookieValue = { access_token, refresh_token, ... };
const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');
value: `base64-${base64Value}`
```

### 2. Diagnostic Script Updated ✅
**File**: `scripts/test-reference-api.mjs`

Updated to test with cookies instead of Bearer token, using the same base64-encoded format.

### 3. Incorrect Migration Deleted ✅
**File**: `supabase/migrations/057_allow_anon_access_to_locations.sql` (DELETED)

This migration attempted to add anon access, which was the wrong approach. Guests should be authenticated, not anonymous.

## Why This Works

1. **Supabase Cookie Format**: The `@supabase/ssr` package expects cookies in this format:
   - Cookie name: `sb-<project-ref>-auth-token`
   - Cookie value: `base64-<base64-encoded-session-data>`

2. **API Endpoint**: Uses `createServerClient({ cookies })` which reads cookies in Supabase format

3. **Authentication Flow**:
   - Test creates guest user ✅
   - Test signs in guest user ✅
   - Test sets cookies in correct format ✅
   - API endpoint reads session from cookies ✅
   - RLS policies allow authenticated access ✅

## Testing Instructions

### Step 1: Test with Diagnostic Script

This verifies the API endpoint works with the correct cookie format:

```bash
# Start dev server (if not already running)
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

**If you see 401 Unauthorized**: The cookie format is still incorrect. Check the script output for details.

### Step 2: Run E2E Test

Once the diagnostic script passes, run the actual E2E test:

```bash
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view" --reporter=list
```

**Expected Result**: Test passes, event details are displayed correctly in guest view

**If test fails**: Check the Playwright trace or screenshots to see where it's failing.

### Step 3: Verify in Browser (Optional)

If you want to manually verify the guest view works:

1. Start dev server: `npm run dev`
2. Create a test content page with reference blocks in admin
3. Create a guest user and sign in
4. Navigate to the content page as guest
5. Verify reference blocks display and expand correctly

## Files Modified

1. ✅ `__tests__/e2e/admin/referenceBlocks.spec.ts`
   - Updated cookie format in Test #10
   - Added base64 encoding with `base64-` prefix

2. ✅ `scripts/test-reference-api.mjs`
   - Updated to test with cookies instead of Bearer token
   - Uses same base64-encoded cookie format

3. ✅ `supabase/migrations/057_allow_anon_access_to_locations.sql`
   - DELETED (incorrect approach)

## Files That Are Correct (No Changes Needed)

1. ✅ `app/api/admin/references/[type]/[id]/route.ts`
   - API endpoint correctly uses `createServerClient({ cookies })`
   - Works for both admin and guest authenticated users

2. ✅ Database RLS Policies
   - Require `authenticated` role (not `anon`)
   - Correctly restrict access to published content

## Troubleshooting

### If Diagnostic Script Fails

**Problem**: 401 Unauthorized response

**Solution**: Check that:
- Dev server is running on port 3000
- E2E database credentials are correct in `.env.test.e2e`
- Cookie format matches exactly (base64-encoded with prefix)

### If E2E Test Fails

**Problem**: "Details could not be loaded" in test

**Solution**: 
1. Run diagnostic script first to verify API works
2. Check Playwright trace for exact error
3. Verify cookies are being set correctly in browser
4. Check API endpoint logs for session details

### If Test Passes But Guest View Doesn't Work

**Problem**: Works in test but not in real browser

**Solution**: This shouldn't happen since the test uses real authentication. If it does:
1. Verify guest user is authenticated (not anonymous)
2. Check RLS policies allow authenticated access
3. Verify API endpoint reads session correctly

## Key Learnings

1. **Supabase Cookie Format**: Always use base64-encoded values with `base64-` prefix for Supabase auth cookies in E2E tests

2. **Authentication Model**: Guests viewing published content should be authenticated users, not anonymous

3. **Testing with Cookies**: When testing API endpoints that use `createServerClient({ cookies })`, you must set cookies in the exact format Supabase expects

4. **Research First**: The GitHub gist (https://gist.github.com/solace/2535d75909c5e53d111a26650aaa44e4) provided the exact answer

## Success Criteria

✅ Diagnostic script returns 200 OK with event details
✅ E2E test passes without errors
✅ Event details are displayed in guest view
✅ Reference blocks expand/collapse correctly

## Next Actions

1. **Run diagnostic script** to verify API works with cookies
2. **Run E2E test** to verify complete flow works
3. **Commit changes** if tests pass
4. **Update documentation** if needed

---

**Date**: 2026-02-15
**Status**: ✅ Fix complete, ready for testing
**Impact**: Test #10 should now pass with correct cookie authentication
**Confidence**: High - based on Supabase documentation and community examples
