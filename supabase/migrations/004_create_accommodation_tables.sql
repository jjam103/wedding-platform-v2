-- Migration: Create accommodation and room management tables
-- Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7, 9.9, 9.14

-- Accommodations table
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  description TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Room types table
CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  total_rooms INTEGER NOT NULL CHECK (total_rooms > 0),
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
  host_subsidy_per_night NUMERIC(10, 2) CHECK (host_subsidy_per_night IS NULL OR host_subsidy_per_night >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_subsidy CHECK (host_subsidy_per_night IS NULL OR host_subsidy_per_night <= price_per_night)
);
-- Room assignments table
CREATE TABLE IF NOT EXISTS room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_in < check_out),
  UNIQUE(guest_id, check_in, check_out)
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accommodations_location_id ON accommodations(location_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodations(status);
CREATE INDEX IF NOT EXISTS idx_room_types_accommodation_id ON room_types(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_room_types_status ON room_types(status);
CREATE INDEX IF NOT EXISTS idx_room_assignments_room_type_id ON room_assignments(room_type_id);
CREATE INDEX IF NOT EXISTS idx_room_assignments_guest_id ON room_assignments(guest_id);
CREATE INDEX IF NOT EXISTS idx_room_assignments_dates ON room_assignments(check_in, check_out);
-- Apply updated_at triggers
CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_assignments_updated_at BEFORE UPDATE ON room_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Comments for documentation
COMMENT ON TABLE accommodations IS 'Wedding accommodation properties';
COMMENT ON TABLE room_types IS 'Room types within accommodations with pricing and capacity';
COMMENT ON TABLE room_assignments IS 'Guest room assignments with check-in/check-out dates';
COMMENT ON COLUMN room_types.host_subsidy_per_night IS 'Amount per night subsidized by hosts';
COMMENT ON COLUMN room_assignments.check_in IS 'Guest check-in date';
COMMENT ON COLUMN room_assignments.check_out IS 'Guest check-out date';
