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
COMMENT ON INDEX idx_guests_email_auth_method IS 'Composite index for email matching authentication lookups';;
