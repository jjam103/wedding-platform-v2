-- Migration: Add action and details columns to audit_logs
-- This allows for more flexible audit logging beyond just CRUD operations
-- Requirements: 5.7, 22.4
-- Task: Phase 1 - Guest Authentication

-- Add action column for specific action types (e.g., 'guest_login', 'magic_link_requested')
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;

-- Add details column for additional context
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Create index for action column
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Update comments
COMMENT ON COLUMN audit_logs.action IS 'Specific action type (e.g., guest_login, magic_link_requested, guest_logout)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context and metadata for the action';

-- Make operation_type nullable since we now have action
ALTER TABLE audit_logs ALTER COLUMN operation_type DROP NOT NULL;
