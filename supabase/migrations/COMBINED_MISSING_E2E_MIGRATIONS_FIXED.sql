-- Combined Missing Migrations for E2E Test Database (FIXED)
-- Generated: 2026-02-04
-- Apply these migrations in the Supabase SQL Editor
-- Database: https://olcqaawrpnanioaorfer.supabase.co
-- 
-- FIXED: Replaced problematic dollar-quote syntax with $$function_body$$

-- ============================================
-- Migration: 034_add_section_title.sql
-- ============================================

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN sections.title IS 'Optional title for the section, displayed above the content';


-- ============================================
-- Migration: 036_add_auth_method_fields.sql
-- ============================================

ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (auth_method IN ('email_matching', 'magic_link'));

ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS default_auth_method TEXT NOT NULL DEFAULT 'email_matching' 
CHECK (default_auth_method IN ('email_matching', 'magic_link'));

CREATE INDEX IF NOT EXISTS idx_guests_auth_method ON guests(auth_method);
CREATE INDEX IF NOT EXISTS idx_guests_email_auth_method ON guests(email, auth_method) WHERE email IS NOT NULL;

COMMENT ON COLUMN guests.auth_method IS 'Authentication method for guest login: email_matching or magic_link';
COMMENT ON COLUMN system_settings.default_auth_method IS 'Default authentication method for new guests';


-- ============================================
-- Migration: 037_create_magic_link_tokens_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_guest_id ON magic_link_tokens(guest_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_verification ON magic_link_tokens(token, expires_at, used) WHERE used = FALSE;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_magic_link_tokens()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM magic_link_tokens WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function to mark token as used
CREATE OR REPLACE FUNCTION mark_magic_link_token_used(token_value TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  UPDATE magic_link_tokens
  SET used = TRUE, used_at = NOW()
  WHERE token = token_value AND used = FALSE AND expires_at > NOW()
  RETURNING * INTO token_record;
  
  RETURN FOUND;
END;
$$;

ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage magic link tokens" ON magic_link_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view their own magic link tokens" ON magic_link_tokens FOR SELECT TO authenticated USING (guest_id IN (SELECT id FROM guests WHERE email = auth.jwt() ->> 'email'));


-- ============================================
-- Migration: 038_create_admin_users_table.sql
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_users_select_policy ON admin_users FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.role = 'owner' AND au.status = 'active'));
CREATE POLICY admin_users_insert_policy ON admin_users FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.role = 'owner' AND au.status = 'active'));
CREATE POLICY admin_users_update_policy ON admin_users FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.role = 'owner' AND au.status = 'active'));
CREATE POLICY admin_users_delete_policy ON admin_users FOR DELETE USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.role = 'owner' AND au.status = 'active') AND ((role != 'owner') OR (SELECT COUNT(*) FROM admin_users WHERE role = 'owner' AND status = 'active') > 1));


-- ============================================
-- Migration: 038_create_guest_sessions_table.sql
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions(token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_id ON guest_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires_at ON guest_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_verification ON guest_sessions(token, expires_at, used) WHERE used = FALSE;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM guest_sessions WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function to mark session as used
CREATE OR REPLACE FUNCTION mark_guest_session_used(session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE guest_sessions SET used = TRUE, used_at = NOW() WHERE token = session_token AND used = FALSE;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY guest_sessions_service_role_all ON guest_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY guest_sessions_authenticated_read ON guest_sessions FOR SELECT TO authenticated USING (guest_id = auth.uid()::uuid);


-- ============================================
-- Migration: 038_add_slug_columns_to_events_activities.sql
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(regexp_replace(NEW.name, '[^\w\s-]', '', 'g'), '_', '-', 'g'), '\s+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_generate_slug ON events;
CREATE TRIGGER events_generate_slug BEFORE INSERT OR UPDATE ON events FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();

DROP TRIGGER IF EXISTS activities_generate_slug ON activities;
CREATE TRIGGER activities_generate_slug BEFORE INSERT OR UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();


-- ============================================
-- Migration: 039_add_slug_columns_to_accommodations_room_types.sql
-- ============================================

ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE room_types ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_accommodations_slug ON accommodations(slug);
CREATE INDEX IF NOT EXISTS idx_room_types_slug ON room_types(slug);

DROP TRIGGER IF EXISTS accommodations_generate_slug ON accommodations;
CREATE TRIGGER accommodations_generate_slug BEFORE INSERT OR UPDATE ON accommodations FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();

DROP TRIGGER IF EXISTS room_types_generate_slug ON room_types;
CREATE TRIGGER room_types_generate_slug BEFORE INSERT OR UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION generate_slug_from_name();


-- ============================================
-- Migration: 040_create_email_history_table.sql
-- ============================================

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

CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON email_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_history_scheduled_for ON email_history(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_history_delivery_status ON email_history(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_history_template_id ON email_history(template_id);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_by ON email_history(sent_by);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_ids ON email_history USING GIN(recipient_ids);

ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_history_select_policy ON email_history FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.status = 'active'));
CREATE POLICY email_history_insert_policy ON email_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.id = auth.uid() AND au.status = 'active'));
CREATE POLICY email_history_update_policy ON email_history FOR UPDATE USING (TRUE);


-- ============================================
-- Migration: 048_add_soft_delete_columns.sql
-- ============================================

ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE columns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE sections ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE columns ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE photos ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_content_pages_not_deleted ON content_pages(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sections_not_deleted ON sections(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_columns_not_deleted ON columns(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_not_deleted ON events(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_not_deleted ON activities(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_photos_not_deleted ON photos(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rsvps_not_deleted ON rsvps(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_content_pages_deleted ON content_pages(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sections_deleted ON sections(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_columns_deleted ON columns(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_deleted ON events(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deleted ON activities(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rsvps_deleted ON rsvps(deleted_at) WHERE deleted_at IS NOT NULL;


-- ============================================
-- Migration: 050_create_system_settings_table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- Migration: 051_add_base_cost_to_vendor_bookings.sql
-- ============================================

ALTER TABLE vendor_bookings ADD COLUMN IF NOT EXISTS base_cost DECIMAL(10,2);


-- ============================================
-- Migration: 051_add_event_id_to_accommodations.sql
-- ============================================

ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_accommodations_event_id ON accommodations(event_id);


-- ============================================
-- COMPLETE
-- ============================================

-- All migrations applied successfully
