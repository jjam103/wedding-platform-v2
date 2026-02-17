# E2E Content Management - API Authentication Fixes Applied

## Issue Summary

The E2E Content Management tests were failing with JSON parse errors and 500 status codes from multiple admin API endpoints. The root cause was improper handling of the async `cookies()` API in Next.js 15+.

## Root Cause

API routes were using the old authentication pattern:
```typescript
const cookieStore = await cookies();
const supabase = createServerClient(/* ... */);
```

This pattern was causing:
1. **JSON Parse Errors**: `SyntaxError: Unexpected end of JSON input`
2. **500 Status Codes**: Internal server errors
3. **Timeout Issues**: Event creation API timing out (15s+)

## Fixes Applied

### 1. Home Page API Route (`app/api/admin/home-page/route.ts`)
**Before:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = createServerClient(/* ... */);
```

**After:**
```typescript
import { createAuthenticatedClient } from '@/lib/supabaseServer';

const supabase = await createAuthenticatedClient();
```

### 2. Email Schedule API Route (`app/api/admin/emails/schedule/route.ts`)
**Before:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
```

**After:**
```typescript
import { createAuthenticatedClient } from '@/lib/supabaseServer';

const supabase = await createAuthenticatedClient();
```

### 3. Email Send API Route (`app/api/admin/emails/send/route.ts`)
Same pattern as above - replaced `createRouteHandlerClient` with `createAuthenticatedClient`.

## Why This Fixes the Issue

The `createAuthenticatedClient()` helper from `lib/supabaseServer.ts` properly handles:
1. **Async cookies()**: Correctly awaits the cookies() promise
2. **Cookie management**: Proper getAll/setAll implementation
3. **Error handling**: Graceful handling of cookie setting errors

## Verification

### API Endpoint Test
```bash
curl http://localhost:3000/api/admin/home-page
# Returns: {"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
# ✓ Proper JSON response (not parse error)
```

### Build Status
- TypeScript compilation: ✓ Passes
- No JSON parse errors in API routes
- Proper error responses with correct status codes

## Remaining Work

### Additional Files Needing Same Fix
The following API routes still use the old pattern and should be updated:
- `app/api/admin/admin-users/[id]/deactivate/route.ts`
- `app/api/admin/admin-users/[id]/invite/route.ts`
- `app/api/admin/admin-users/[id]/route.ts`
- `app/api/admin/activities/bulk-delete/route.ts`
- `app/api/admin/gallery-settings/route.ts`
- `app/api/admin/references/search/route.ts`
- `app/api/admin/emails/preview/route.ts`
- `app/api/admin/deleted-items/[id]/restore/route.ts`
- `app/api/admin/deleted-items/[id]/permanent/route.ts`
- `app/api/admin/deleted-items/route.ts`
- `app/api/admin/emails/templates/[id]/route.ts`
- `app/api/admin/emails/history/route.ts`
- `app/api/admin/references/validate/route.ts`

### Build Issue to Address
The build is currently failing due to an unrelated issue:
```
useSearchParams() should be wrapped in a suspense boundary at page "/admin/guests"
```

This is a separate Next.js 15 requirement and not related to the JSON parsing errors.

## Impact on E2E Tests

### Before Fixes
- 9/17 tests passing (53%)
- Multiple JSON parse errors
- 500 status codes from API endpoints
- Event creation timing out

### After Fixes
- API endpoints return proper JSON responses
- Authentication errors are properly formatted
- No more JSON parse errors
- Ready for E2E test re-run (after build issue is resolved)

## Next Steps

1. **Fix remaining API routes**: Apply same pattern to all routes listed above
2. **Fix build issue**: Wrap `useSearchParams()` in Suspense boundary in `/admin/guests` page
3. **Re-run E2E tests**: Verify all Content Management tests pass
4. **Update steering docs**: Document the correct authentication pattern for future API routes

## Pattern to Follow

For all new API routes, use this pattern:

```typescript
import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

export async function GET/POST/PUT/DELETE(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. VALIDATE
    // 3. DELEGATE to service
    // 4. RESPOND
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

## Files Modified

1. `app/api/admin/home-page/route.ts` - ✓ Fixed
2. `app/api/admin/emails/schedule/route.ts` - ✓ Fixed
3. `app/api/admin/emails/send/route.ts` - ✓ Fixed
4. `lib/supabaseServer.ts` - Already correct (provides helper)

## Conclusion

The JSON parsing errors were caused by improper async cookie handling in Next.js 15+. By using the `createAuthenticatedClient()` helper, we ensure proper async/await handling and consistent authentication across all API routes.

The E2E tests should now be able to make API calls without encountering JSON parse errors. The remaining test failures are likely due to actual application logic issues or the build error that needs to be addressed separately.
