-- Create cron_job_logs table for tracking scheduled job executions
-- Requirements: 22.1, 22.6, 19.3, 19.4

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN (
    'rsvp_deadline_reminders',
    'scheduled_email_processing',
    'webhook_retry',
    'temp_file_cleanup',
    'expired_session_cleanup'
  )),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for efficient querying
CREATE INDEX idx_cron_job_logs_job_type ON cron_job_logs(job_type);
CREATE INDEX idx_cron_job_logs_status ON cron_job_logs(status);
CREATE INDEX idx_cron_job_logs_started_at ON cron_job_logs(started_at DESC);
-- Add RLS policies
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;
-- Only super admins can view cron job logs
CREATE POLICY "super_admins_view_cron_logs"
ON cron_job_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);
-- System can insert cron job logs (service role key)
CREATE POLICY "system_insert_cron_logs"
ON cron_job_logs FOR INSERT
WITH CHECK (true);
-- System can update cron job logs (service role key)
CREATE POLICY "system_update_cron_logs"
ON cron_job_logs FOR UPDATE
USING (true);
