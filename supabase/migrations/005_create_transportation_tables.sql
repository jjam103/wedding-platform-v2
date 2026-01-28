-- Create transportation_manifests table for shuttle coordination
CREATE TABLE IF NOT EXISTS transportation_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_type TEXT NOT NULL CHECK (manifest_type IN ('arrival', 'departure')),
  date DATE NOT NULL,
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  vehicle_type TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  guest_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by date and type
CREATE INDEX idx_transportation_manifests_date_type ON transportation_manifests(date, manifest_type);

-- Create index for guest_ids array
CREATE INDEX idx_transportation_manifests_guest_ids ON transportation_manifests USING GIN(guest_ids);

-- RLS Policies for transportation_manifests
ALTER TABLE transportation_manifests ENABLE ROW LEVEL SECURITY;

-- Only hosts can manage transportation manifests
CREATE POLICY "hosts_manage_transportation_manifests"
ON transportation_manifests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view manifests they are assigned to
CREATE POLICY "guests_view_assigned_manifests"
ON transportation_manifests FOR SELECT
USING (
  auth.uid()::text = ANY(
    SELECT id::text FROM guests 
    WHERE id = ANY(transportation_manifests.guest_ids)
    AND email = auth.jwt() ->> 'email'
  )
);
