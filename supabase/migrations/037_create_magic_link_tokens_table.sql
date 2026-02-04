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
