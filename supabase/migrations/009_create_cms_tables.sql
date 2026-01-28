-- Migration: Create CMS (Content Management System) tables
-- Creates sections, columns, and gallery_settings tables for dynamic content management

-- Sections table: Stores page sections for activities, events, accommodations, room types, and custom pages
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('activity', 'event', 'accommodation', 'room_type', 'custom')),
  page_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columns table: Stores column content within sections (1-2 columns per section)
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  column_number INTEGER NOT NULL CHECK (column_number IN (1, 2)),
  content_type TEXT NOT NULL CHECK (content_type IN ('rich_text', 'photo_gallery', 'references')),
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id, column_number)
);

-- Gallery settings table: Stores photo gallery configuration per page
CREATE TABLE IF NOT EXISTS gallery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('activity', 'event', 'accommodation', 'room_type', 'custom', 'memory')),
  page_id TEXT NOT NULL,
  display_mode TEXT NOT NULL DEFAULT 'gallery' CHECK (display_mode IN ('gallery', 'carousel', 'loop')),
  photos_per_row INTEGER CHECK (photos_per_row >= 1 AND photos_per_row <= 6),
  show_captions BOOLEAN NOT NULL DEFAULT true,
  autoplay_interval INTEGER CHECK (autoplay_interval >= 1000),
  transition_effect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_type, page_id)
);

-- Version history table: Stores snapshots of page content for version control
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('activity', 'event', 'accommodation', 'room_type', 'custom')),
  page_id TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  sections_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sections_page ON sections(page_type, page_id);
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON sections(page_id, display_order);
CREATE INDEX IF NOT EXISTS idx_columns_section ON columns(section_id);
CREATE INDEX IF NOT EXISTS idx_gallery_settings_page ON gallery_settings(page_type, page_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_page ON content_versions(page_type, page_id, created_at DESC);

-- RLS Policies for sections table
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Hosts can manage all sections
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view sections for published pages
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

-- RLS Policies for columns table
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Hosts can manage all columns
CREATE POLICY "hosts_manage_columns"
ON columns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view columns for published sections
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

-- RLS Policies for gallery_settings table
ALTER TABLE gallery_settings ENABLE ROW LEVEL SECURITY;

-- Hosts can manage all gallery settings
CREATE POLICY "hosts_manage_gallery_settings"
ON gallery_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view gallery settings for published pages
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

-- RLS Policies for content_versions table
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Only super admins can view version history
CREATE POLICY "super_admins_view_versions"
ON content_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Hosts can view version history
CREATE POLICY "hosts_view_versions"
ON content_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role = 'host'
  )
);

-- System can insert version history
CREATE POLICY "system_insert_versions"
ON content_versions FOR INSERT
WITH CHECK (true);

-- Add updated_at trigger for sections
CREATE OR REPLACE FUNCTION update_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sections_updated_at
BEFORE UPDATE ON sections
FOR EACH ROW
EXECUTE FUNCTION update_sections_updated_at();

-- Add updated_at trigger for columns
CREATE OR REPLACE FUNCTION update_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER columns_updated_at
BEFORE UPDATE ON columns
FOR EACH ROW
EXECUTE FUNCTION update_columns_updated_at();

-- Add updated_at trigger for gallery_settings
CREATE OR REPLACE FUNCTION update_gallery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_settings_updated_at
BEFORE UPDATE ON gallery_settings
FOR EACH ROW
EXECUTE FUNCTION update_gallery_settings_updated_at();
