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

-- Make slug columns NOT NULL after migration
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;;
