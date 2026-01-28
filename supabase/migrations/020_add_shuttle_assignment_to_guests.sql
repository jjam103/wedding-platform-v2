-- Add shuttle_assignment column to guests table for transportation coordination
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS shuttle_assignment VARCHAR(100);

-- Add comment
COMMENT ON COLUMN guests.shuttle_assignment IS 'Shuttle or vehicle assignment for transportation coordination';
