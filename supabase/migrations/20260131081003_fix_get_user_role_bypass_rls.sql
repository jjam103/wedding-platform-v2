-- Migration: Fix get_user_role function to properly bypass RLS
-- Issue: Even with SECURITY DEFINER, the function still triggers RLS policies
--        that themselves call get_user_role(), creating circular dependency
-- Solution: Add SET row_security = off to completely bypass RLS in the function

-- Drop existing function (CASCADE to drop dependent policies, we'll recreate them)
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Recreate with proper RLS bypass
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Comment for documentation
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns user role, completely bypassing RLS with row_security = off. Used in RLS policies to prevent infinite recursion. SECURITY DEFINER allows it to read from users table without triggering RLS policies.';

-- Recreate policies that were dropped by CASCADE

-- Users table policies
CREATE POLICY "super_admins_view_all_users"
ON users FOR SELECT
USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "hosts_view_all_users"
ON users FOR SELECT
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

CREATE POLICY "super_admins_manage_users"
ON users FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- Guests table policies
CREATE POLICY "super_admins_access_all_guests"
ON guests FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "hosts_access_all_guests"
ON guests FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));;
