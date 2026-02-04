-- Migration: Add Soft Delete Support
-- Description: Adds deleted_at columns to major tables for soft delete functionality
-- Requirements: 29.7, 29.8

-- Add deleted_at column to content_pages table
ALTER TABLE content_pages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to sections table
ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to columns table
ALTER TABLE columns 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at column to rsvps table
ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_by column to track who deleted the record
ALTER TABLE content_pages 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE columns 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

ALTER TABLE rsvps 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create partial indexes for soft delete queries (only index non-deleted records)
-- This improves query performance for active records
CREATE INDEX IF NOT EXISTS idx_content_pages_not_deleted 
ON content_pages(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sections_not_deleted 
ON sections(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_not_deleted 
ON columns(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_not_deleted 
ON events(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activities_not_deleted 
ON activities(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_photos_not_deleted 
ON photos(id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rsvps_not_deleted 
ON rsvps(id) 
WHERE deleted_at IS NULL;

-- Create indexes for deleted records (for deleted items manager)
CREATE INDEX IF NOT EXISTS idx_content_pages_deleted 
ON content_pages(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sections_deleted 
ON sections(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_columns_deleted 
ON columns(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted 
ON events(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_deleted 
ON activities(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photos_deleted 
ON photos(deleted_at) 
WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rsvps_deleted 
ON rsvps(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Update RLS policies to filter soft-deleted records
-- Content Pages: Only show non-deleted pages to guests
DROP POLICY IF EXISTS "Guests can view published content pages" ON content_pages;
CREATE POLICY "Guests can view published content pages" 
ON content_pages FOR SELECT 
USING (status = 'published' AND deleted_at IS NULL);

-- Sections: Only show non-deleted sections
DROP POLICY IF EXISTS "Guests can view sections" ON sections;
CREATE POLICY "Guests can view sections" 
ON sections FOR SELECT 
USING (deleted_at IS NULL);

-- Columns: Only show non-deleted columns
DROP POLICY IF EXISTS "Guests can view columns" ON columns;
CREATE POLICY "Guests can view columns" 
ON columns FOR SELECT 
USING (deleted_at IS NULL);

-- Events: Only show non-deleted events
DROP POLICY IF EXISTS "Guests can view events" ON events;
CREATE POLICY "Guests can view events" 
ON events FOR SELECT 
USING (deleted_at IS NULL);

-- Activities: Only show non-deleted activities
DROP POLICY IF EXISTS "Guests can view activities" ON activities;
CREATE POLICY "Guests can view activities" 
ON activities FOR SELECT 
USING (deleted_at IS NULL);

-- Photos: Only show non-deleted photos
DROP POLICY IF EXISTS "Guests can view approved photos" ON photos;
CREATE POLICY "Guests can view approved photos" 
ON photos FOR SELECT 
USING (moderation_status = 'approved' AND deleted_at IS NULL);

-- Admin policies: Admins can see deleted items (for deleted items manager)
CREATE POLICY "Admins can view deleted content pages" 
ON content_pages FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted sections" 
ON sections FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted columns" 
ON columns FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted events" 
ON events FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted activities" 
ON activities FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

CREATE POLICY "Admins can view deleted photos" 
ON photos FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users WHERE status = 'active')
);

-- Add comments for documentation
COMMENT ON COLUMN content_pages.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN content_pages.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN sections.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN sections.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN columns.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN columns.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN events.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN events.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN activities.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN activities.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN photos.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN photos.deleted_by IS 'User who soft deleted this record.';
COMMENT ON COLUMN rsvps.deleted_at IS 'Timestamp when record was soft deleted. NULL means active.';
COMMENT ON COLUMN rsvps.deleted_by IS 'User who soft deleted this record.';
