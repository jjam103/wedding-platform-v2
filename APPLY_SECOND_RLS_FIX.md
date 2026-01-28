# Apply Second RLS Fix - Guests Table

## Status
✅ **groups** table - FIXED  
❌ **guests** table - Still has infinite recursion (different policy)

## The Problem
After fixing `group_members`, we discovered **another infinite recursion** in the `guests` table policies:
- `"adults_view_family"` 
- `"adults_update_family"`

These policies query `guests` from within `guests` policies → infinite loop.

## The Fix (1 minute)

### Open Supabase SQL Editor
**https://app.supabase.com/project/bwthjirvpdypmbvpsjtl/sql/new**

### Paste and Run This SQL

```sql
-- Drop the problematic policies
DROP POLICY IF EXISTS "adults_view_family" ON guests;
DROP POLICY IF EXISTS "adults_update_family" ON guests;

-- Create helper function
CREATE OR REPLACE FUNCTION public.get_user_group_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_group_id UUID;
BEGIN
  SELECT group_id INTO user_group_id
  FROM public.guests
  WHERE email = user_email AND age_type = 'adult'
  LIMIT 1;
  RETURN user_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create fixed policies
CREATE POLICY "adults_view_family" ON guests FOR SELECT
USING (
  group_id = public.get_user_group_id_by_email(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "adults_update_family" ON guests FOR UPDATE
USING (
  group_id = public.get_user_group_id_by_email(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

COMMENT ON FUNCTION public.get_user_group_id_by_email(TEXT) IS 'Returns group ID for an adult guest by email, bypassing RLS to prevent infinite recursion in policies';
```

### Click "Run"

You should see: **Success. No rows returned**

### Verify

Refresh http://localhost:3000/admin/guests - should work now! ✅

## What This Fixes

**Before (recursive)**:
```sql
-- Queries guests from within guests policy → infinite loop
SELECT * FROM guests WHERE group_id IN (
  SELECT group_id FROM guests WHERE email = user_email
)
```

**After (non-recursive)**:
```sql
-- Function has SECURITY DEFINER, bypasses RLS → no loop
SELECT * FROM guests WHERE group_id = get_user_group_id_by_email(user_email)
```

## Summary

You need to apply **TWO** RLS fixes:
1. ✅ `group_members` table - Already applied
2. ⏳ `guests` table - Apply this one now

After both fixes, your app will be fully functional!
