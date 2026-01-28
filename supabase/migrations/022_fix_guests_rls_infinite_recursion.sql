-- Migration: Fix infinite recursion in guests table RLS policies
-- The adults_view_family and adults_update_family policies were querying guests
-- from within guests table policies, causing infinite recursion.
-- Solution: Use SECURITY DEFINER function to bypass RLS.

-- Drop the problematic policies
DROP POLICY IF EXISTS "adults_view_family" ON guests;
DROP POLICY IF EXISTS "adults_update_family" ON guests;

-- Create a function to get user's group ID from their email (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_group_id_by_email(user_email TEXT)
RETURNS UUID AS $$
DECLARE
  user_group_id UUID;
BEGIN
  SELECT group_id INTO user_group_id
  FROM public.guests
  WHERE email = user_email
    AND age_type = 'adult'
  LIMIT 1;
  
  RETURN user_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adult guests can view family members in their group (using function to avoid recursion)
CREATE POLICY "adults_view_family"
ON guests FOR SELECT
USING (
  group_id = public.get_user_group_id_by_email(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Adult guests can update family members in their group (using function to avoid recursion)
CREATE POLICY "adults_update_family"
ON guests FOR UPDATE
USING (
  group_id = public.get_user_group_id_by_email(
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Comment for documentation
COMMENT ON FUNCTION public.get_user_group_id_by_email(TEXT) IS 'Returns group ID for an adult guest by email, bypassing RLS to prevent infinite recursion in policies';
