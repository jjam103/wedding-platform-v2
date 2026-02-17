-- Fix guest email constraint
-- This migration drops and recreates the valid_guest_email constraint
-- to ensure it works correctly in all environments

-- Drop the existing constraint if it exists
ALTER TABLE guests DROP CONSTRAINT IF EXISTS valid_guest_email;

-- Recreate the constraint with the correct regex pattern
-- Pattern allows: letters, numbers, dots, underscores, percent, plus, hyphen in local part
-- Requires @ symbol, domain with dots, and 2+ letter TLD
ALTER TABLE guests ADD CONSTRAINT valid_guest_email 
  CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT valid_guest_email ON guests IS 
  'Validates email format: allows NULL or valid email addresses with standard characters';
