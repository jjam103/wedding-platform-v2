-- Migration: Fix RLS Policies for Sections and Content Pages
-- Issue: Policies reference auth.users.role which doesn't exist
-- Solution: Update policies to reference users.role instead

-- Drop old policies for sections
DROP POLICY IF EXISTS "hosts_manage_sections" ON sections;
DROP POLICY IF EXISTS "guests_view_published_sections" ON sections;

-- Create corrected policies for sections
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "guests_view_published_sections"
ON sections FOR SELECT
USING (
  (page_type = 'activity' AND EXISTS (
    SELECT 1 FROM activities 
    WHERE id::text = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'event' AND EXISTS (
    SELECT 1 FROM events 
    WHERE id::text = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'accommodation' AND EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id::text = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'room_type' AND EXISTS (
    SELECT 1 FROM room_types 
    WHERE id::text = sections.page_id AND status = 'published'
  ))
  OR page_type = 'custom'
);

-- Drop old policies for columns
DROP POLICY IF EXISTS "hosts_manage_columns" ON columns;
DROP POLICY IF EXISTS "guests_view_published_columns" ON columns;

-- Create corrected policies for columns
CREATE POLICY "hosts_manage_columns"
ON columns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "guests_view_published_columns"
ON columns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sections s
    WHERE s.id = columns.section_id
    AND (
      (s.page_type = 'activity' AND EXISTS (
        SELECT 1 FROM activities 
        WHERE id::text = s.page_id AND status = 'published'
      ))
      OR (s.page_type = 'event' AND EXISTS (
        SELECT 1 FROM events 
        WHERE id::text = s.page_id AND status = 'published'
      ))
      OR (s.page_type = 'accommodation' AND EXISTS (
        SELECT 1 FROM accommodations 
        WHERE id::text = s.page_id AND status = 'published'
      ))
      OR (s.page_type = 'room_type' AND EXISTS (
        SELECT 1 FROM room_types 
        WHERE id::text = s.page_id AND status = 'published'
      ))
      OR s.page_type = 'custom'
    )
  )
);

-- Drop old policies for gallery_settings
DROP POLICY IF EXISTS "hosts_manage_gallery_settings" ON gallery_settings;
DROP POLICY IF EXISTS "guests_view_published_gallery_settings" ON gallery_settings;

-- Create corrected policies for gallery_settings
CREATE POLICY "hosts_manage_gallery_settings"
ON gallery_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "guests_view_published_gallery_settings"
ON gallery_settings FOR SELECT
USING (
  (page_type = 'activity' AND EXISTS (
    SELECT 1 FROM activities 
    WHERE id::text = gallery_settings.page_id AND status = 'published'
  ))
  OR (page_type = 'event' AND EXISTS (
    SELECT 1 FROM events 
    WHERE id::text = gallery_settings.page_id AND status = 'published'
  ))
  OR (page_type = 'accommodation' AND EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id::text = gallery_settings.page_id AND status = 'published'
  ))
  OR (page_type = 'room_type' AND EXISTS (
    SELECT 1 FROM room_types 
    WHERE id::text = gallery_settings.page_id AND status = 'published'
  ))
  OR page_type IN ('custom', 'memory')
);

-- Drop old policies for content_versions
DROP POLICY IF EXISTS "super_admins_view_versions" ON content_versions;
DROP POLICY IF EXISTS "hosts_view_versions" ON content_versions;
DROP POLICY IF EXISTS "system_insert_versions" ON content_versions;

-- Create corrected policies for content_versions
CREATE POLICY "hosts_view_versions"
ON content_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "system_insert_versions"
ON content_versions FOR INSERT
WITH CHECK (true);

-- Fix content_pages policies if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_pages') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "hosts_manage_content_pages" ON content_pages;
    DROP POLICY IF EXISTS "guests_view_published_content_pages" ON content_pages;
    
    -- Create corrected policies
    EXECUTE 'CREATE POLICY "hosts_manage_content_pages" ON content_pages FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN (''super_admin'', ''host'')))';
    EXECUTE 'CREATE POLICY "guests_view_published_content_pages" ON content_pages FOR SELECT USING (status = ''published'')';
  END IF;
END $$;
