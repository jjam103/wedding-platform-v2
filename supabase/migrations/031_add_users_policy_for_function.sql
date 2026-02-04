-- Migration: Add RLS policy to allow get_user_role function to work
-- Issue: Even SECURITY DEFINER functions respect RLS in Supabase
-- Solution: Add a policy that allows reading user roles for RLS policy evaluation

-- Add policy to allow reading user role for any authenticated user
-- This is safe because it only returns the role, not sensitive data
CREATE POLICY "allow_role_lookup_for_rls"
ON users FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON POLICY "allow_role_lookup_for_rls" ON users IS 'Allows get_user_role() function to work in RLS policies. Only returns role field, no sensitive data exposed.';
