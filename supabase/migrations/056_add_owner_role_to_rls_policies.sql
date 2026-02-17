-- Migration: Add 'owner' role to RLS policies
-- Issue: RLS policies only accept 'super_admin' and 'host' roles, but admin_users table uses 'owner' role
-- Solution: Update all RLS policies to also accept 'owner' role
-- Date: 2026-02-13

-- Content Pages
DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Events
DROP POLICY IF EXISTS "hosts_manage_events" ON events;
CREATE POLICY "hosts_manage_events"
ON events FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Activities
DROP POLICY IF EXISTS "hosts_manage_activities" ON activities;
CREATE POLICY "hosts_manage_activities"
ON activities FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Sections
DROP POLICY IF EXISTS "hosts_manage_sections" ON sections;
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Columns
DROP POLICY IF EXISTS "hosts_manage_columns" ON columns;
CREATE POLICY "hosts_manage_columns"
ON columns FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Guests
DROP POLICY IF EXISTS "hosts_access_all_guests" ON guests;
CREATE POLICY "hosts_access_all_guests"
ON guests FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Guest Groups
DROP POLICY IF EXISTS "hosts_manage_guest_groups" ON guest_groups;
CREATE POLICY "hosts_manage_guest_groups"
ON guest_groups FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Locations
DROP POLICY IF EXISTS "hosts_manage_locations" ON locations;
CREATE POLICY "hosts_manage_locations"
ON locations FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Accommodations
DROP POLICY IF EXISTS "hosts_manage_accommodations" ON accommodations;
CREATE POLICY "hosts_manage_accommodations"
ON accommodations FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Room Types
DROP POLICY IF EXISTS "hosts_manage_room_types" ON room_types;
CREATE POLICY "hosts_manage_room_types"
ON room_types FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Photos
DROP POLICY IF EXISTS "hosts_manage_photos" ON photos;
CREATE POLICY "hosts_manage_photos"
ON photos FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Gallery Settings
DROP POLICY IF EXISTS "hosts_manage_gallery_settings" ON gallery_settings;
CREATE POLICY "hosts_manage_gallery_settings"
ON gallery_settings FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Vendors
DROP POLICY IF EXISTS "hosts_manage_vendors" ON vendors;
CREATE POLICY "hosts_manage_vendors"
ON vendors FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Email Templates
DROP POLICY IF EXISTS "hosts_manage_email_templates" ON email_templates;
CREATE POLICY "hosts_manage_email_templates"
ON email_templates FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Email Queue
DROP POLICY IF EXISTS "hosts_manage_email_queue" ON email_queue;
CREATE POLICY "hosts_manage_email_queue"
ON email_queue FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- System Settings
DROP POLICY IF EXISTS "hosts_manage_system_settings" ON system_settings;
CREATE POLICY "hosts_manage_system_settings"
ON system_settings FOR ALL
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Users (for viewing)
DROP POLICY IF EXISTS "hosts_view_all_users" ON users;
CREATE POLICY "hosts_view_all_users"
ON users FOR SELECT
USING (get_user_role(auth.uid()) IN ('super_admin', 'host', 'owner'));

-- Comment
COMMENT ON POLICY "hosts_manage_content_pages" ON content_pages IS 'Updated to accept owner role from admin_users table';
