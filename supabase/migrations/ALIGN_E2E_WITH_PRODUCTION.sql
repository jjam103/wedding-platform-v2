-- ============================================================================
-- E2E Database Schema Alignment Migration
-- Aligns E2E test database with production schema
-- Date: 2025-02-04
-- ============================================================================

-- SECTION 1: Fix system_settings table structure
-- ============================================================================
-- E2E has wrong structure (fixed columns), production has key-value store

-- Drop the incorrect E2E system_settings table if it exists
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Recreate with correct production structure
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON public.system_settings(is_public);

-- Add RLS policies for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage system settings"
  ON public.system_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read public settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category, is_public) VALUES
  ('wedding_date', '"2026-06-15"', 'Wedding date', 'general', true),
  ('venue_name', '"Costa Rica Resort"', 'Wedding venue name', 'general', true),
  ('couple_name_1', '"Partner 1"', 'First partner name', 'general', true),
  ('couple_name_2', '"Partner 2"', 'Second partner name', 'general', true),
  ('timezone', '"America/Costa_Rica"', 'Event timezone', 'general', true),
  ('send_rsvp_confirmations', 'true', 'Send RSVP confirmation emails', 'email', false),
  ('send_activity_reminders', 'true', 'Send activity reminder emails', 'email', false),
  ('send_deadline_reminders', 'true', 'Send deadline reminder emails', 'email', false),
  ('reminder_days_before', '7', 'Days before deadline to send reminders', 'email', false),
  ('require_photo_moderation', 'true', 'Require admin approval for guest photos', 'photos', false),
  ('max_photos_per_guest', '20', 'Maximum photos per guest', 'photos', false),
  ('allowed_photo_formats', '["jpg", "jpeg", "png", "heic"]', 'Allowed photo formats', 'photos', false),
  ('default_auth_method', '"email_matching"', 'Default guest authentication method', 'auth', false)
ON CONFLICT (key) DO NOTHING;

-- SECTION 2: Add missing sections.title column
-- ============================================================================
-- Production has this column, E2E is missing it

ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS title TEXT;

-- SECTION 3: Fix slug column nullable constraints
-- ============================================================================
-- Production has NOT NULL, E2E has nullable

-- Update any NULL slugs to generated values before adding constraint
UPDATE public.accommodations 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.activities 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.events 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE public.room_types 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Add NOT NULL constraints to match production
ALTER TABLE public.accommodations 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.activities 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.events 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.room_types 
ALTER COLUMN slug SET NOT NULL;

-- SECTION 4: Remove extra columns from E2E that don't exist in production
-- ============================================================================

-- Remove accommodations.event_id (not in production)
ALTER TABLE public.accommodations 
DROP COLUMN IF EXISTS event_id;

-- Remove guests.shuttle_assignment (not in production)
ALTER TABLE public.guests 
DROP COLUMN IF EXISTS shuttle_assignment;

-- Remove guests.auth_method (not in production)
ALTER TABLE public.guests 
DROP COLUMN IF EXISTS auth_method;

-- SECTION 5: Ensure vendor_bookings has correct columns
-- ============================================================================
-- E2E is missing some columns that production has

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS guest_count INTEGER;

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'flat_rate';

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS total_cost NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS host_subsidy NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS base_cost NUMERIC;

-- SECTION 6: Verify all critical tables exist
-- ============================================================================
-- These should already exist from previous migration, but verify

-- admin_users table (should exist from previous migration)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID REFERENCES public.admin_users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- email_history table (should exist from previous migration)
CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.email_templates(id),
  recipient_ids UUID[] NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_by UUID,
  error_message TEXT,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- guest_sessions table (should exist from previous migration)
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- magic_link_tokens table (should exist from previous migration)
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SECTION 7: Add RLS policies for new tables (if not already present)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

-- Service role policies (skip if already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Service role can manage admin users'
  ) THEN
    CREATE POLICY "Service role can manage admin users"
      ON public.admin_users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'email_history' 
    AND policyname = 'Service role can manage email history'
  ) THEN
    CREATE POLICY "Service role can manage email history"
      ON public.email_history
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guest_sessions' 
    AND policyname = 'Service role can manage guest sessions'
  ) THEN
    CREATE POLICY "Service role can manage guest sessions"
      ON public.guest_sessions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'magic_link_tokens' 
    AND policyname = 'Service role can manage magic link tokens'
  ) THEN
    CREATE POLICY "Service role can manage magic link tokens"
      ON public.magic_link_tokens
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- SECTION 8: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_email_history_sent_at ON public.email_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_history_delivery_status ON public.email_history(delivery_status);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_guest_id ON public.guest_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON public.guest_sessions(token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_expires_at ON public.guest_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_token ON public.magic_link_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_guest_id ON public.magic_link_tokens(guest_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON public.magic_link_tokens(expires_at);

-- SECTION 9: Add triggers for updated_at columns
-- ============================================================================

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_history_updated_at
  BEFORE UPDATE ON public.email_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_sessions_updated_at
  BEFORE UPDATE ON public.guest_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SECTION 10: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.system_settings IS 'Application-wide configuration settings (key-value store)';
COMMENT ON TABLE public.admin_users IS 'Administrative users with role-based access';
COMMENT ON TABLE public.email_history IS 'Email delivery history and tracking';
COMMENT ON TABLE public.guest_sessions IS 'Guest authentication sessions';
COMMENT ON TABLE public.magic_link_tokens IS 'Magic link authentication tokens';

COMMENT ON COLUMN public.sections.title IS 'Optional title for the section';
COMMENT ON COLUMN public.accommodations.slug IS 'URL-friendly slug for accommodation';
COMMENT ON COLUMN public.activities.slug IS 'URL-friendly slug for activity';
COMMENT ON COLUMN public.events.slug IS 'URL-friendly slug for event';
COMMENT ON COLUMN public.room_types.slug IS 'URL-friendly slug for room type';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration aligns the E2E test database schema with production:
-- 1. ✅ Fixed system_settings table structure (key-value store)
-- 2. ✅ Added missing sections.title column
-- 3. ✅ Fixed slug column nullable constraints
-- 4. ✅ Removed extra columns not in production
-- 5. ✅ Ensured vendor_bookings has all columns
-- 6. ✅ Verified all critical tables exist
-- 7. ✅ Added RLS policies
-- 8. ✅ Added performance indexes
-- 9. ✅ Added updated_at triggers
-- 10. ✅ Added documentation comments
-- ============================================================================
