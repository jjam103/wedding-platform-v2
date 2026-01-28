-- Create email_templates table
-- Requirements: 12.1, 12.2
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_logs table
-- Requirements: 12.6, 12.7
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduled_emails table
-- Requirements: 12.5
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(delivery_status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX idx_scheduled_emails_status ON scheduled_emails(status);

-- Add RLS policies for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only hosts can manage email templates
CREATE POLICY "hosts_manage_email_templates"
ON email_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Add RLS policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Only hosts can view email logs
CREATE POLICY "hosts_view_email_logs"
ON email_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- System can insert email logs
CREATE POLICY "system_insert_email_logs"
ON email_logs FOR INSERT
WITH CHECK (true);

-- System can update email logs (for webhook status updates)
CREATE POLICY "system_update_email_logs"
ON email_logs FOR UPDATE
USING (true);

-- Add RLS policies for scheduled_emails
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Only hosts can manage scheduled emails
CREATE POLICY "hosts_manage_scheduled_emails"
ON scheduled_emails FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_email_template_updated_at();


-- Create sms_logs table
-- Requirements: 12.10
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for SMS logs
CREATE INDEX idx_sms_logs_recipient ON sms_logs(recipient_phone);
CREATE INDEX idx_sms_logs_status ON sms_logs(delivery_status);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- Add RLS policies for sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Only hosts can view SMS logs
CREATE POLICY "hosts_view_sms_logs"
ON sms_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- System can insert SMS logs
CREATE POLICY "system_insert_sms_logs"
ON sms_logs FOR INSERT
WITH CHECK (true);

-- System can update SMS logs (for webhook status updates)
CREATE POLICY "system_update_sms_logs"
ON sms_logs FOR UPDATE
USING (true);
