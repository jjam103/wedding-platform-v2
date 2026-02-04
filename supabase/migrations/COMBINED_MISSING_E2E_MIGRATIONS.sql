-- Combined Missing Migrations for E2E Test Database
-- Generated: 2026-02-04T20:02:13.266Z
-- Apply these migrations in the Supabase SQL Editor
-- Database: https://olcqaawrpnanioaorfer.supabase.co


-- ============================================
-- Migration: 034_add_section_title.sql
-- ============================================

-- Migration: Add optional title field to sections table
-- Allows sections to have descriptive titles for better organization

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment
COMMENT ON COLUMN sections.title IS 'Optional title for the section, displayed above the content';



-- ============================================
-- Migration: 036_add_auth_method_fields.sql
-- ============================================

-- Migration: Add authentication method fields for guest authentication
-- Requirements: 5.1, 5.2, 5.3, 22.1, 22.2
-- Task: 4.1 - Create migration for auth_method field

-- Add auth_method column to guests table
-- Supports two authentication methods:
-- - 'email_matching': Guest logs in by entering email that matches their guest record
-- - 'magic_link': Guest receives a one-time passwordless login link via email
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (auth_method IN ('email_matching', 'magic_link'));

-- Add default_auth_method to system_settings table
-- This sets the default authentication method for all new guests
-- Can be overridden per guest using the auth_method column
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS default_auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (default_auth_method IN ('email_matching', 'magic_link'));

-- Create index for auth_method queries
-- This improves performance when filtering guests by authentication method
CREATE INDEX IF NOT EXISTS idx_guests_auth_method ON guests(auth_method);

-- Create index for email + auth_method combination
-- This optimizes the email matching authentication flow
CREATE INDEX IF NOT EXISTS idx_guests_email_auth_method ON guests(email, auth_method) 
WHERE email IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN guests.auth_method IS 'Authentication method for guest login: email_matching or magic_link';
COMMENT ON COLUMN system_settings.default_auth_method IS 'Default authentication method for new guests';
COMMENT ON INDEX idx_guests_auth_method IS 'Index for filtering guests by authentication method';
COMMENT ON INDEX idx_guests_email_auth_method IS 'Composite index for email matching authentication lookups';



-- ============================================
-- Migration: 037_create_magic_link_tokens_table.sql
-- ============================================

-- Migration: Create magic_link_tokens table for passwordless authentication
-- Requirements: 5.3, 5.9
-- Task: 4.2 - Create magic_link_tokens table

-- Create magic_link_tokens table
-- Stores one-time use tokens for passwordless guest authentication
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token and guest association
  token TEXT NOT NULL UNIQUE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  
  -- Token lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
-- Index for token lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);

-- Index for guest_id lookups (for viewing guest's token history)
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_guest_id ON magic_link_tokens(guest_id);

-- Index for finding expired tokens (for cleanup)
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);

-- Composite index for token verification query (token + expires_at + used)
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_verification 
ON magic_link_tokens(token, expires_at, used) 
WHERE used = FALSE;

-- Create function to clean up expired tokens
-- This function deletes tokens that have expired more than 24 hours ago
CREATE OR REPLACE FUNCTION cleanup_expired_magic_link_tokens()
RETURNS void AS $
BEGIN
  DELETE FROM magic_link_tokens
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark token as used
-- This ensures atomic update of used status and timestamp
CREATE OR REPLACE FUNCTION mark_magic_link_token_used(token_value TEXT)
RETURNS BOOLEAN AS $
DECLARE
  token_record RECORD;
BEGIN
  -- Update token and return whether it was successful
  UPDATE magic_link_tokens
  SET used = TRUE, used_at = NOW()
  WHERE token = token_value
    AND used = FALSE
    AND expires_at > NOW()
  RETURNING * INTO token_record;
  
  -- Return true if token was found and updated
  RETURN FOUND;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to clean up expired tokens (runs daily at 2 AM)
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, cleanup should be done via application cron job
DO $
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule daily cleanup at 2 AM
    PERFORM cron.schedule(
      'cleanup-expired-magic-link-tokens',
      '0 2 * * *',
      $$ SELECT cleanup_expired_magic_link_tokens(); $
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- pg_cron not available, skip scheduling
    RAISE NOTICE 'pg_cron extension not available, skipping scheduled cleanup job';
END;
$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only allow service role to manage tokens
-- Guest users should never directly access this table
CREATE POLICY "Service role can manage magic link tokens"
  ON magic_link_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can view their own tokens (for debugging/admin)
CREATE POLICY "Users can view their own magic link tokens"
  ON magic_link_tokens
  FOR SELECT
  TO authenticated
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Comments for documentation
COMMENT ON TABLE magic_link_tokens IS 'One-time use tokens for passwordless guest authentication';
COMMENT ON COLUMN magic_link_tokens.token IS 'Cryptographically secure random token (32 bytes hex)';
COMMENT ON COLUMN magic_link_tokens.guest_id IS 'Guest associated with this token';
COMMENT ON COLUMN magic_link_tokens.expires_at IS 'Token expiration timestamp (15 minutes from creation)';
COMMENT ON COLUMN magic_link_tokens.used IS 'Whether token has been used (single-use only)';
COMMENT ON COLUMN magic_link_tokens.used_at IS 'Timestamp when token was used';
COMMENT ON COLUMN magic_link_tokens.ip_address IS 'IP address of token request (for security audit)';
COMMENT ON COLUMN magic_link_tokens.user_agent IS 'User agent of token request (for security audit)';
COMMENT ON FUNCTION cleanup_expired_magic_link_tokens() IS 'Deletes expired tokens older than 24 hours';
COMMENT ON FUNCTION mark_magic_link_token_used(TEXT) IS 'Atomically marks token as used and returns success status';



-- ============================================
-- Migration: 038_add_slug_columns_to_events_activities.sql
-- ============================================

-- Migration: Add slug columns to events and activities tables
-- Phase 7: Slug Management and Dynamic Routes
-- Requirements: 24.1, 24.3, 24.4, 24.5

-- Add slug column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for slug lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's NULL or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.name, '[^\w\s-]', '', 'g'),  -- Remove special chars
          '_', '-', 'g'                                     -- Replace underscores
        ),
        '\s+', '-', 'g'                                     -- Replace spaces
      )
    );
    
    -- Remove leading/trailing hyphens
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');
    
    -- Replace multiple consecutive hyphens with single hyphen
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for events table
DROP TRIGGER IF EXISTS events_generate_slug ON events;
CREATE TRIGGER events_generate_slug
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Create trigger for activities table
DROP TRIGGER IF EXISTS activities_generate_slug ON activities;
CREATE TRIGGER activities_generate_slug
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Migrate existing records: Generate slugs for events without slugs
DO $$
DECLARE
  event_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR event_record IN 
    SELECT id, name FROM events WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(event_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = unique_slug AND id != event_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update event with unique slug
    UPDATE events SET slug = unique_slug WHERE id = event_record.id;
  END LOOP;
END $$;

-- Migrate existing records: Generate slugs for activities without slugs
DO $$
DECLARE
  activity_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR activity_record IN 
    SELECT id, name FROM activities WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(activity_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM activities WHERE slug = unique_slug AND id != activity_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update activity with unique slug
    UPDATE activities SET slug = unique_slug WHERE id = activity_record.id;
  END LOOP;
END $$;

-- Make slug columns NOT NULL after migration (all records now have slugs)
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN events.slug IS 'URL-safe slug generated from event name, used for friendly URLs';
COMMENT ON COLUMN activities.slug IS 'URL-safe slug generated from activity name, used for friendly URLs';
COMMENT ON FUNCTION generate_slug_from_name() IS 'Automatically generates URL-safe slugs from name field on insert/update';



-- ============================================
-- Migration: 038_create_admin_users_table.sql
-- ============================================

-- Migration: Create admin_users table for admin user management
-- Requirements: 3.1, 3.3
-- Phase 8, Task 33.1

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Add updated_at trigger
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view all admin users
CREATE POLICY admin_users_select_policy ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can insert admin users
CREATE POLICY admin_users_insert_policy ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can update admin users
CREATE POLICY admin_users_update_policy ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
  );

-- Policy: Owners can delete admin users (except last owner)
CREATE POLICY admin_users_delete_policy ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'owner'
      AND au.status = 'active'
    )
    AND (
      -- Prevent deletion of last owner
      (role != 'owner') OR
      (SELECT COUNT(*) FROM admin_users WHERE role = 'owner' AND status = 'active') > 1
    )
  );

-- Add comment
COMMENT ON TABLE admin_users IS 'Admin users with role-based access control for wedding management';



-- ============================================
-- Migration: 038_create_guest_sessions_table.sql
-- ============================================

-- Migration 038: Create guest_sessions table for guest authentication
-- Requirements: 5.2, 5.8, 22.4
-- Task: 5.1

-- Create guest_sessions table
CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE guest_sessions IS 'Stores guest authentication sessions for both email matching and magic link authentication';
COMMENT ON COLUMN guest_sessions.id IS 'Unique identifier for the session';
COMMENT ON COLUMN guest_sessions.guest_id IS 'Foreign key to guests table';
COMMENT ON COLUMN guest_sessions.token IS 'Unique session token (32 bytes)';
COMMENT ON COLUMN guest_sessions.expires_at IS 'Session expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN guest_sessions.used IS 'Whether the session has been used (for single-use enforcement)';
COMMENT ON COLUMN guest_sessions.used_at IS 'Timestamp when session was first used';
COMMENT ON COLUMN guest_sessions.ip_address IS 'IP address of the client for security audit';
COMMENT ON COLUMN guest_sessions.user_agent IS 'User agent string for security audit';

-- Create indexes for performance
CREATE INDEX idx_guest_sessions_token ON guest_sessions(token);
CREATE INDEX idx_guest_sessions_guest_id ON guest_sessions(guest_id);
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions(expires_at);
CREATE INDEX idx_guest_sessions_verification ON guest_sessions(token, expires_at, used) WHERE used = FALSE;

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_sessions
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_guest_sessions() IS 'Deletes guest sessions that expired more than 24 hours ago';

-- Create function to mark session as used
CREATE OR REPLACE FUNCTION mark_guest_session_used(session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE guest_sessions
  SET used = TRUE, used_at = NOW()
  WHERE token = session_token AND used = FALSE;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_guest_session_used(TEXT) IS 'Marks a guest session as used atomically, returns TRUE if successful';

-- Enable Row Level Security
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can manage all sessions
CREATE POLICY guest_sessions_service_role_all ON guest_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can view their own sessions
CREATE POLICY guest_sessions_authenticated_read ON guest_sessions
  FOR SELECT
  TO authenticated
  USING (guest_id = auth.uid()::uuid);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_guest_sessions_updated_at
  BEFORE UPDATE ON guest_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Schedule cleanup job (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-expired-guest-sessions',
      '0 2 * * *', -- Run at 2 AM daily
      $$SELECT cleanup_expired_guest_sessions()$$
    );
  END IF;
END $$;



-- ============================================
-- Migration: 039_add_slug_columns_to_accommodations_room_types.sql
-- ============================================

-- Migration: Add slug columns to accommodations and room_types tables
-- Universal Slug Support Implementation
-- Requirements: 24.1, 24.3, 24.4, 24.5

-- Add slug column to accommodations table
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to room_types table
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for slug lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_accommodations_slug ON accommodations(slug);
CREATE INDEX IF NOT EXISTS idx_room_types_slug ON room_types(slug);

-- Reuse the existing generate_slug_from_name function (created in migration 038)
-- This function generates URL-safe slugs from the name field

-- Create trigger for accommodations table
DROP TRIGGER IF EXISTS accommodations_generate_slug ON accommodations;
CREATE TRIGGER accommodations_generate_slug
  BEFORE INSERT OR UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Create trigger for room_types table
DROP TRIGGER IF EXISTS room_types_generate_slug ON room_types;
CREATE TRIGGER room_types_generate_slug
  BEFORE INSERT OR UPDATE ON room_types
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Migrate existing records: Generate slugs for accommodations without slugs
DO $$
DECLARE
  accommodation_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR accommodation_record IN 
    SELECT id, name FROM accommodations WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(accommodation_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM accommodations WHERE slug = unique_slug AND id != accommodation_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update accommodation with unique slug
    UPDATE accommodations SET slug = unique_slug WHERE id = accommodation_record.id;
  END LOOP;
END $$;

-- Migrate existing records: Generate slugs for room_types without slugs
DO $$
DECLARE
  room_type_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR room_type_record IN 
    SELECT id, name FROM room_types WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(room_type_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM room_types WHERE slug = unique_slug AND id != room_type_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update room_type with unique slug
    UPDATE room_types SET slug = unique_slug WHERE id = room_type_record.id;
  END LOOP;
END $$;

-- Make slug columns NOT NULL after migration (all records now have slugs)
ALTER TABLE accommodations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE room_types ALTER COLUMN slug SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN accommodations.slug IS 'URL-safe slug generated from accommodation name, used for friendly URLs';
COMMENT ON COLUMN room_types.slug IS 'URL-safe slug generated from room type name, used for friendly URLs';



-- ============================================
-- Migration: 040_create_email_history_table.sql
-- ============================================

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



-- ============================================
-- Migration: 048_add_soft_delete_columns.sql
-- ============================================

-- Migration: Add Soft Delete Support
-- Description: Adds deleted_at columns to major tables for soft delete functionality
-- Requirements: 29.7, 29.8

-- Add deleted_at column to content_pages table
ALTER TABLE content_pages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to sections table
ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to columns table
ALTER TABLE columns 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to rsvps table
ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_by column to track who deleted the record
ALTER TABLE content_pages 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE columns 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create partial indexes for soft delete queries (only index non-deleted records)
-- This improves query performance for active records
CREATE INDEX IF NOT EXISTS idx_content_pages_not_deleted 
ON content_pages(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sections_not_deleted 
ON sections(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_not_deleted 
ON columns(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_not_deleted 
ON events(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_not_deleted 
ON activities(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_photos_not_deleted 
ON photos(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rsvps_not_deleted 
ON rsvps(id) 
WHERE deleted_at IS NULL;

-- Create indexes for deleted records (for deleted items manager)
CREATE INDEX IF NOT EXISTS idx_content_pages_deleted 
ON content_pages(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sections_deleted 
ON sections(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_columns_deleted 
ON columns(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted 
ON events(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_deleted 
ON activities(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photos_deleted 
ON photos(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rsvps_deleted 
ON rsvps(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Update RLS policies to filter soft-deleted records
-- Content Pages: Only show non-deleted pages to guests
DROP POLICY IF EXISTS "Guests can view published content pages" ON content_pages;
CREATE POLICY "Guests can view published content pages" 
ON content_pages FOR SELECT 
USING (status = 'published' AND deleted_at IS NULL);

-- Sections: Only show non-deleted sections
DROP POLICY IF EXISTS "Guests can view sections" ON sections;
CREATE POLICY "Guests can view sections" 
ON sections FOR SELECT 
USING (deleted_at IS NULL);

-- Columns: Only show non-deleted columns
DROP POLICY IF EXISTS "Guests can view columns" ON columns;
CREATE POLICY "Guests can view columns" 
ON columns FOR SELECT 
USING (deleted_at IS NULL);

-- Events: Only show non-deleted events
DROP POLICY IF EXISTS "Guests can view events" ON events;
CREATE POLICY "Guests can view events" 
ON events FOR SELECT 
USING (deleted_at IS NULL);

-- Activities: Only show non-deleted activities
DROP POLICY IF EXISTS "Guests can view activities" ON activities;
CREATE POLICY "Guests can view activities" 
ON activities FOR SELECT 
USING (deleted_at IS NULL);

-- Photos: Only show non-deleted photos
DROP POLICY IF EXISTS "Guests can view approved photos" ON photos;
CREATE POLICY "Guests can view approved photos" 
ON photos FOR SELECT 
USING (moderation_status = 'approved' AND deleted_at IS NULL);

-- Admin policies: Admins can see deleted items (for deleted items manager)
CREATE POLICY "Admins can view deleted content pages" 
ON content_pages FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted sections" 
ON sections FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted columns" 
ON columns FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted events" 
ON events FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted activities" 
ON activities FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted photos" 
ON photos FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

-- Add comments for documentation
COMMENT ON COLUMN content_pages.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN content_pages.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN sections.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN sections.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN columns.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN columns.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN events.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN events.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN activities.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN activities.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN photos.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN photos.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN rsvps.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN rsvps.deleted_by IS 'User who soft deleted this record.';



-- ============================================
-- Migration: 051_add_base_cost_to_vendor_bookings.sql
-- ============================================

-- Migration: Add base_cost column to vendor_bookings table
-- This allows auto-calculation of total_cost based on pricing model

-- Add base_cost column
ALTER TABLE vendor_bookings 
ADD COLUMN IF NOT EXISTS base_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (base_cost >= 0);

-- Update existing records to set base_cost = total_cost (for flat_rate bookings)
UPDATE vendor_bookings 
SET base_cost = total_cost 
WHERE base_cost = 0;

-- Remove the constraint that requires either activity_id or event_id
-- (both can now be null for general vendor bookings)
ALTER TABLE vendor_bookings 
DROP CONSTRAINT IF EXISTS booking_target;

-- Add comment
COMMENT ON COLUMN vendor_bookings.base_cost IS 'Base cost per unit (flat rate or per guest). Total cost is calculated as: flat_rate = base_cost, per_guest = base_cost * guest_count';



-- ============================================
-- Migration: 051_add_default_auth_method.sql
-- ============================================

-- Add default_auth_method to system_settings table
-- Migration: 051_add_default_auth_method
-- Description: Adds default authentication method configuration for guests

-- Add default_auth_method column if it doesn't exist
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS default_auth_method TEXT DEFAULT 'email_matching';

-- Add constraint to ensure valid values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_default_auth_method'
  ) THEN
    ALTER TABLE system_settings 
    ADD CONSTRAINT check_default_auth_method 
    CHECK (default_auth_method IN ('email_matching', 'magic_link'));
  END IF;
END $$;

-- Insert default setting if not exists
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'default_auth_method',
  'email_matching',
  'Default authentication method for new guests',
  'authentication',
  false
)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for RSVP queries
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_activity_id ON rsvps(activity_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON rsvps(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);

-- Add comment
COMMENT ON COLUMN system_settings.default_auth_method IS 'Default authentication method for new guests: email_matching or magic_link';



-- ============================================
-- Migration: 051_add_event_id_to_accommodations.sql
-- ============================================

-- Add event_id column to accommodations table
-- This allows linking accommodations to specific events

ALTER TABLE public.accommodations
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_accommodations_event_id ON public.accommodations(event_id);

-- Add comment
COMMENT ON COLUMN public.accommodations.event_id IS 'Optional link to the event this accommodation is associated with';


