-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  retry_config JSONB DEFAULT '{"maxRetries": 5, "baseDelay": 1000}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create webhook_delivery_logs table
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  url TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for webhook_delivery_logs
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status ON webhook_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_next_retry ON webhook_delivery_logs(next_retry_at) WHERE status = 'retrying';
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event ON webhook_delivery_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON webhook_delivery_logs(created_at DESC);

-- Create updated_at trigger for webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- Create updated_at trigger for webhook_delivery_logs
CREATE OR REPLACE FUNCTION update_webhook_delivery_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_delivery_logs_updated_at
  BEFORE UPDATE ON webhook_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_delivery_logs_updated_at();

-- RLS Policies for webhooks table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage webhooks
CREATE POLICY "super_admins_manage_webhooks"
ON webhooks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- RLS Policies for webhook_delivery_logs table
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view webhook delivery logs
CREATE POLICY "super_admins_view_webhook_logs"
ON webhook_delivery_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- System can insert and update webhook delivery logs
CREATE POLICY "system_manage_webhook_logs"
ON webhook_delivery_logs FOR ALL
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations';
COMMENT ON TABLE webhook_delivery_logs IS 'Delivery logs for webhook events with retry tracking';
COMMENT ON COLUMN webhooks.events IS 'Array of event types this webhook subscribes to';
COMMENT ON COLUMN webhooks.secret IS 'Secret key for HMAC signature verification';
COMMENT ON COLUMN webhooks.retry_config IS 'JSON configuration for retry behavior (maxRetries, baseDelay)';
COMMENT ON COLUMN webhook_delivery_logs.status IS 'Delivery status: pending, delivered, failed, or retrying';
COMMENT ON COLUMN webhook_delivery_logs.next_retry_at IS 'Timestamp for next retry attempt (null if not retrying)';
