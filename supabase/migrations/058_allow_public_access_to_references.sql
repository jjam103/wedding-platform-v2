-- Migration: Allow public/anonymous access to reference data for guest views
-- This enables reference preview cards to work without authentication

-- Events: Allow public read access to published, non-deleted events
DROP POLICY IF EXISTS "Public can view published events" ON events;
CREATE POLICY "Public can view published events"
ON events FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Activities: Allow public read access to published, non-deleted activities
DROP POLICY IF EXISTS "Public can view published activities" ON activities;
CREATE POLICY "Public can view published activities"
ON activities FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Content Pages: Allow public read access to published, non-deleted pages
DROP POLICY IF EXISTS "Public can view published content pages" ON content_pages;
CREATE POLICY "Public can view published content pages"
ON content_pages FOR SELECT
TO public
USING (status = 'published' AND deleted_at IS NULL);

-- Accommodations: Allow public read access to published accommodations (no deleted_at column)
DROP POLICY IF EXISTS "Public can view published accommodations" ON accommodations;
CREATE POLICY "Public can view published accommodations"
ON accommodations FOR SELECT
TO public
USING (status = 'published');

-- Locations: Allow public read access to locations (no deleted_at column)
DROP POLICY IF EXISTS "Public can view locations" ON locations;
CREATE POLICY "Public can view locations"
ON locations FOR SELECT
TO public
USING (true);
