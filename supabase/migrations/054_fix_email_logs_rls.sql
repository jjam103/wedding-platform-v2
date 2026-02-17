-- Fix email_logs RLS policy to use admin_users table
-- This aligns with the admin authentication system
-- Fixes E2E test failures where admin users couldn't access email logs

-- Drop old policies
DROP POLICY IF EXISTS "hosts_view_email_logs" ON email_logs;
DROP POLICY IF EXISTS "system_insert_email_logs" ON email_logs;
DROP POLICY IF EXISTS "system_update_email_logs" ON email_logs;

-- Create new policy for admin users
CREATE POLICY "admin_users_view_email_logs"
ON email_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Allow system to insert email logs (for email service)
CREATE POLICY "system_insert_email_logs"
ON email_logs FOR INSERT
WITH CHECK (true);

-- Allow system to update email logs (for webhook status updates)
CREATE POLICY "system_update_email_logs"
ON email_logs FOR UPDATE
USING (true);

-- Fix email_templates RLS policy
DROP POLICY IF EXISTS "hosts_manage_email_templates" ON email_templates;

CREATE POLICY "admin_users_manage_email_templates"
ON email_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Fix scheduled_emails RLS policy
DROP POLICY IF EXISTS "hosts_manage_scheduled_emails" ON scheduled_emails;

CREATE POLICY "admin_users_manage_scheduled_emails"
ON scheduled_emails FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

-- Fix sms_logs RLS policy
DROP POLICY IF EXISTS "hosts_view_sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "system_insert_sms_logs" ON sms_logs;
DROP POLICY IF EXISTS "system_update_sms_logs" ON sms_logs;

CREATE POLICY "admin_users_view_sms_logs"
ON sms_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "system_insert_sms_logs"
ON sms_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "system_update_sms_logs"
ON sms_logs FOR UPDATE
USING (true);
