-- Migration: Drop old groups table RLS policies that query users table
-- Issue: Old policies from migration 002 are still active and querying users table
-- This causes "permission denied for table users" errors when the new simpler policies
-- from migration 20260130230944 should be sufficient
-- Solution: Drop the old policies that query the users table

-- Drop old policies that query users table
DROP POLICY IF EXISTS "admins_hosts_view_groups" ON groups;
DROP POLICY IF EXISTS "admins_hosts_manage_groups" ON groups;
DROP POLICY IF EXISTS "group_owners_view_their_groups" ON groups;

-- Comment for documentation
COMMENT ON TABLE groups IS 'Guest groups table - RLS policies updated in migration 20260130230944 to allow all authenticated users access';;
