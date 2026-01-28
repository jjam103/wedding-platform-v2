-- Migration: Fix infinite recursion in group_members table RLS policies
-- The group_owners_view_their_members policy was querying group_members from within
-- group_members table policies, causing infinite recursion.
-- Solution: Use SECURITY DEFINER function to bypass RLS.

-- Drop the problematic policy
DROP POLICY IF EXISTS "group_owners_view_their_members" ON group_members;

-- Create a function to get user's group IDs (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_id UUID)
RETURNS TABLE(group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id 
  FROM public.group_members gm
  WHERE gm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Group owners can view members of their groups (using function to avoid recursion)
CREATE POLICY "group_owners_view_their_members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.get_user_group_ids(auth.uid())
  )
);

-- Comment for documentation
COMMENT ON FUNCTION public.get_user_group_ids(UUID) IS 'Returns group IDs for a user, bypassing RLS to prevent infinite recursion in policies';
