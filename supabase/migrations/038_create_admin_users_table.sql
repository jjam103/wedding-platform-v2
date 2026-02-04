-- Migration: Create admin_users table for admin user management
-- Requirements: 3.1, 3.3
-- Phase 8, Task 33.1

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Add updated_at trigger
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all admin users
CREATE POLICY admin_users_select_policy ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can insert admin users
CREATE POLICY admin_users_insert_policy ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can update admin users
CREATE POLICY admin_users_update_policy ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can delete admin users (except last owner)
CREATE POLICY admin_users_delete_policy ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
    AND (
      -- Prevent deletion of last owner
      (role != 'owner') OR
      (SELECT COUNT(*) FROM admin_users WHERE role = 'owner' AND status = 'active') > 1
    )
  );

-- Add comment
COMMENT ON TABLE admin_users IS 'Admin users with role-based access control for wedding management';
