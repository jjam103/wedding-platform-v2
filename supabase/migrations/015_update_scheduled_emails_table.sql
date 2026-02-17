-- Update scheduled_emails table to add retry_count and processing status
-- Requirements: 22.4

-- Add retry_count column
ALTER TABLE scheduled_emails 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
-- Update status check constraint to include 'processing'
ALTER TABLE scheduled_emails 
DROP CONSTRAINT IF EXISTS scheduled_emails_status_check;
ALTER TABLE scheduled_emails 
ADD CONSTRAINT scheduled_emails_status_check 
CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled'));
-- Create index on retry_count for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_retry_count ON scheduled_emails(retry_count);
