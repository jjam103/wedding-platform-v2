-- Create audit_logs table for tracking all data modifications
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS Policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "super_admins_view_audit_logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- System can insert audit logs (no user restriction)
CREATE POLICY "system_insert_audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- No updates or deletes allowed on audit logs (immutable)
CREATE POLICY "no_updates_on_audit_logs"
ON audit_logs FOR UPDATE
USING (false);

CREATE POLICY "no_deletes_on_audit_logs"
ON audit_logs FOR DELETE
USING (false);

-- Grant necessary permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO service_role;
