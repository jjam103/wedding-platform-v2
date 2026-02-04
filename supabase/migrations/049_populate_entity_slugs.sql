-- Migration: Populate slugs for events and activities
-- Purpose: Generate URL-friendly slugs for all existing events and activities
-- that don't have slugs yet. This fixes 404 errors when viewing entities from admin.

-- Generate slugs for events without them
-- Convert name to lowercase, replace non-alphanumeric with hyphens
UPDATE events 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- Generate slugs for activities without them
UPDATE activities
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- Handle duplicate slugs for events by appending first 8 chars of ID
UPDATE events e1
SET slug = e1.slug || '-' || SUBSTRING(e1.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM events e2 
  WHERE e2.slug = e1.slug 
    AND e2.id != e1.id
    AND e2.created_at < e1.created_at
);

-- Handle duplicate slugs for activities by appending first 8 chars of ID
UPDATE activities a1
SET slug = a1.slug || '-' || SUBSTRING(a1.id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM activities a2 
  WHERE a2.slug = a1.slug 
    AND a2.id != a1.id
    AND a2.created_at < a1.created_at
);

-- Verify results
DO $$
DECLARE
  events_without_slugs INTEGER;
  activities_without_slugs INTEGER;
BEGIN
  SELECT COUNT(*) INTO events_without_slugs FROM events WHERE slug IS NULL OR slug = '';
  SELECT COUNT(*) INTO activities_without_slugs FROM activities WHERE slug IS NULL OR slug = '';
  
  RAISE NOTICE 'Events without slugs: %', events_without_slugs;
  RAISE NOTICE 'Activities without slugs: %', activities_without_slugs;
  
  IF events_without_slugs > 0 OR activities_without_slugs > 0 THEN
    RAISE WARNING 'Some entities still missing slugs after migration';
  ELSE
    RAISE NOTICE 'All entities now have slugs';
  END IF;
END $$;
