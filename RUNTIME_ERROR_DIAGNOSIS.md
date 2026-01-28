# Runtime Error Diagnosis & Resolution

## Issue Summary

The application is experiencing **500 Internal Server Errors** on the following endpoints:
- `/api/admin/guests` 
- `/api/admin/groups`

## Root Cause

**Infinite recursion in database Row Level Security (RLS) policy** for the `group_members` table.

### Error Details
```
Error Code: 42P17
Message: "infinite recursion detected in policy for relation 'group_members'"
```

### Technical Explanation

The RLS policy `"group_owners_view_their_members"` contains a circular reference:

```sql
CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members  -- ❌ Queries itself!
    WHERE user_id = auth.uid()
  )
);
```

When PostgreSQL tries to check if a user can view `group_members`, it queries `group_members`, which triggers the same policy check, creating infinite recursion.

## Impact

- ❌ `/admin/guests` page fails to load
- ❌ Guest management features unavailable
- ❌ Group filtering broken
- ✅ Other pages (activities, events, etc.) still work
- ✅ Authentication still works
- ✅ Admin dashboard loads

## Resolution

### Quick Fix (2 minutes)

1. **Open Supabase SQL Editor**: https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/sql/new

2. **Run this SQL**:
```sql
DROP POLICY IF EXISTS "group_owners_view_their_members" ON group_members;

CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_id UUID)
RETURNS TABLE(group_id UUID) AS $$
BEGIN
  RETURN QUERY SELECT gm.group_id FROM public.group_members gm WHERE gm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (group_id IN (SELECT group_id FROM public.get_user_group_ids(auth.uid())));
```

3. **Verify**: Refresh http://localhost:3000/admin/guests

### How the Fix Works

The `SECURITY DEFINER` function bypasses RLS when querying `group_members`, breaking the recursion cycle:

```sql
-- Before (recursive):
SELECT * FROM group_members WHERE group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
  -- ↑ This triggers the policy again → infinite loop
)

-- After (non-recursive):
SELECT * FROM group_members WHERE group_id IN (
  SELECT group_id FROM public.get_user_group_ids(auth.uid())
  -- ↑ This function has SECURITY DEFINER, bypasses RLS → no loop
)
```

## Files Created

1. **supabase/migrations/021_fix_group_members_rls_infinite_recursion.sql** - Migration file
2. **APPLY_RLS_FIX_NOW.md** - Quick fix instructions
3. **FIX_DATABASE_RLS_ISSUE.md** - Detailed documentation
4. **RUNTIME_ERROR_DIAGNOSIS.md** - This file

## Testing Performed

### Diagnosis
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bwthjirvpdypmbvpsjtl.supabase.co', 'sb_publishable_VJgv__kroHbFX7OgSLPlSw_wGzVzeVo');
supabase.from('guests').select('count').then(r => console.log('Guests:', r.error ? r.error.message : 'OK'));
"
```

**Result**: Confirmed infinite recursion error

### After Fix (to be run)
Same test should return: `Guests: OK`

## Related Issues

This is the **second occurrence** of this pattern:
1. **First**: `users` table had same issue → Fixed in migration `017_fix_users_rls_infinite_recursion.sql`
2. **Now**: `group_members` table has same issue → Fixed in migration `021_fix_group_members_rls_infinite_recursion.sql`

### Prevention

When writing RLS policies, **never query the same table** within its own policy. Instead:
- Use `SECURITY DEFINER` functions
- Query related tables (not the same table)
- Use `auth.uid()` and `auth.jwt()` directly

## Next Steps

1. ✅ **Apply the SQL fix** (see APPLY_RLS_FIX_NOW.md)
2. ✅ **Verify the fix** by loading /admin/guests
3. ✅ **Continue development** - all features should work
4. 📋 **Consider**: Audit other RLS policies for similar issues

## Timeline

- **Issue Discovered**: 2025-01-28 (during dev server testing)
- **Root Cause Identified**: Database RLS infinite recursion
- **Fix Created**: Migration 021 with SECURITY DEFINER function
- **Status**: Awaiting manual application via Supabase dashboard

## Developer Notes

- The error wasn't visible in Next.js logs initially because it occurs at the database level
- Direct database query testing revealed the issue immediately
- This type of error is common when RLS policies reference their own table
- The `SECURITY DEFINER` pattern is the standard PostgreSQL solution
