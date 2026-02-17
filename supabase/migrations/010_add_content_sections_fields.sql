-- Migration: Add content_sections fields to activities, events, accommodations, and room_types tables
-- This enables CMS integration for dynamic content management

-- Add content_sections to activities table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' AND column_name = 'content_sections'
  ) THEN
    ALTER TABLE activities ADD COLUMN content_sections JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
-- Add content_sections to events table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'content_sections'
  ) THEN
    ALTER TABLE events ADD COLUMN content_sections JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
-- Add content_sections to accommodations table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'accommodations' AND column_name = 'content_sections'
  ) THEN
    ALTER TABLE accommodations ADD COLUMN content_sections JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
-- Add content_sections to room_types table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'room_types' AND column_name = 'content_sections'
  ) THEN
    ALTER TABLE room_types ADD COLUMN content_sections JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
-- Add indexes for content_sections JSONB fields for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_content_sections ON activities USING GIN (content_sections);
CREATE INDEX IF NOT EXISTS idx_events_content_sections ON events USING GIN (content_sections);
CREATE INDEX IF NOT EXISTS idx_accommodations_content_sections ON accommodations USING GIN (content_sections);
CREATE INDEX IF NOT EXISTS idx_room_types_content_sections ON room_types USING GIN (content_sections);
-- Add comments to document the fields
COMMENT ON COLUMN activities.content_sections IS 'JSONB array of section IDs for CMS content management';
COMMENT ON COLUMN events.content_sections IS 'JSONB array of section IDs for CMS content management';
COMMENT ON COLUMN accommodations.content_sections IS 'JSONB array of section IDs for CMS content management';
COMMENT ON COLUMN room_types.content_sections IS 'JSONB array of section IDs for CMS content management';
