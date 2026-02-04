-- Add event_id column to accommodations table
-- This allows linking accommodations to specific events

ALTER TABLE public.accommodations
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_accommodations_event_id ON public.accommodations(event_id);

-- Add comment
COMMENT ON COLUMN public.accommodations.event_id IS 'Optional link to the event this accommodation is associated with';
