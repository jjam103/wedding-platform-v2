-- Migration: Fix infinite recursion in users table RLS policies
-- The super_admins policies were querying the users table from within users table policies,
-- causing infinite recursion. Solution: Use SECURITY DEFINER function to bypass RLS.

-- Drop the problematic policies
DROP POLICY IF EXISTS "super_admins_view_all_users" ON users;
DROP POLICY IF EXISTS "super_admins_manage_users" ON users;
DROP POLICY IF EXISTS "hosts_view_all_users" ON users;
-- Create a function to get user role (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Super admins can view all users (using function to avoid recursion)
CREATE POLICY "super_admins_view_all_users"
ON users FOR SELECT
USING (public.get_user_role(auth.uid()) = 'super_admin');
-- Hosts can also view all users (needed for middleware authorization checks)
CREATE POLICY "hosts_view_all_users"
ON users FOR SELECT
USING (public.get_user_role(auth.uid()) IN ('super_admin', 'host'));
-- Super admins can manage all users
CREATE POLICY "super_admins_manage_users"
ON users FOR ALL
USING (public.get_user_role(auth.uid()) = 'super_admin');
-- Comment for documentation
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns user role, bypassing RLS to prevent infinite recursion in policies';
