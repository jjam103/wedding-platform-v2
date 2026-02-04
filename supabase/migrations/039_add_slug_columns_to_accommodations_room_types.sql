-- Migration: Add slug columns to accommodations and room_types tables
-- Universal Slug Support Implementation
-- Requirements: 24.1, 24.3, 24.4, 24.5

-- Add slug column to accommodations table
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to room_types table
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for slug lookups (for performance)
CREATE INDEX IF NOT EXISTS idx_accommodations_slug ON accommodations(slug);
CREATE INDEX IF NOT EXISTS idx_room_types_slug ON room_types(slug);

-- Reuse the existing generate_slug_from_name function (created in migration 038)
-- This function generates URL-safe slugs from the name field

-- Create trigger for accommodations table
DROP TRIGGER IF EXISTS accommodations_generate_slug ON accommodations;
CREATE TRIGGER accommodations_generate_slug
  BEFORE INSERT OR UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Create trigger for room_types table
DROP TRIGGER IF EXISTS room_types_generate_slug ON room_types;
CREATE TRIGGER room_types_generate_slug
  BEFORE INSERT OR UPDATE ON room_types
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Migrate existing records: Generate slugs for accommodations without slugs
DO $$
DECLARE
  accommodation_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR accommodation_record IN 
    SELECT id, name FROM accommodations WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(accommodation_record.name, '[^\w\s-]', '', 'g'),
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
    
    WHILE EXISTS (SELECT 1 FROM accommodations WHERE slug = unique_slug AND id != accommodation_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update accommodation with unique slug
    UPDATE accommodations SET slug = unique_slug WHERE id = accommodation_record.id;
  END LOOP;
END $$;

-- Migrate existing records: Generate slugs for room_types without slugs
DO $$
DECLARE
  room_type_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR room_type_record IN 
    SELECT id, name FROM room_types WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(room_type_record.name, '[^\w\s-]', '', 'g'),
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
    
    WHILE EXISTS (SELECT 1 FROM room_types WHERE slug = unique_slug AND id != room_type_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update room_type with unique slug
    UPDATE room_types SET slug = unique_slug WHERE id = room_type_record.id;
  END LOOP;
END $$;

-- Make slug columns NOT NULL after migration (all records now have slugs)
ALTER TABLE accommodations ALTER COLUMN slug SET NOT NULL;
ALTER TABLE room_types ALTER COLUMN slug SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN accommodations.slug IS 'URL-safe slug generated from accommodation name, used for friendly URLs';
COMMENT ON COLUMN room_types.slug IS 'URL-safe slug generated from room type name, used for friendly URLs';
