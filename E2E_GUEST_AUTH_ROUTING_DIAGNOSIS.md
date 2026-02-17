# E2E Guest Authentication - Routing Diagnosis

## Issue: Magic Link Routes Returning 404

**Date**: February 5, 2026  
**Status**: INVESTIGATING

## Current State

The flattened magic link routes exist but Next.js is not recognizing them:

```
✅ app/api/auth/guest/magic-link-request/route.ts (exists)
✅ app/api/auth/guest/magic-link-verify/route.ts (exists)
❌ POST /api/auth/guest/magic-link-request → 404
❌ GET /api/auth/guest/magic-link-verify → 404
```

## Actions Taken

1. ✅ Killed all Next.js processes (`pkill -9 -f "next"`)
2. ✅ Cleared Next.js cache (`rm -rf .next .swc`)
3. ✅ Verified flattened routes exist
4. ✅ Added debug logging to routes
5. 🔄 Running test to check if routes are loaded

## Debug Logging Added

Added console.log statements to both routes:
- `magic-link-request/route.ts`: Logs when route is loaded and when POST is called
- `magic-link-verify/route.ts`: Logs when route is loaded and when GET is called

## Expected Behavior

If routes are properly loaded, we should see in server logs:
```
🔗 Magic link request route loaded at /api/auth/guest/magic-link-request
🔗 Magic link verify route loaded at /api/auth/guest/magic-link-verify
```

When routes are called:
```
🔗 Magic link request POST called
🔗 Magic link verify GET called
```

## Next Steps

1. Check server logs for debug messages
2. If routes are not loaded → Next.js routing issue
3. If routes are loaded but not called → Frontend calling wrong endpoints
4. If routes are called but return 404 → Route handler issue

## Test Results

Running E2E tests to capture server logs...
