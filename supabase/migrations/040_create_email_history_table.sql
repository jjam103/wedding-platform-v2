-- Migration: Create email_history table for email tracking
-- Requirements: 4.6, 4.7
-- Phase 8, Task 33.3

-- Create email_history table
CREATE TABLE IF NOT EXISTS email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_ids UUID[] NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  error_message TEXT,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at);
CREATE INDEX idx_email_history_scheduled_for ON email_history(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_email_history_delivery_status ON email_history(delivery_status);
CREATE INDEX idx_email_history_template_id ON email_history(template_id);
CREATE INDEX idx_email_history_sent_by ON email_history(sent_by);
CREATE INDEX idx_email_history_recipient_ids ON email_history USING GIN(recipient_ids);

-- Add updated_at trigger
CREATE TRIGGER update_email_history_updated_at
  BEFORE UPDATE ON email_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated admin users can view email history
CREATE POLICY email_history_select_policy ON email_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.status = 'active'
    )
  );

-- Policy: All authenticated admin users can create email history records
CREATE POLICY email_history_insert_policy ON email_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.status = 'active'
    )
  );

-- Policy: System can update email history (for webhook updates)
CREATE POLICY email_history_update_policy ON email_history
  FOR UPDATE
  USING (TRUE); -- Allow system updates for webhook status changes

-- Add comment
COMMENT ON TABLE email_history IS 'Email history with delivery tracking and webhook integration';
