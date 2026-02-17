-- Add type column to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS type TEXT;

-- Add check constraint for valid location types
ALTER TABLE public.locations
DROP CONSTRAINT IF EXISTS valid_location_type;

ALTER TABLE public.locations
ADD CONSTRAINT valid_location_type 
CHECK (type IS NULL OR type IN ('country', 'region', 'city', 'venue', 'accommodation'));

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);

-- Update existing rows to have a default type if they don't have one
UPDATE public.locations
SET type = 'venue'
WHERE type IS NULL;

-- Add comment
COMMENT ON COLUMN public.locations.type IS 'Type of location in the hierarchy: country, region, city, venue, or accommodation';;
