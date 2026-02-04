-- Create system_settings table for application configuration
-- Migration: 050_create_system_settings_table.sql

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

-- Add RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin users can read all settings
CREATE POLICY "Admin users can read all settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can insert settings
CREATE POLICY "Admin users can insert settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can update settings
CREATE POLICY "Admin users can update settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin users can delete settings
CREATE POLICY "Admin users can delete settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public users can read public settings
CREATE POLICY "Public users can read public settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category, is_public) VALUES
  ('site_name', '"Costa Rica Wedding"', 'Name of the wedding site', 'general', true),
  ('wedding_date', '"2026-06-15"', 'Wedding date', 'general', true),
  ('rsvp_deadline', '"2026-05-01"', 'RSVP deadline date', 'general', true),
  ('max_guests_per_group', '10', 'Maximum guests allowed per group', 'limits', false),
  ('enable_guest_photo_uploads', 'true', 'Allow guests to upload photos', 'features', false),
  ('photo_moderation_required', 'true', 'Require admin approval for guest photos', 'features', false),
  ('enable_dietary_restrictions', 'true', 'Collect dietary restrictions in RSVPs', 'features', false),
  ('enable_plus_ones', 'true', 'Allow guests to bring plus ones', 'features', false),
  ('default_email_from', '"noreply@wedding.com"', 'Default from email address', 'email', false),
  ('smtp_configured', 'false', 'Whether SMTP is configured', 'email', false)
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.system_settings IS 'Application-wide configuration settings';
