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
