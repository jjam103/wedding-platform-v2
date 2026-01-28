# Next.js 15+ Compatibility Fix - Progress Report

**Date:** January 26, 2026  
**Issue:** Next.js 15+ requires `cookies()` to be awaited  
**Status:** 🔄 IN PROGRESS

## Problem Summary

Next.js 15+ introduced a breaking change where the `cookies()` API now returns a Promise that must be awaited. This causes all API routes using the old pattern `createRouteHandlerClient({ cookies })` to fail with:

```
Error: Route used `cookies().get`. `cookies()` returns a Promise 
and must be unwrapped with `await` or `React.use()` before accessing its properties.
```

## Solution Approach

1. ✅ Created helper utility: `lib/supabaseServer.ts`
2. ✅ Implemented `createAuthenticatedClient()` function
3. 🔄 Updating all API routes to use new pattern

## Files Fixed

### Helper Utility
- ✅ `lib/supabaseServer.ts` - Created new helper for async cookies handling

### Admin API Routes
- ✅ `app/api/admin/photos/pending-count/route.ts`
- ✅ `app/api/admin/guests/route.ts` (GET + POST)
- ✅ `app/api/admin/events/route.ts` (GET + POST)
- ✅ `app/api/admin/activities/route.ts` (GET + POST)
- ✅ `app/api/admin/metrics/route.ts` (already fixed)
- ✅ `app/api/admin/alerts/route.ts` (already fixed)

### Routes Still Needing Fix
- ⏳ `app/api/admin/guests/[id]/route.ts` (GET, PUT, DELETE)
- ⏳ `app/api/admin/events/[id]/route.ts` (GET, PUT, DELETE)
- ⏳ `app/api/admin/activities/[id]/route.ts` (GET, PUT, DELETE)
- ⏳ `app/api/admin/activities/[id]/capacity/route.ts` (GET)
- ⏳ `app/api/admin/photos/route.ts` (GET)
- ⏳ `app/api/admin/photos/[id]/route.ts` (GET, PUT, DELETE)
- ⏳ `app/api/admin/photos/[id]/moderate/route.ts` (POST)
- ⏳ `app/api/admin/emails/route.ts` (GET)
- ⏳ `app/api/admin/emails/send/route.ts` (POST)
- ⏳ `app/api/admin/emails/templates/route.ts` (GET)
- ⏳ `app/api/admin/vendors/route.ts` (GET, POST)
- ⏳ `app/api/admin/vendors/[id]/route.ts` (GET, PUT, DELETE)
- ⏳ `app/api/admin/groups/route.ts` (GET)
- ⏳ `app/api/admin/locations/route.ts` (GET)
- ⏳ `app/api/admin/settings/route.ts` (GET, PUT)
- ⏳ `app/api/admin/audit-logs/route.ts` (GET)

### Guest API Routes
- ⏳ `app/api/guest/activities/list/route.ts`
- ⏳ `app/api/guest/events/list/route.ts`
- ⏳ `app/api/guest/events/route.ts`
- ⏳ `app/api/guest/family/[id]/route.ts`
- ⏳ `app/api/guest/photos/upload/route.ts`
- ⏳ `app/api/guest/rsvp/route.ts`
- ⏳ `app/api/guest/rsvps/route.ts`
- ⏳ `app/api/guest/transportation/route.ts`

### Auth API Routes
- ⏳ `app/api/auth/create-user/route.ts`

## Pattern Changes

### Old Pattern (Broken in Next.js 15+)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  // ... rest of code
}
```

### New Pattern (Next.js 15+ Compatible)
```typescript
import { createAuthenticatedClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = await createAuthenticatedClient();
  // ... rest of code
}
```

## Current Status

### Working Routes
- ✅ `/api/admin/metrics` - Returns 200
- ✅ `/api/admin/alerts` - Returns 200
- ✅ `/api/admin/guests` - Fixed (GET, POST)
- ✅ `/api/admin/events` - Fixed (GET, POST)
- ✅ `/api/admin/activities` - Fixed (GET, POST)

### Still Failing
- ❌ `/api/admin/photos/pending-count` - Returns 500 (needs investigation)

## Next Steps

1. Continue fixing remaining admin API routes
2. Fix all guest API routes
3. Fix auth API routes
4. Test all routes to verify they work
5. Update middleware if needed
6. Run full test suite
7. Document changes

## Testing

To verify fixes are working:
```bash
# Check server logs
# Look for 200 status codes instead of 500 errors
# No more "cookies() returns a Promise" errors

# Test in browser
# Navigate to /admin pages
# Check browser console for API errors
# Verify pages load correctly
```

## Estimated Completion

- **Routes Fixed:** 6/32 (19%)
- **Estimated Time:** 30-45 minutes to fix all remaining routes
- **Priority:** HIGH (blocking all page loads)

## Notes

- The helper utility `createAuthenticatedClient()` handles all cookie operations internally
- No changes needed to authentication logic or authorization rules
- Response formats remain unchanged
- All existing tests should pass after fixes are complete
