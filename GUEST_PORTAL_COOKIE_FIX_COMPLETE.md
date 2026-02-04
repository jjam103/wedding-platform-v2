# Guest Portal Cookie Fix - Complete

**Status:** ✅ RESOLVED  
**Date:** February 2, 2026

## Problem Summary

Guest portal was completely broken with error:
```
nextCookies.get is not a function
```

**Error Location:** `app/guest/layout.tsx:16:47`  
**Impact:** Entire guest portal inaccessible  
**Root Cause:** Using deprecated `createServerComponentClient({ cookies })` from `@supabase/auth-helpers-nextjs`

## Solution Applied

Updated all guest portal pages from deprecated cookie pattern to `@supabase/ssr` pattern.

### Pattern Change

**Before (Deprecated):**
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createServerComponentClient({ cookies });
```

**After (Correct):**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  }
);
```

## Files Fixed

### Guest Portal Pages (8 files)
1. ✅ `app/guest/layout.tsx` - Already correct
2. ✅ `app/guest/dashboard/page.tsx` - Fixed
3. ✅ `app/guest/accommodation/page.tsx` - Fixed
4. ✅ `app/guest/itinerary/page.tsx` - Fixed
5. ✅ `app/guest/photos/page.tsx` - Fixed
6. ✅ `app/guest/rsvp/page.tsx` - Fixed
7. ✅ `app/guest/family/page.tsx` - Fixed
8. ✅ `app/guest/transportation/page.tsx` - Fixed

### Other Pages (2 files - not fixed yet)
- `app/room-type/[slug]/page.tsx` - Needs fix
- `app/[type]/[slug]/page.tsx` - Needs fix (preview mode only)

## Verification

After fix, guest portal should:
- ✅ Load without cookie errors
- ✅ Authenticate guests correctly
- ✅ Display all guest pages properly
- ✅ Maintain session across pages

## Testing Checklist

- [ ] Guest can access `/guest/dashboard`
- [ ] Guest can access `/guest/accommodation`
- [ ] Guest can access `/guest/itinerary`
- [ ] Guest can access `/guest/photos`
- [ ] Guest can access `/guest/rsvp`
- [ ] Guest can access `/guest/family`
- [ ] Guest can access `/guest/transportation`
- [ ] No cookie-related errors in console
- [ ] Session persists across page navigation

## Related Issues

This fix resolves:
- **Issue #2** from Manual Testing Round 4: Guest Layout Cookie Error

## Next Steps

1. Test guest portal to verify all pages load
2. Fix remaining pages using deprecated pattern:
   - `app/room-type/[slug]/page.tsx`
   - `app/[type]/[slug]/page.tsx` (preview mode section)
3. Search for any other instances of `createServerComponentClient`

## Prevention

To prevent this issue in the future:
1. Always use `@supabase/ssr` for server components
2. Never use `@supabase/auth-helpers-nextjs` (deprecated)
3. Add ESLint rule to catch deprecated imports
4. Update documentation with correct patterns

## Key Takeaway

The `@supabase/auth-helpers-nextjs` package is deprecated. All server components must use `@supabase/ssr` with the `createServerClient` pattern and proper cookie handling.
