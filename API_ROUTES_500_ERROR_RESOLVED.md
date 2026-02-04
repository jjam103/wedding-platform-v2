# API Routes 500 Error - Resolved

**Date**: January 31, 2026  
**Status**: ✅ Resolved

## Issue

The vendors page was showing 500 errors when fetching activities and events:
- `GET /api/admin/activities?pageSize=1000` - 500 Internal Server Error
- `GET /api/admin/events?pageSize=1000` - 500 Internal Server Error

## Root Cause

The errors were caused by stale server state after environment variable changes. The dev server needed to be restarted to pick up the correct `SUPABASE_SERVICE_ROLE_KEY` value.

## Resolution

**Dev Server Restart**
- Stopped the running dev server (process ID 8)
- Started a new dev server (process ID 9)
- Both API routes now return 200 (success)

## Verification

After restart, the logs show successful requests:
```
GET /api/admin/activities 200 in 839ms
GET /api/admin/events 200 in 840ms
GET /api/admin/activities 200 in 1348ms
```

## Technical Details

### Why the Restart Was Needed

The activity and event services use the service role key directly:
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

When the `.env.local` file was updated with the correct service role key, the running dev server still had the old value cached in memory. Node.js loads environment variables at startup, so changes to `.env` files require a restart.

### Service Architecture

Both services follow the same pattern:
1. Validate input with Zod schema
2. Create Supabase client with service role key
3. Build query with filters
4. Execute database operation
5. Return Result<T> format

### API Route Pattern

Both routes follow API standards:
1. **Authentication** - Verify session with `createAuthenticatedClient()`
2. **Validation** - Parse query parameters
3. **Service Call** - Delegate to service layer
4. **Response** - Return consistent JSON format

## Prevention

To avoid this issue in the future:

1. **Always restart dev server** after changing environment variables
2. **Check environment variables** if services fail with 500 errors
3. **Add better error logging** to identify environment issues quickly

## Enhanced Error Logging

Added more detailed error logging to activities route:
```typescript
console.error('Error details:', {
  message: error instanceof Error ? error.message : 'Unknown',
  stack: error instanceof Error ? error.stack : undefined,
  env: {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
});
```

This will help diagnose similar issues faster in the future.

## Files Involved

- `app/api/admin/activities/route.ts` - Activities API route
- `app/api/admin/events/route.ts` - Events API route
- `services/activityService.ts` - Activity service with service role client
- `services/eventService.ts` - Event service with service role client
- `.env.local` - Environment variables including service role key

## Conclusion

The 500 errors were resolved by restarting the dev server. Both activities and events API routes are now working correctly. The issue was environmental, not a code problem.
