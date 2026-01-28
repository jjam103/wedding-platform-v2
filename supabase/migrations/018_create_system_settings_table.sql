-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wedding information
  wedding_date TIMESTAMPTZ,
  venue_name TEXT,
  couple_name_1 TEXT,
  couple_name_2 TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Costa_Rica',
  
  -- Email notification preferences
  send_rsvp_confirmations BOOLEAN NOT NULL DEFAULT true,
  send_activity_reminders BOOLEAN NOT NULL DEFAULT true,
  send_deadline_reminders BOOLEAN NOT NULL DEFAULT true,
  reminder_days_before INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days_before >= 1 AND reminder_days_before <= 30),
  
  -- Photo gallery settings
  require_photo_moderation BOOLEAN NOT NULL DEFAULT true,
  max_photos_per_guest INTEGER NOT NULL DEFAULT 20 CHECK (max_photos_per_guest >= 1 AND max_photos_per_guest <= 100),
  allowed_photo_formats TEXT[] NOT NULL DEFAULT ARRAY['jpg', 'jpeg', 'png', 'heic'],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert settings (only if none exist)
CREATE POLICY "Allow authenticated users to insert settings"
  ON system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM system_settings));

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings"
  ON system_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Insert default settings
INSERT INTO system_settings (
  timezone,
  send_rsvp_confirmations,
  send_activity_reminders,
  send_deadline_reminders,
  reminder_days_before,
  require_photo_moderation,
  max_photos_per_guest,
  allowed_photo_formats
) VALUES (
  'America/Costa_Rica',
  true,
  true,
  true,
  7,
  true,
  20,
  ARRAY['jpg', 'jpeg', 'png', 'heic']
) ON CONFLICT DO NOTHING;
