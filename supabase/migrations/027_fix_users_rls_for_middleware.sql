-- Migration: Fix users table RLS to allow middleware authentication checks
-- Issue: Middleware needs to query users table to check role, but RLS was blocking access
-- Solution: Add policy allowing authenticated users to view their own record

-- Drop existing "users_view_own_info" policy if it exists
DROP POLICY IF EXISTS "users_view_own_info" ON users;

-- Allow authenticated users to view their own user record
-- This is needed for middleware to check user roles during authentication
CREATE POLICY "users_view_own_info"
ON users FOR SELECT
USING (auth.uid() = id);

-- Comment for documentation
COMMENT ON POLICY "users_view_own_info" ON users IS 'Allows authenticated users to view their own user record, required for middleware role checks';
