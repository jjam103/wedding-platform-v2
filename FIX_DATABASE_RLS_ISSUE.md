# Fix Database RLS Infinite Recursion Issue

## Problem
The application is experiencing 500 errors when accessing `/api/admin/guests` and `/api/admin/groups` endpoints due to an **infinite recursion in the Row Level Security (RLS) policy** for the `group_members` table.

### Error Message
```
infinite recursion detected in policy for relation "group_members"
```

### Root Cause
The RLS policy `"group_owners_view_their_members"` on the `group_members` table queries `group_members` from within its own policy check, causing infinite recursion:

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

## Solution

### Option 1: Apply Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com/project/bwthjirvpdypmbvpsjtl
2. Navigate to **SQL Editor**
3. Create a new query and paste the following SQL:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS "group_owners_view_their_members" ON group_members;

-- Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_id UUID)
RETURNS TABLE(group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id 
  FROM public.group_members gm
  WHERE gm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the fixed policy using the helper function
CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.get_user_group_ids(auth.uid())
  )
);

-- Add documentation
COMMENT ON FUNCTION public.get_user_group_ids(UUID) IS 'Returns group IDs for a user, bypassing RLS to prevent infinite recursion in policies';
```

4. Click **Run** to execute the SQL
5. Verify the fix by refreshing your application

### Option 2: Use psql Command Line

If you have PostgreSQL client installed:

```bash
# Get your database connection string from Supabase dashboard
# Settings > Database > Connection string (Direct connection)

psql "postgresql://postgres:[YOUR-PASSWORD]@db.bwthjirvpdypmbvpsjtl.supabase.co:5432/postgres" \
  -f supabase/migrations/021_fix_group_members_rls_infinite_recursion.sql
```

### Option 3: Temporary Workaround (Development Only)

If you need to continue development immediately, you can temporarily disable RLS on the `group_members` table:

```sql
-- ⚠️ WARNING: This removes security! Only for local development!
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
```

**Important:** Re-enable RLS before deploying to production!

## Verification

After applying the fix, test the database connection:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://bwthjirvpdypmbvpsjtl.supabase.co',
  'sb_publishable_VJgv__kroHbFX7OgSLPlSw_wGzVzeVo'
);

supabase.from('guests').select('count').then(result => {
  console.log('✅ Guests table:', result.error ? 'ERROR' : 'OK');
  if (result.error) console.error(result.error);
});

supabase.from('groups').select('count').then(result => {
  console.log('✅ Groups table:', result.error ? 'ERROR' : 'OK');
  if (result.error) console.error(result.error);
});

setTimeout(() => process.exit(0), 2000);
"
```

Expected output:
```
✅ Guests table: OK
✅ Groups table: OK
```

## Files Created

- `supabase/migrations/021_fix_group_members_rls_infinite_recursion.sql` - The migration file
- `FIX_DATABASE_RLS_ISSUE.md` - This documentation

## Next Steps

1. Apply the SQL fix using one of the options above
2. Refresh your browser to test the application
3. Verify that `/admin/guests` page loads without errors
4. Continue with development

## Related Issues

This is similar to the issue fixed in migration `017_fix_users_rls_infinite_recursion.sql`, which fixed the same problem for the `users` table.
