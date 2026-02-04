-- Migration: Add optional title field to sections table
-- Allows sections to have descriptive titles for better organization

ALTER TABLE sections 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comment
COMMENT ON COLUMN sections.title IS 'Optional title for the section, displayed above the content';
