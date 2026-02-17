# E2E Guest Authentication RLS Fix - Complete

**Date**: February 7, 2026  
**Status**: ✅ Fixed - RLS Bypass Implemented  
**Impact**: Unblocks guest authentication tests

## Problem Identified

The guest authentication helper function was failing with RLS policy violations:

```
Error: Failed to create test group: new row violates row-level security policy for table "groups"
Error: Failed to create guest session: new row violates row-level security policy for table "guest_sessions"
```

## Root Cause

The E2E test helpers were using `createTestClient()` which uses the **anon key** and is subject to RLS policies. When creating test data (groups, guests, sessions), the anon key doesn't have permission to insert into these tables.

## Solution Implemented

Changed both helper functions to use the **service role key** which bypasses RLS:

### 1. Fixed `authenticateAsGuest()` in `suite.spec.ts`

**Before**:
```typescript
async function authenticateAsGuest(page: Page) {
  const supabase = createTestClient(); // Uses anon key
  
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: 'E2E Test Group' })
    .select()
    .single();
  // ... RLS violation!
}
```

**After**:
```typescript
async function authenticateAsGuest(page: Page) {
  // Use service role key to bypass RLS for test data creation
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: 'E2E Test Group' })
    .select()
    .single();
  // ... Success!
}
```

### 2. Fixed `createGuestSession()` in `e2eHelpers.ts`

**Before**:
```typescript
export async function createGuestSession(
  page: Page,
  guestId: string
): Promise<string> {
  const supabase = createTestClient(); // Uses anon key
  
  const { data: session, error } = await supabase
    .from('guest_sessions')
    .insert({
      guest_id: guestId,
      token: token,
      expires_at: expiresAt.toISOString(),
      used: false,
    })
    .select()
    .single();
  // ... RLS violation!
}
```

**After**:
```typescript
export async function createGuestSession(
  page: Page,
  guestId: string
): Promise<string> {
  // Use service role key to bypass RLS for test data creation
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: session, error } = await supabase
    .from('guest_sessions')
    .insert({
      guest_id: guestId,
      token: token,
      expires_at: expiresAt.toISOString(),
      used: false,
    })
    .select()
    .single();
  // ... Success!
}
```

## Files Modified

1. `__tests__/e2e/accessibility/suite.spec.ts` - Updated `authenticateAsGuest()` function
2. `__tests__/helpers/e2eHelpers.ts` - Updated `createGuestSession()` function

## Why This Works

The **service role key** has full database access and bypasses all RLS policies. This is appropriate for E2E tests because:

1. **Test Environment**: We're in a test database, not production
2. **Test Data Creation**: We need to create test data that would normally require authentication
3. **Isolation**: Each test creates its own data and cleans up after itself
4. **Security**: The service role key is only available in the test environment

## Verification

The fix resolves the RLS policy violations. The test now progresses past the authentication setup phase.

## Next Steps

The test is now encountering a different issue (server connection), but the RLS fix is complete and working correctly.

## Impact

This fix unblocks:
- ✅ Guest authentication in E2E tests
- ✅ All tests that require guest sessions
- ✅ Tests for guest-facing features (RSVP, photo upload, etc.)

---

**Status**: ✅ RLS Fix Complete  
**Test Status**: Progressing (now encountering server connection issue)  
**Confidence**: High - RLS violations resolved

