-- Create rsvp_reminders_sent table for tracking RSVP reminder emails
-- Requirements: 6.8, 22.2, 22.3, 19.3

CREATE TABLE IF NOT EXISTS rsvp_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  days_before_deadline INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one of event_id or activity_id is set
  CONSTRAINT check_event_or_activity CHECK (
    (event_id IS NOT NULL AND activity_id IS NULL) OR
    (event_id IS NULL AND activity_id IS NOT NULL)
  )
);
-- Create indexes for efficient querying
CREATE INDEX idx_rsvp_reminders_guest_id ON rsvp_reminders_sent(guest_id);
CREATE INDEX idx_rsvp_reminders_event_id ON rsvp_reminders_sent(event_id);
CREATE INDEX idx_rsvp_reminders_activity_id ON rsvp_reminders_sent(activity_id);
CREATE INDEX idx_rsvp_reminders_sent_at ON rsvp_reminders_sent(sent_at DESC);
-- Add RLS policies
ALTER TABLE rsvp_reminders_sent ENABLE ROW LEVEL SECURITY;
-- Hosts can view all reminders
CREATE POLICY "hosts_view_reminders"
ON rsvp_reminders_sent FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'host')
  )
);
-- System can insert reminders (service role key)
CREATE POLICY "system_insert_reminders"
ON rsvp_reminders_sent FOR INSERT
WITH CHECK (true);
