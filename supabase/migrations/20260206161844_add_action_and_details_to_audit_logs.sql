-- Add action and details columns to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS details JSONB;

-- Add index for action column for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add comment for documentation
COMMENT ON COLUMN audit_logs.action IS 'The action performed (e.g., magic_link_sent, magic_link_verified, guest_logout)';
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the action in JSON format';;
