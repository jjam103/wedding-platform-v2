-- Migration: Create content_pages table for custom content management
-- Creates content_pages table for managing custom pages with rich content

-- Content pages table: Stores custom content pages
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);

-- RLS Policies for content_pages table
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

-- Hosts can manage all content pages
CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view published content pages
CREATE POLICY "guests_view_published_content_pages"
ON content_pages FOR SELECT
USING (status = 'published');

-- Add updated_at trigger for content_pages
CREATE OR REPLACE FUNCTION update_content_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_pages_updated_at
BEFORE UPDATE ON content_pages
FOR EACH ROW
EXECUTE FUNCTION update_content_pages_updated_at();;
