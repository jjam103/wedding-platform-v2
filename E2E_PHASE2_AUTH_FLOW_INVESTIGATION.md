# E2E Phase 2: Authentication Flow Investigation

## Status: 🔍 Investigating Persistent 404 Errors

### Current Situation

After moving routes from `/api/auth/guest/*` to `/api/guest-auth/*`, the routes are **still returning 404 errors** during E2E tests, even though:

1. ✅ Route files exist in correct locations
2. ✅ Middleware explicitly allows `/api/guest-auth/*` as public routes
3. ✅ Route files have proper exports (`export async function POST`)
4. ✅ Route segment config is present (`export const runtime = 'nodejs'`)
5. ✅ Next.js cache has been cleared

### Test Results

**Current**: 3/16 passing (19%)

**Passing tests**:
- ✅ Should show error for invalid email format (browser validation)
- ✅ Should show error for non-existent email (gets 404 from API)
- ✅ Should show error for invalid or missing token (verify route works)

**Failing tests** (all due to 404 on email-match and magic-link/request routes):
- ❌ Should successfully authenticate with email matching
- ❌ Should create session cookie on successful authentication
- ❌ Should show loading state during authentication
- ❌ Should successfully request and verify magic link
- ❌ Should show success message after requesting magic link
- ❌ Should show error for expired magic link
- ❌ Should show error for already used magic link
- ❌ Should complete logout flow
- ❌ Should persist authentication across page refreshes
- ❌ Should handle authentication errors gracefully
- ❌ Should log authentication events in audit log

### Evidence from Logs

**Route warmup (global setup)**:
```
⏳ Route not ready: /api/guest-auth/email-match (attempt 1/5, got 404)
POST /api/guest-auth/email-match 404 in 2.5s (compile: 2.3s, proxy.ts: 7ms, render: 248ms)
⏳ Route not ready: /api/guest-auth/email-match (attempt 2/5, got 404)
POST /api/guest-auth/email-match 404 in 150ms (compile: 3ms, proxy.ts: 19ms, render: 127ms)
...
⚠️  Warning: Route /api/guest-auth/email-match still not ready after 5 attempts
```

**During tests**:
```
POST /api/guest-auth/email-match 404 in 2.0s (compile: 1171ms, proxy.ts: 353ms, render: 512ms)
POST /api/guest-auth/email-match 404 in 1751ms (compile: 12ms, proxy.ts: 1491ms, render: 247ms)
POST /api/guest-auth/magic-link/request 404 in 146ms (compile: 6ms, proxy.ts: 6ms, render: 135ms)
```

**Key observations**:
1. Routes are compiling (compile times shown)
2. Middleware is allowing them through (proxy.ts times shown)
3. Routes are rendering (render times shown)
4. But still returning 404

This is the **exact same pattern** we saw with `/api/auth/guest/*` routes!

### Root Cause Analysis

This suggests the issue is **NOT** with the reserved `/api/auth` segment, but something else entirely.

**Possible causes**:

1. **Next.js 16 Dynamic Route Bug**: Next.js 16 might have a broader routing bug that affects certain route patterns, not just reserved segments

2. **File System Issue**: The route files might not be in the correct structure for Next.js to discover them

3. **Export Issue**: The route handlers might not be exported correctly

4. **Build Cache Issue**: Even after clearing `.next`, there might be cached routing information

5. **Development Server Issue**: The dev server might need a full restart to pick up the new routes

### File Structure Verification

```
app/api/guest-auth/
├── email-match/
│   └── route.ts          ✅ EXISTS
└── magic-link/
    ├── request/
    │   └── route.ts      ✅ EXISTS
    └── verify/
        └── route.ts      ✅ EXISTS (WORKS - returns 400, not 404)
```

**Interesting**: The `verify` route works (returns 400 validation error), but `email-match` and `request` routes return 404!

### Middleware Configuration

```typescript
// Skip middleware for public routes
if (
  pathname.startsWith('/auth') ||
  pathname === '/' ||
  pathname.startsWith('/api/auth') ||
  pathname.startsWith('/api/guest-auth') ||  // ✅ Explicitly allows our routes
  pathname.startsWith('/_next') ||
  pathname.startsWith('/static')
) {
  return NextResponse.next();
}
```

Middleware is correct and should allow these routes through.

### Route File Structure

```typescript
// app/api/guest-auth/email-match/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // ... implementation
}
```

Route file structure looks correct.

### Hypothesis: Async Cookies Issue

Looking at the route file, I notice it uses `await cookies()`:

```typescript
const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  }
);
```

In Next.js 15+, `cookies()` returns a Promise and must be awaited. But maybe there's an issue with how we're using it?

### Comparison with Working Route

Let me check the `verify` route that DOES work:

```bash
ls -la app/api/guest-auth/magic-link/verify/
```

If the verify route works but request doesn't, there must be a difference in how they're implemented.

### Next Steps

1. **Compare working vs non-working routes**: Check if there's a difference in implementation between `verify` (works) and `email-match`/`request` (don't work)

2. **Try simpler route**: Create a minimal test route to see if it works:
   ```typescript
   export async function POST() {
     return NextResponse.json({ test: true });
   }
   ```

3. **Check Next.js routing**: Verify that Next.js is actually discovering these routes by checking the build output

4. **Try production build**: See if the issue persists in a production build

5. **Check for typos**: Verify there are no typos in directory names or file names

### Temporary Workaround

If we can't fix the routing issue, we could:
1. Move routes to a different path (e.g., `/api/auth-guest/*`)
2. Use a different HTTP method (e.g., GET instead of POST)
3. Implement authentication in a different way

### Questions to Answer

1. Why does `/api/guest-auth/magic-link/verify` work but `/api/guest-auth/email-match` doesn't?
2. Is there a pattern to which routes work and which don't?
3. Does the issue persist in a production build?
4. Are there any Next.js 16 known issues with nested API routes?

---

## Action Plan

### Immediate (Next 10 minutes)
1. Compare `verify` route (works) with `email-match` route (doesn't work)
2. Check for any differences in implementation
3. Try creating a minimal test route to isolate the issue

### Short-term (Next 30 minutes)
1. Test with production build to see if it's a dev server issue
2. Check Next.js 16 GitHub issues for similar problems
3. Try alternative route structures

### If All Else Fails
1. Downgrade to Next.js 15
2. Use a different authentication approach
3. Report bug to Next.js team

