-- Migration: Add slug columns to events and activities tables

-- Add slug column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for slug lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's NULL or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    
    -- Remove leading/trailing hyphens
    NEW.slug := regexp_replace(NEW.slug, '^-+|-+$', '', 'g');
    
    -- Replace multiple consecutive hyphens with single hyphen
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for events table
DROP TRIGGER IF EXISTS events_generate_slug ON events;
CREATE TRIGGER events_generate_slug
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Create trigger for activities table
DROP TRIGGER IF EXISTS activities_generate_slug ON activities;
CREATE TRIGGER activities_generate_slug
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();;
