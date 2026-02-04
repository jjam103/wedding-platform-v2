-- Migration: Add slug columns to events and activities tables
-- Phase 7: Slug Management and Dynamic Routes
-- Requirements: 24.1, 24.3, 24.4, 24.5

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
          regexp_replace(NEW.name, '[^\w\s-]', '', 'g'),  -- Remove special chars
          '_', '-', 'g'                                     -- Replace underscores
        ),
        '\s+', '-', 'g'                                     -- Replace spaces
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
  EXECUTE FUNCTION generate_slug_from_name();

-- Migrate existing records: Generate slugs for events without slugs
DO $$
DECLARE
  event_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR event_record IN 
    SELECT id, name FROM events WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(event_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = unique_slug AND id != event_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update event with unique slug
    UPDATE events SET slug = unique_slug WHERE id = event_record.id;
  END LOOP;
END $$;

-- Migrate existing records: Generate slugs for activities without slugs
DO $$
DECLARE
  activity_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR activity_record IN 
    SELECT id, name FROM activities WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(activity_record.name, '[^\w\s-]', '', 'g'),
          '_', '-', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM activities WHERE slug = unique_slug AND id != activity_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update activity with unique slug
    UPDATE activities SET slug = unique_slug WHERE id = activity_record.id;
  END LOOP;
END $$;

-- Make slug columns NOT NULL after migration (all records now have slugs)
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN events.slug IS 'URL-safe slug generated from event name, used for friendly URLs';
COMMENT ON COLUMN activities.slug IS 'URL-safe slug generated from activity name, used for friendly URLs';
COMMENT ON FUNCTION generate_slug_from_name() IS 'Automatically generates URL-safe slugs from name field on insert/update';
