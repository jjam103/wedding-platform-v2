-- Migration: Add action column to audit_logs table
-- This column is needed to track specific authentication events like guest_login, guest_logout

-- Add action column
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action VARCHAR(50);

-- Add index for faster queries on action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add index for common query pattern (entity_id + action)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action ON audit_logs(entity_id, action);

-- Add comment
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., guest_login, guest_logout, admin_login)';
