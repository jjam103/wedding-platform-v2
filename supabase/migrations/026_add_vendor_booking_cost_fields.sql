-- Migration: Add cost and subsidy fields to vendor_bookings table
-- Date: 2025-01-30

-- Add new columns to vendor_bookings table
ALTER TABLE vendor_bookings
  ADD COLUMN IF NOT EXISTS guest_count INTEGER CHECK (guest_count IS NULL OR guest_count >= 0),
  ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'flat_rate' CHECK (pricing_model IN ('flat_rate', 'per_guest')),
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  ADD COLUMN IF NOT EXISTS host_subsidy NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (host_subsidy <= total_cost);

-- Add comment for documentation
COMMENT ON COLUMN vendor_bookings.guest_count IS 'Number of guests for per-guest pricing model';
COMMENT ON COLUMN vendor_bookings.pricing_model IS 'flat_rate: fixed cost, per_guest: cost per attendee';
COMMENT ON COLUMN vendor_bookings.total_cost IS 'Total cost for this vendor booking';
COMMENT ON COLUMN vendor_bookings.host_subsidy IS 'Amount host will subsidize for this booking';
