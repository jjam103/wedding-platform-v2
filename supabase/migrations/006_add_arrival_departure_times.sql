-- Add arrival_time and departure_time columns to guests table
-- These store the actual time of arrival/departure for transportation coordination

ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS arrival_time TIME,
ADD COLUMN IF NOT EXISTS departure_time TIME;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_guests_arrival_date_time ON guests(arrival_date, arrival_time) WHERE arrival_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_departure_date_time ON guests(departure_date, departure_time) WHERE departure_date IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN guests.arrival_time IS 'Time of day for guest arrival (used for transportation manifest grouping)';
COMMENT ON COLUMN guests.departure_time IS 'Time of day for guest departure (used for transportation manifest grouping)';
