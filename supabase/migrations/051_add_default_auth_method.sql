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
