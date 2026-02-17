-- Migration: Add unique constraint on guest_sessions.token
-- This prevents duplicate sessions with the same token from being created
-- Requirement: 5.2, 22.4
-- Task: Pattern 1 Fix

-- Add unique constraint on token column
ALTER TABLE guest_sessions
ADD CONSTRAINT guest_sessions_token_unique UNIQUE (token);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT guest_sessions_token_unique ON guest_sessions IS 
'Ensures each session token is unique. Prevents duplicate sessions and simplifies middleware validation.';
