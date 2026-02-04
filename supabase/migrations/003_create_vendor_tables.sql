-- Migration: Create vendor and budget management tables
-- Requirements: 7.1, 7.3, 7.6, 8.1, 8.2, 8.3, 8.4, 8.9, 8.10

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('photography', 'flowers', 'catering', 'music', 'transportation', 'decoration', 'other')),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('flat_rate', 'per_guest', 'tiered')),
  base_cost NUMERIC(10, 2) NOT NULL CHECK (base_cost >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_vendor_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_payment_amount CHECK (amount_paid <= base_cost)
);

-- Vendor bookings table (links vendors to events/activities)
CREATE TABLE IF NOT EXISTS vendor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  guest_count INTEGER CHECK (guest_count IS NULL OR guest_count >= 0),
  pricing_model TEXT NOT NULL DEFAULT 'flat_rate' CHECK (pricing_model IN ('flat_rate', 'per_guest')),
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  host_subsidy NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (host_subsidy >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_target CHECK (
    (event_id IS NOT NULL AND activity_id IS NULL) OR 
    (event_id IS NULL AND activity_id IS NOT NULL)
  ),
  CONSTRAINT valid_subsidy CHECK (host_subsidy <= total_cost)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_payment_status ON vendors(payment_status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_id ON vendor_bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_activity_id ON vendor_bookings(activity_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event_id ON vendor_bookings(event_id);

-- Apply updated_at trigger to vendors
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE vendors IS 'Wedding service providers with pricing and payment tracking';
COMMENT ON TABLE vendor_bookings IS 'Links vendors to specific events or activities';
COMMENT ON COLUMN vendors.pricing_model IS 'flat_rate: fixed cost, per_guest: cost per attendee, tiered: different rates for guest ranges';
COMMENT ON COLUMN vendors.payment_status IS 'unpaid: no payment, partial: some payment, paid: fully paid';
