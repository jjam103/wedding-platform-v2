-- Migration: Create email_templates table for email template management
-- Requirements: 17.1, 17.2
-- Phase 8, Task 33.2

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT CHECK (category IN ('rsvp', 'reminder', 'announcement', 'custom')),
  usage_count INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_is_default ON email_templates(is_default) WHERE is_default = TRUE;

-- Add updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated admin users can view templates
CREATE POLICY email_templates_select_policy ON email_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.status = 'active'
    )
  );

-- Policy: All authenticated admin users can create templates
CREATE POLICY email_templates_insert_policy ON email_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.status = 'active'
    )
  );

-- Policy: All authenticated admin users can update templates
CREATE POLICY email_templates_update_policy ON email_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.status = 'active'
    )
  );

-- Policy: Only owners can delete templates
CREATE POLICY email_templates_delete_policy ON email_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Insert default templates
INSERT INTO email_templates (name, subject, body_html, variables, category, is_default) VALUES
(
  'RSVP Confirmation',
  'RSVP Confirmation for {{event_name}}',
  '<p>Hi {{guest_name}},</p><p>Thank you for your RSVP to {{event_name}}!</p><p>We''ve confirmed your attendance. If you need to make any changes, please visit your guest portal.</p><p>Looking forward to seeing you!</p>',
  '["guest_name", "event_name"]'::jsonb,
  'rsvp',
  TRUE
),
(
  'RSVP Reminder',
  'RSVP Reminder: {{event_name}} - Deadline {{deadline_date}}',
  '<p>Hi {{guest_name}},</p><p>This is a friendly reminder that the RSVP deadline for {{event_name}} is {{deadline_date}}.</p><p>Please visit your guest portal to confirm your attendance: {{rsvp_link}}</p><p>We look forward to hearing from you!</p>',
  '["guest_name", "event_name", "deadline_date", "rsvp_link"]'::jsonb,
  'reminder',
  TRUE
),
(
  'Activity Reminder',
  'Reminder: {{activity_name}} on {{activity_date}}',
  '<p>Hi {{guest_name}},</p><p>This is a reminder that {{activity_name}} is coming up on {{activity_date}} at {{activity_time}}.</p><p>Location: {{activity_location}}</p><p>We look forward to seeing you there!</p>',
  '["guest_name", "activity_name", "activity_date", "activity_time", "activity_location"]'::jsonb,
  'reminder',
  TRUE
),
(
  'General Announcement',
  '{{announcement_title}}',
  '<p>Hi {{guest_name}},</p><p>{{announcement_body}}</p><p>If you have any questions, please don''t hesitate to reach out.</p>',
  '["guest_name", "announcement_title", "announcement_body"]'::jsonb,
  'announcement',
  TRUE
);

-- Add comment
COMMENT ON TABLE email_templates IS 'Email templates with variable substitution for guest communications';
