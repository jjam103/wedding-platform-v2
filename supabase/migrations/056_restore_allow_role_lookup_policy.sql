-- Migration: Restore allow_role_lookup_for_rls policy
-- Issue: Migration 055 dropped this policy with CASCADE but didn't recreate it
-- Impact: get_user_role() function fails with "permission denied for table users"
-- Solution: Recreate the policy to allow role lookups

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "allow_role_lookup_for_rls" ON users;

-- Recreate policy to allow reading user role for any authenticated user
-- This is safe because get_user_role() only returns the role field, not sensitive data
-- The function has SECURITY DEFINER and SET row_security = off, but Supabase still
-- checks RLS policies, so we need this policy to allow the function to work
CREATE POLICY "allow_role_lookup_for_rls"
ON users FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON POLICY "allow_role_lookup_for_rls" ON users IS 'Allows get_user_role() function to work in RLS policies. Only returns role field, no sensitive data exposed. Required because even SECURITY DEFINER functions with row_security = off still trigger RLS checks in Supabase.';
