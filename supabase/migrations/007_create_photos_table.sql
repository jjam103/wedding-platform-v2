-- Create photos table for photo management system
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('b2', 'supabase')),
  page_type TEXT NOT NULL CHECK (page_type IN ('event', 'activity', 'accommodation', 'memory')),
  page_id UUID,
  caption TEXT,
  alt_text TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_reason TEXT,
  display_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moderated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_photos_uploader ON photos(uploader_id);
CREATE INDEX idx_photos_page ON photos(page_type, page_id);
CREATE INDEX idx_photos_moderation_status ON photos(moderation_status);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);

-- Create RLS policies for photos table

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Users can upload photos (insert)
CREATE POLICY "users_upload_photos"
ON photos FOR INSERT
WITH CHECK (
  uploader_id = auth.uid()
);

-- Users can view their own photos
CREATE POLICY "users_view_own_photos"
ON photos FOR SELECT
USING (
  uploader_id = auth.uid()
);

-- All authenticated users can view approved photos
CREATE POLICY "all_view_approved_photos"
ON photos FOR SELECT
USING (
  moderation_status = 'approved'
);

-- Hosts can manage all photos (select, update, delete)
CREATE POLICY "hosts_manage_photos"
ON photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('super_admin', 'host')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photos_updated_at
BEFORE UPDATE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_photos_updated_at();
