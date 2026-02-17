-- Migration: Fix RLS policies for guests and groups tables to use admin_users
-- Issue: Admin users can't access guests/groups because policies check users table
-- Solution: Add policies that check admin_users table

-- ============================================================================
-- GUESTS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "admin_users_access_all_guests" ON guests;

-- Create policy for admin users to access all guests
CREATE POLICY "admin_users_access_all_guests"
ON guests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.status = 'active'
  )
);

-- ============================================================================
-- GROUPS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "admin_users_access_all_groups" ON groups;

-- Create policy for admin users to access all groups
CREATE POLICY "admin_users_access_all_groups"
ON groups
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.status = 'active'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify policies were created)
-- ============================================================================

-- Verify guests policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'guests'
-- AND policyname = 'admin_users_access_all_guests';

-- Verify groups policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'groups'
-- AND policyname = 'admin_users_access_all_groups';
