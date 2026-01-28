# API Routes Updated to @supabase/ssr

## Summary

All API routes have been updated from `@supabase/auth-helpers-nextjs` to `@supabase/ssr` for compatibility with Next.js 15+ and proper cookie handling.

## Changes Made

### 1. Created Auth Helper Library

**File:** `lib/apiAuth.ts`

Provides three helper functions:
- `createApiClient()` - Creates Supabase client with proper cookie handling
- `getAuthenticatedUser()` - Verifies authentication, returns user + supabase client
- `getAuthorizedAdmin()` - Verifies admin/host role, returns user + supabase + role

### 2. Updated API Routes

#### Admin Routes
- ✅ `app/api/admin/metrics/route.ts` - Dashboard metrics
- ✅ `app/api/admin/alerts/route.ts` - Real-time alerts
- ✅ `app/api/admin/audit-logs/route.ts` - Audit log retrieval

#### Guest Routes
- ✅ `app/api/guest/activities/list/route.ts` - List activities
- ✅ `app/api/guest/events/list/route.ts` - List events
- ✅ `app/api/guest/events/route.ts` - Event details
- ✅ `app/api/guest/rsvps/route.ts` - RSVP list
- ✅ `app/api/guest/rsvp/route.ts` - RSVP submission
- ✅ `app/api/guest/photos/upload/route.ts` - Photo upload
- ✅ `app/api/guest/family/[id]/route.ts` - Family member details
- ✅ `app/api/guest/transportation/route.ts` - Transportation info

#### Auth Routes
- ✅ `app/api/auth/create-user/route.ts` - Already using correct pattern (no changes needed)

## Pattern Changes

### Before (Old Pattern)
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of code
}
```

### After (New Pattern)
```typescript
import { getAuthenticatedUser } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { user, supabase } = auth;
  
  // ... rest of code
}
```

### For Admin Routes
```typescript
import { getAuthorizedAdmin } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = await getAuthorizedAdmin();
  
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { user, supabase, role } = auth;
  
  // ... rest of code
}
```

## Benefits

1. **Consistent Cookie Handling** - All routes use the same cookie management pattern
2. **Next.js 15+ Compatible** - Works with async cookies() API
3. **Cleaner Code** - Reduced boilerplate in each route
4. **Better Type Safety** - Centralized auth logic with proper types
5. **Easier Testing** - Can mock the auth helpers instead of Supabase client

## Testing

After these changes, test the following:

1. **Admin Dashboard** - http://localhost:3000/admin
   - Should load metrics (guest count, RSVP rates, budget)
   - Should show alerts if any exist
   
2. **Guest Portal** - http://localhost:3000/guest/dashboard
   - Should load activities list
   - Should load events list
   - Should allow RSVP submissions

3. **Authentication**
   - Login should work
   - Protected routes should require auth
   - Admin routes should require admin/host role

## Next Steps

If you encounter any issues:

1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure database migrations are applied
4. Test individual API endpoints with curl or Postman

## Rollback (if needed)

If issues arise, you can rollback by:
1. Reverting the changes to individual route files
2. Restoring the old `createRouteHandlerClient` pattern
3. Re-adding the `@supabase/auth-helpers-nextjs` package

However, this is not recommended as the old package is deprecated for Next.js 15+.
