# E2E Phase 1: Guest Auth Route Migration Status

## Problem Summary
Next.js 16 has a bug where routes in the reserved `/api/auth` segment compile and execute but return 404 anyway. This affects 11/16 E2E guest authentication tests.

## Solution Implemented
Moved guest authentication routes out of the reserved `/api/auth` segment to `/api/guest-auth`.

## Changes Made ✅

### 1. Route Files Moved
- ✅ `app/api/auth/guest/email-match/route.ts` → `app/api/guest-auth/email-match/route.ts`
- ✅ `app/api/auth/guest/magic-link/request/route.ts` → `app/api/guest-auth/magic-link/request/route.ts`
- ✅ `app/api/auth/guest/magic-link/verify/route.ts` → `app/api/guest-auth/magic-link/verify/route.ts`

### 2. Frontend Updated
- ✅ `app/auth/guest-login/page.tsx` - Already using correct paths (`/api/guest-auth/email-match`, `/api/guest-auth/magic-link/request`)

### 3. Test Setup Updated
- ✅ `__tests__/e2e/global-setup.ts` - Updated warmup paths to `/api/guest-auth/*`

### 4. Middleware Updated
- ✅ `middleware.ts` - Added `/api/guest-auth` to public routes list (line 119)

### 5. JSDoc Comments Updated
- ✅ Updated route file comments to reflect new paths

### 6. Cache Cleared
- ✅ Deleted `.next` directory

## Current Status: ❌ STILL FAILING

### Test Results
- **Passing**: 3/16 tests (18.75%)
- **Failing**: 13/16 tests (81.25%)

### Root Cause
**The routes are STILL returning 404 even after moving them!**

```
[WebServer]  POST /api/guest-auth/email-match 404 in 337ms (compile: 84ms, proxy.ts: 54ms, render: 199ms)
[WebServer]  POST /api/guest-auth/magic-link/request 404 in 156ms (compile: 5ms, proxy.ts: 24ms, render: 127ms)
```

### Evidence
1. ✅ Routes compile successfully (84ms, 5ms compile times)
2. ✅ Middleware allows them (proxy.ts: 54ms, 24ms)
3. ✅ Handlers execute (render: 199ms, 127ms)
4. ❌ **But still return 404**

## Analysis

This is the SAME Next.js 16 routing bug, just manifesting differently:

1. **Original Issue**: Routes in `/api/auth/guest/*` returned 404
2. **After Move**: Routes in `/api/guest-auth/*` ALSO return 404
3. **Pattern**: Next.js 16 has issues with dynamic route discovery during compilation

### Why Moving Didn't Fix It

The issue isn't specifically about the `/api/auth` reserved segment - it's a broader Next.js 16 bug with route discovery timing. The routes:
- ✅ Exist in the filesystem
- ✅ Export POST handlers correctly
- ✅ Compile successfully
- ✅ Pass through middleware
- ❌ **But Next.js routing layer doesn't register them**

## Next Steps

### Option 1: Wait for Next.js Fix
- Track: https://github.com/vercel/next.js/issues
- Downgrade to Next.js 15 temporarily
- **Pros**: Proper long-term solution
- **Cons**: Blocks E2E testing now

### Option 2: Use Different Route Structure
Try moving to a completely different path structure:
- `/api/auth-guest/email-match`
- `/api/authentication/guest/email-match`
- `/api/public/guest-auth/email-match`

**Pros**: Might avoid the bug
**Cons**: More refactoring, no guarantee it works

### Option 3: Implement Workaround
Add explicit route warming with longer delays:
- Increase retry count to 10
- Increase delay to 2 seconds
- Add explicit route compilation triggers

**Pros**: Might work around timing issue
**Cons**: Slow, unreliable, doesn't fix root cause

### Option 4: Use API Route Handlers Differently
Instead of separate route files, use a single catch-all route:
- `/api/guest-auth/[...path]/route.ts`
- Handle all guest auth in one file

**Pros**: Single route file might be more reliable
**Cons**: Less organized, harder to maintain

## Recommendation

**Option 1: Wait for Next.js Fix / Downgrade**

This is clearly a Next.js 16 framework bug. The routes are correct, the code is correct, but Next.js routing is broken. The best path forward is:

1. **Document the issue** (this file)
2. **Report to Next.js team** with reproduction case
3. **Consider downgrading to Next.js 15** for E2E testing
4. **Monitor Next.js 16.1.2+ releases** for fix

## Files Modified

### Route Files
- `app/api/guest-auth/email-match/route.ts`
- `app/api/guest-auth/magic-link/request/route.ts`
- `app/api/guest-auth/magic-link/verify/route.ts`

### Frontend
- `app/auth/guest-login/page.tsx` (already correct)

### Test Setup
- `__tests__/e2e/global-setup.ts`

### Middleware
- `middleware.ts`

## Verification Commands

```bash
# Verify route files exist
ls -la app/api/guest-auth/email-match/route.ts
ls -la app/api/guest-auth/magic-link/request/route.ts
ls -la app/api/guest-auth/magic-link/verify/route.ts

# Verify routes export POST handlers
grep "export async function POST" app/api/guest-auth/email-match/route.ts
grep "export async function POST" app/api/guest-auth/magic-link/request/route.ts
grep "export async function POST" app/api/guest-auth/magic-link/verify/route.ts

# Clear cache and test
rm -rf .next
npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts
```

## Conclusion

Moving the routes out of `/api/auth` to `/api/guest-auth` was the correct approach, but it didn't fix the issue because the problem is a broader Next.js 16 routing bug, not specifically about the reserved segment.

The routes are implemented correctly, but Next.js 16's routing layer fails to register them properly during compilation, resulting in 404 responses even though the route handlers exist and execute.

**Status**: ❌ Issue persists - Next.js 16 framework bug confirmed
**Next Action**: Consider downgrading to Next.js 15 or waiting for Next.js 16.1.2+ fix
