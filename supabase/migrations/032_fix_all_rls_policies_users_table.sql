-- Migration: Fix all RLS policies that query users table directly
-- Issue: RLS policies querying users table cause "permission denied for table users" errors
-- Solution: Replace direct users table queries with get_user_role() function calls
-- This migration updates 16 tables with problematic RLS policies

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_access_all_activities" ON activities;
DROP POLICY IF EXISTS "super_admins_access_all_activities" ON activities;

-- Create new policies using get_user_role()
CREATE POLICY "admins_hosts_manage_activities"
ON activities FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "super_admins_view_audit_logs" ON audit_logs;

-- Create new policy using get_user_role()
CREATE POLICY "super_admins_view_audit_logs"
ON audit_logs FOR SELECT
USING (get_user_role(auth.uid()) = 'super_admin');

-- ============================================================================
-- CONTENT_PAGES TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;

-- Create new policy using get_user_role()
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- CRON_JOB_LOGS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "super_admins_view_cron_logs" ON cron_job_logs;

-- Create new policy using get_user_role()
CREATE POLICY "super_admins_view_cron_logs"
ON cron_job_logs FOR SELECT
USING (get_user_role(auth.uid()) = 'super_admin');

-- ============================================================================
-- EMAIL_LOGS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_view_email_logs" ON email_logs;
DROP POLICY IF EXISTS "super_admins_view_email_logs" ON email_logs;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_view_email_logs"
ON email_logs FOR SELECT
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- EMAIL_TEMPLATES TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_manage_email_templates" ON email_templates;
DROP POLICY IF EXISTS "super_admins_manage_email_templates" ON email_templates;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_email_templates"
ON email_templates FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_access_all_events" ON events;
DROP POLICY IF EXISTS "super_admins_access_all_events" ON events;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_events"
ON events FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_manage_group_members" ON group_members;
DROP POLICY IF EXISTS "super_admins_manage_group_members" ON group_members;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_group_members"
ON group_members FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_manage_locations" ON locations;
DROP POLICY IF EXISTS "super_admins_manage_locations" ON locations;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_locations"
ON locations FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- RSVP_REMINDERS_SENT TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "hosts_view_rsvp_reminders" ON rsvp_reminders_sent;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_view_rsvp_reminders"
ON rsvp_reminders_sent FOR SELECT
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- RSVPS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "hosts_access_all_rsvps" ON rsvps;
DROP POLICY IF EXISTS "super_admins_access_all_rsvps" ON rsvps;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_rsvps"
ON rsvps FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- SCHEDULED_EMAILS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "hosts_manage_scheduled_emails" ON scheduled_emails;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_scheduled_emails"
ON scheduled_emails FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- SMS_LOGS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "hosts_view_sms_logs" ON sms_logs;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_view_sms_logs"
ON sms_logs FOR SELECT
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- TRANSPORTATION_MANIFESTS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "hosts_manage_manifests" ON transportation_manifests;

-- Create new policy using get_user_role()
CREATE POLICY "admins_hosts_manage_manifests"
ON transportation_manifests FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host'));

-- ============================================================================
-- WEBHOOK_DELIVERY_LOGS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "super_admins_view_webhook_logs" ON webhook_delivery_logs;
DROP POLICY IF EXISTS "super_admins_manage_webhook_logs" ON webhook_delivery_logs;

-- Create new policy using get_user_role()
CREATE POLICY "super_admins_manage_webhook_logs"
ON webhook_delivery_logs FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "super_admins_manage_webhooks" ON webhooks;

-- Create new policy using get_user_role()
CREATE POLICY "super_admins_manage_webhooks"
ON webhooks FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin');

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON MIGRATION '032_fix_all_rls_policies_users_table' IS 
'Fixes all RLS policies that query users table directly. Replaces direct queries with get_user_role() function calls to prevent "permission denied for table users" errors. Affects 16 tables: activities, audit_logs, content_pages, cron_job_logs, email_logs, email_templates, events, group_members, locations, rsvp_reminders_sent, rsvps, scheduled_emails, sms_logs, transportation_manifests, webhook_delivery_logs, webhooks.';
