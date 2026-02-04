-- Migration: Add base_cost column to vendor_bookings table
-- This allows auto-calculation of total_cost based on pricing model

-- Add base_cost column
ALTER TABLE vendor_bookings 
ADD COLUMN IF NOT EXISTS base_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (base_cost >= 0);

-- Update existing records to set base_cost = total_cost (for flat_rate bookings)
UPDATE vendor_bookings 
SET base_cost = total_cost 
WHERE base_cost = 0;

-- Remove the constraint that requires either activity_id or event_id
-- (both can now be null for general vendor bookings)
ALTER TABLE vendor_bookings 
DROP CONSTRAINT IF EXISTS booking_target;

-- Add comment
COMMENT ON COLUMN vendor_bookings.base_cost IS 'Base cost per unit (flat rate or per guest). Total cost is calculated as: flat_rate = base_cost, per_guest = base_cost * guest_count';
