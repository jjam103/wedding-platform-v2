-- Migration: Create core database tables for destination wedding platform
-- Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1

-- Enable UUID extension in public schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'host', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Groups table (for family/guest grouping)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group members table (for multi-owner coordination)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age_type TEXT NOT NULL CHECK (age_type IN ('adult', 'child', 'senior')),
  guest_type TEXT NOT NULL,
  dietary_restrictions TEXT,
  plus_one_name TEXT,
  plus_one_attending BOOLEAN DEFAULT FALSE,
  arrival_date DATE,
  departure_date DATE,
  airport_code TEXT CHECK (airport_code IN ('SJO', 'LIR', 'Other')),
  flight_number TEXT,
  invitation_sent BOOLEAN NOT NULL DEFAULT FALSE,
  invitation_sent_date DATE,
  rsvp_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_guest_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_dates CHECK (arrival_date IS NULL OR departure_date IS NULL OR arrival_date <= departure_date)
);

-- Locations table (hierarchical)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  address TEXT,
  coordinates JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('ceremony', 'reception', 'pre_wedding', 'post_wedding')),
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  rsvp_required BOOLEAN NOT NULL DEFAULT TRUE,
  rsvp_deadline DATE,
  visibility TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  cost_per_person NUMERIC(10, 2) CHECK (cost_per_person IS NULL OR cost_per_person >= 0),
  host_subsidy NUMERIC(10, 2) CHECK (host_subsidy IS NULL OR host_subsidy >= 0),
  adults_only BOOLEAN NOT NULL DEFAULT FALSE,
  plus_one_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  visibility TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_activity_times CHECK (end_time IS NULL OR start_time <= end_time)
);

-- RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attending', 'declined', 'maybe')),
  guest_count INTEGER CHECK (guest_count IS NULL OR guest_count > 0),
  dietary_notes TEXT,
  special_requirements TEXT,
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rsvp_target CHECK (
    (event_id IS NOT NULL AND activity_id IS NULL) OR 
    (event_id IS NULL AND activity_id IS NOT NULL)
  ),
  UNIQUE(guest_id, event_id, activity_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_activity_id ON rsvps(activity_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_location_id ON locations(parent_location_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE groups IS 'Guest groups (families) for multi-owner coordination';
COMMENT ON TABLE group_members IS 'Maps users to groups they can manage';
COMMENT ON TABLE guests IS 'Wedding guests with complete information';
COMMENT ON TABLE locations IS 'Hierarchical location management';
COMMENT ON TABLE events IS 'Wedding events (ceremony, reception, etc.)';
COMMENT ON TABLE activities IS 'Activities within events or standalone';
COMMENT ON TABLE rsvps IS 'Guest responses to events and activities';
