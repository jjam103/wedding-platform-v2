-- Migration: Fix get_user_role to check both users and admin_users tables
-- Issue: Admin users are stored in admin_users table, but get_user_role only checks users table
-- Solution: Update function to check admin_users first, then fall back to users table

-- Drop existing function (CASCADE to drop dependent policies, we'll recreate them)
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Recreate with support for both users and admin_users tables
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
STABLE
AS $$
  -- First check admin_users table (for admin dashboard users)
  SELECT role FROM public.admin_users WHERE id = user_id
  UNION ALL
  -- Then check users table (for guest portal users)
  SELECT role FROM public.users WHERE id = user_id
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Comment for documentation
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Returns user role from either admin_users or users table, completely bypassing RLS with row_security = off. Used in RLS policies to prevent infinite recursion. SECURITY DEFINER allows it to read from both tables without triggering RLS policies.';

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
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- Admin users table policies (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_users' 
    AND policyname = 'owners_view_all_admin_users'
  ) THEN
    CREATE POLICY "owners_view_all_admin_users"
    ON admin_users FOR SELECT
    USING (get_user_role(auth.uid()) IN ('owner', 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'admin_users' 
    AND policyname = 'owners_manage_admin_users'
  ) THEN
    CREATE POLICY "owners_manage_admin_users"
    ON admin_users FOR ALL
    USING (get_user_role(auth.uid()) = 'owner');
  END IF;
END $$;
