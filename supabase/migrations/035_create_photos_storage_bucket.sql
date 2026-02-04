-- Create photos storage bucket for fallback photo storage
-- Migration: 035_create_photos_storage_bucket
-- Description: Creates a public storage bucket for photos when B2 is unavailable

-- Create the photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,  -- Public bucket for photo access
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the photos bucket
-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "Authenticated users can update photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'photos');

-- Allow public read access to all photos
CREATE POLICY "Public read access to photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');
