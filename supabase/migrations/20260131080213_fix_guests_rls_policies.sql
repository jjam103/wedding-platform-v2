-- Migration: Fix guests table RLS policies that query users table
-- Issue: hosts_access_all_guests and super_admins_access_all_guests policies
-- query the users table directly, causing "permission denied" errors
-- Solution: Use the get_user_role() SECURITY DEFINER function to bypass RLS

-- Drop old policies that directly query users table
DROP POLICY IF EXISTS "hosts_access_all_guests" ON guests;
DROP POLICY IF EXISTS "super_admins_access_all_guests" ON guests;

-- Recreate policies using get_user_role() function to avoid RLS recursion
CREATE POLICY "super_admins_access_all_guests"
ON guests FOR ALL
USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "hosts_access_all_guests"
ON guests FOR ALL
USING (public.get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- Comment for documentation
COMMENT ON POLICY "super_admins_access_all_guests" ON guests IS 'Super admins have full access to all guest records - uses get_user_role() to avoid RLS recursion';
COMMENT ON POLICY "hosts_access_all_guests" ON guests IS 'Hosts have full access to all guest records - uses get_user_role() to avoid RLS recursion';;
