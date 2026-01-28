# Apply RLS Fix - Quick Instructions

## The Problem
Your app is broken due to infinite recursion in the database RLS policy. This is preventing all API calls from working.

## The Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
Click this link: **https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/sql/new**

### Step 2: Copy and Paste This SQL

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

### Step 3: Click "Run" (or press Cmd/Ctrl + Enter)

You should see: **Success. No rows returned**

### Step 4: Verify the Fix

Refresh your browser at http://localhost:3000/admin/guests

The page should now load without errors! ✅

## What This Does

The original policy had this problem:
```sql
-- ❌ BAD: Queries group_members from within group_members policy
SELECT group_id FROM group_members WHERE user_id = auth.uid()
```

The fix uses a `SECURITY DEFINER` function that bypasses RLS:
```sql
-- ✅ GOOD: Function bypasses RLS to avoid recursion
SELECT group_id FROM public.get_user_group_ids(auth.uid())
```

## Troubleshooting

If you see any errors:
1. Make sure you're logged into the correct Supabase project
2. Check that you have admin access to the project
3. Try running each statement separately

## Alternative: Command Line (if you have psql)

```bash
psql "your-connection-string" -f supabase/migrations/021_fix_group_members_rls_infinite_recursion.sql
```

Get your connection string from: https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/settings/database
