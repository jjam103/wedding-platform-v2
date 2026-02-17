# E2E Phase 5: Guest API Authentication Issue - Root Cause Found!

## Status: 🔍 CRITICAL ISSUE IDENTIFIED

### Test Results: 7/15 passing (47%) - MAJOR PROGRESS!

**Passing tests:**
1. ✅ should successfully authenticate with email matching
2. ✅ should show error for non-existent email
3. ✅ should show error for invalid email format
4. ✅ should create session cookie on successful authentication
5. ✅ should show error for invalid or missing token
6. ✅ should complete logout flow
7. ✅ should switch between authentication tabs

**Failing tests:**
1. ❌ should show loading state during authentication (test timing issue)
2. ❌ should successfully request and verify magic link (magic link not implemented)
3. ❌ should show success message after requesting magic link (magic link not implemented)
4. ❌ should show error for expired magic link (test expectation mismatch)
5. ❌ should show error for already used magic link (magic link not implemented)
6. ❌ should persist authentication across page refreshes (API auth issue)
7. ❌ should handle authentication errors gracefully (test expectation mismatch)
8. ❌ should log authentication events in audit log (audit logs schema issue)

## Critical Issue Discovered

### The Problem: Guest API Routes Using Wrong Authentication

**Error message:**
```
Failed to parse cookie string: SyntaxError: Unexpected token 'b', "base64-eyJ"... is not valid JSON
    at JSON.parse (<anonymous>)
    at GET (app/api/guest/events/route.ts:22:46)
  20 |     // 1. AUTHENTICATION
  21 |     const cookieStore = await cookies();
> 22 |     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
```

**Root cause:**
Guest API routes are using `createRouteHandlerClient` and `supabase.auth.getSession()` to check authentication. This is WRONG because:

1. **Guests don't have Supabase Auth sessions** - They use custom `guest_session` cookies
2. **Middleware correctly validates guest sessions** - Uses `guest_sessions` table
3. **API routes try to use Supabase Auth** - Fails because no Supabase Auth session exists
4. **Result**: API returns 401 even though guest is authenticated

### The Flow (Current - BROKEN)

```
1. Guest logs in
   → API creates guest_session cookie ✅
   → Stores session in guest_sessions table ✅

2. Guest navigates to /guest/dashboard
   → Middleware checks guest_session cookie ✅
   → Validates in guest_sessions table ✅
   → Allows access ✅
   → Dashboard page renders ✅

3. Dashboard calls /api/guest/events
   → Middleware checks guest_session cookie ✅
   → Validates in guest_sessions table ✅
   → Allows request to reach API route ✅
   → API route tries to use supabase.auth.getSession() ❌
   → No Supabase Auth session exists ❌
   → API returns 401 UNAUTHORIZED ❌
```

### The Solution

Guest API routes should use the SAME authentication pattern as:
- Middleware (`middleware.ts`)
- Guest layout (`app/guest/layout.tsx`)
- Guest dashboard page (`app/guest/dashboard/page.tsx`)

**Correct pattern:**
```typescript
export async function GET(request: Request) {
  try {
    // 1. Get guest session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('guest_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Validate session using service role client
    const supabase = createSupabaseClient(); // Service role, not route handler client
    
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('guest_id, expires_at')
      .eq('token', sessionToken)
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }
    
    // 3. Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
        { status: 401 }
      );
    }
    
    // 4. Get guest by ID
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', session.guest_id)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // 5. Now use guest data for business logic
    // ... rest of API logic ...
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

## Files That Need Fixing

### Guest API Routes Using Wrong Auth (ALL need fixing):
1. `app/api/guest/events/route.ts` ❌
2. `app/api/guest/rsvps/route.ts` ❌ (GET and POST)
3. `app/api/guest/wedding-info/route.ts` ❌
4. `app/api/guest/announcements/route.ts` ❌
5. `app/api/guest/activities/route.ts` ❌
6. `app/api/guest/activities/[slug]/route.ts` ❌
7. `app/api/guest/events/[slug]/route.ts` ❌
8. `app/api/guest/itinerary/route.ts` ❌
9. `app/api/guest/itinerary/pdf/route.ts` ❌
10. `app/api/guest/rsvps/summary/route.ts` ❌
11. `app/api/guest/rsvps/[id]/route.ts` ❌
12. `app/api/guest/family/route.ts` ❌
13. `app/api/guest/family/[id]/route.ts` ❌
14. `app/api/guest/content-pages/route.ts` ❌
15. `app/api/guest/content-pages/[slug]/route.ts` ❌
16. `app/api/guest/profile/route.ts` ❌ (GET and PUT)

### Reference Files (Correct Pattern):
- `middleware.ts` ✅
- `app/guest/layout.tsx` ✅
- `app/guest/dashboard/page.tsx` ✅
- `app/api/guest-auth/email-match/route.ts` ✅ (creates sessions)

## Why This Wasn't Caught Earlier

1. **Middleware passes authentication** - So routes are reachable
2. **Routes check wrong auth** - Try to use Supabase Auth instead of guest sessions
3. **Tests didn't call API routes directly** - Only tested pages, not API endpoints
4. **Dashboard works** - Because it doesn't call these API routes in the test

## Next Steps

### Immediate (This Session)
1. ⏳ **Create helper function** for guest session validation
2. ⏳ **Fix all 16 guest API routes** to use correct authentication
3. ⏳ **Run E2E tests** to verify fix
4. ⏳ **Document pattern** for future guest API routes

### Short-term (Next Session)
1. Apply audit logs migration (or document workaround)
2. Fix magic link implementation (currently returns 404)
3. Update test expectations for error messages
4. Verify all 15 tests pass

## Key Learnings

### 1. Consistent Authentication Across All Layers
**Rule**: If middleware uses custom sessions, ALL downstream code must use the same pattern

- ✅ Middleware: Custom guest sessions
- ✅ Layout: Custom guest sessions
- ✅ Pages: Custom guest sessions
- ❌ API routes: Trying to use Supabase Auth (WRONG!)

### 2. Don't Mix Authentication Methods
**Rule**: Never mix Supabase Auth and custom sessions in the same flow

- Supabase Auth is for admin users
- Custom guest sessions are for guests
- Never try to use both for the same user

### 3. Service Role for Session Validation
**Rule**: Always use service role client for session validation

```typescript
// ✅ CORRECT
const supabase = createSupabaseClient(); // Service role

// ❌ WRONG
const supabase = createRouteHandlerClient({ cookies }); // Route handler client
```

### 4. Test API Routes Directly
**Rule**: E2E tests should call API routes directly, not just test pages

This issue would have been caught if tests called `/api/guest/events` directly instead of just loading the page.

## Confidence Level: VERY HIGH

**Why we're confident:**

1. ✅ Root cause clearly identified
2. ✅ Error message is explicit
3. ✅ We have working examples (middleware, layout, dashboard)
4. ✅ Fix is straightforward - use same pattern everywhere
5. ✅ 7/15 tests already passing (47%)

**After fixing guest API authentication, we expect 10-12/15 tests to pass (67-80%).**

## Quick Reference

### Guest Authentication Pattern (CORRECT)
```typescript
// 1. Get session token from cookie
const cookieStore = await cookies();
const sessionToken = cookieStore.get('guest_session')?.value;

// 2. Create service role client
const supabase = createSupabaseClient();

// 3. Validate session
const { data: session } = await supabase
  .from('guest_sessions')
  .select('guest_id, expires_at')
  .eq('token', sessionToken)
  .single();

// 4. Check expiration
if (new Date(session.expires_at) < new Date()) {
  // Session expired
}

// 5. Get guest by ID
const { data: guest } = await supabase
  .from('guests')
  .select('*')
  .eq('id', session.guest_id)
  .single();
```

### Files Using Correct Pattern
- `middleware.ts`
- `app/guest/layout.tsx`
- `app/guest/dashboard/page.tsx`
- `app/api/guest-auth/email-match/route.ts`

### Files Using WRONG Pattern (Need Fixing)
- All 16 guest API routes in `app/api/guest/`

---

## Summary

We've made MAJOR progress:
- ✅ Fixed Next.js 16 async cookies issue
- ✅ 7/15 tests passing (47%)
- ✅ Guest authentication flow works
- ✅ Dashboard accessible
- 🔍 **Identified critical issue**: Guest API routes using wrong authentication

**Next action**: Fix all guest API routes to use custom guest session validation instead of Supabase Auth.
