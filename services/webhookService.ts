import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';
import type { Result } from '../types';

/**
 * Webhook event types supported by the system.
 */
export type WebhookEventType =
  | 'rsvp.submitted'
  | 'rsvp.updated'
  | 'photo.uploaded'
  | 'photo.approved'
  | 'photo.rejected'
  | 'payment.recorded'
  | 'guest.created'
  | 'guest.updated'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.failed';

/**
 * Webhook delivery status.
 */
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

/**
 * Webhook configuration schema.
 */
const webhookConfigSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()),
  secret: z.string().min(32, 'Webhook secret must be at least 32 characters'),
  enabled: z.boolean().optional().default(true),
  retryConfig: z.object({
    maxRetries: z.number().int().min(0).max(10).optional().default(5),
    baseDelay: z.number().int().min(100).max(10000).optional().default(1000),
  }).optional(),
});

export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

/**
 * Webhook payload schema.
 */
const webhookPayloadSchema = z.object({
  event: z.string(),
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/**
 * Webhook delivery log entry.
 */
export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  payload: WebhookPayload;
  url: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generates HMAC signature for webhook payload.
 * 
 * @param payload - Webhook payload to sign
 * @param secret - Webhook secret key
 * @returns HMAC SHA-256 signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verifies webhook signature.
 * 
 * @param payload - Webhook payload
 * @param signature - Provided signature
 * @param secret - Webhook secret key
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Calculates exponential backoff delay for webhook retries.
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay in milliseconds with exponential backoff
 */
export function calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: baseDelay * 2^attempt
  // With jitter to prevent thundering herd
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Delivers a webhook to the configured URL.
 * 
 * @param config - Webhook configuration
 * @param payload - Webhook payload
 * @returns Result containing delivery status
 */
async function deliverWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<Result<{ status: number; body: string }>> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, config.secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'WeddingPlatform-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'WEBHOOK_DELIVERY_FAILED',
          message: `Webhook delivery failed with status ${response.status}`,
          details: {
            status: response.status,
            body: responseBody,
          },
        },
      };
    }

    return {
      success: true,
      data: {
        status: response.status,
        body: responseBody,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'WEBHOOK_TIMEOUT',
          message: 'Webhook delivery timed out after 30 seconds',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'WEBHOOK_DELIVERY_ERROR',
        message: error instanceof Error ? error.message : 'Webhook delivery failed',
        details: error,
      },
    };
  }
}

/**
 * Sends a webhook event to all configured webhooks.
 * 
 * @param event - Event type
 * @param data - Event data
 * @returns Result containing delivery results
 * 
 * @example
 * await sendWebhookEvent('rsvp.submitted', {
 *   guestId: 'guest-123',
 *   eventId: 'event-456',
 *   status: 'attending',
 * });
 */
export async function sendWebhookEvent(
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<Result<void>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all enabled webhooks that subscribe to this event
    const { data: webhooks, error: fetchError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('enabled', true)
      .contains('events', [event]);

    if (fetchError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch webhook configurations',
          details: fetchError,
        },
      };
    }

    if (!webhooks || webhooks.length === 0) {
      // No webhooks configured for this event - not an error
      return { success: true, data: undefined };
    }

    // 2. Create webhook payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // 3. Validate payload
    const validation = webhookPayloadSchema.safeParse(payload);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid webhook payload',
          details: validation.error.issues,
        },
      };
    }

    // 4. Queue webhook deliveries
    const deliveryPromises = webhooks.map(async (webhook) => {
      const config: WebhookConfig = {
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        enabled: webhook.enabled,
        retryConfig: webhook.retry_config || undefined,
      };

      // Create delivery log entry
      const { data: logEntry, error: logError } = await supabase
        .from('webhook_delivery_logs')
        .insert({
          webhook_id: webhook.id,
          event,
          payload,
          url: webhook.url,
          status: 'pending',
          attempts: 0,
        })
        .select()
        .single();

      if (logError || !logEntry) {
        console.error('Failed to create webhook delivery log:', logError);
        return;
      }

      // Attempt delivery
      const deliveryResult = await deliverWebhook(config, payload);

      // Update delivery log
      if (deliveryResult.success) {
        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'delivered',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            response_status: deliveryResult.data.status,
            response_body: deliveryResult.data.body,
          })
          .eq('id', logEntry.id);
      } else {
        // Schedule retry
        const retryDelay = calculateRetryDelay(0, config.retryConfig?.baseDelay);
        const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'retrying',
            attempts: 1,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: nextRetryAt,
            error_message: deliveryResult.error.message,
          })
          .eq('id', logEntry.id);
      }
    });

    await Promise.allSettled(deliveryPromises);

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'WEBHOOK_ERROR',
        message: error instanceof Error ? error.message : 'Webhook processing failed',
        details: error,
      },
    };
  }
}

/**
 * Retries failed webhook deliveries.
 * Should be called by a scheduled job.
 * 
 * @returns Result containing retry results
 */
export async function retryFailedWebhooks(): Promise<Result<{ retriedCount: number }>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get all webhook deliveries that need retry
    const { data: pendingDeliveries, error: fetchError } = await supabase
      .from('webhook_delivery_logs')
      .select('*, webhooks(*)')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(100); // Process in batches

    if (fetchError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch pending webhook deliveries',
          details: fetchError,
        },
      };
    }

    if (!pendingDeliveries || pendingDeliveries.length === 0) {
      return { success: true, data: { retriedCount: 0 } };
    }

    // 2. Retry each delivery
    let retriedCount = 0;

    for (const delivery of pendingDeliveries) {
      const webhook = delivery.webhooks;
      if (!webhook || !webhook.enabled) {
        continue;
      }

      const config: WebhookConfig = {
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        enabled: webhook.enabled,
        retryConfig: webhook.retry_config || undefined,
      };

      const maxRetries = config.retryConfig?.maxRetries || 5;

      if (delivery.attempts >= maxRetries) {
        // Max retries reached, mark as failed
        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'failed',
            error_message: `Max retries (${maxRetries}) exceeded`,
          })
          .eq('id', delivery.id);
        continue;
      }

      // Attempt delivery
      const deliveryResult = await deliverWebhook(config, delivery.payload);

      if (deliveryResult.success) {
        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'delivered',
            attempts: delivery.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: null,
            response_status: deliveryResult.data.status,
            response_body: deliveryResult.data.body,
            error_message: null,
          })
          .eq('id', delivery.id);
        retriedCount++;
      } else {
        // Schedule next retry with exponential backoff
        const retryDelay = calculateRetryDelay(
          delivery.attempts,
          config.retryConfig?.baseDelay
        );
        const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

        await supabase
          .from('webhook_delivery_logs')
          .update({
            status: 'retrying',
            attempts: delivery.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            next_retry_at: nextRetryAt,
            error_message: deliveryResult.error.message,
          })
          .eq('id', delivery.id);
      }
    }

    return { success: true, data: { retriedCount } };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'WEBHOOK_RETRY_ERROR',
        message: error instanceof Error ? error.message : 'Webhook retry failed',
        details: error,
      },
    };
  }
}

/**
 * Validates webhook configuration.
 * 
 * @param config - Webhook configuration to validate
 * @returns Result indicating if configuration is valid
 */
export function validateWebhookConfig(config: unknown): Result<WebhookConfig> {
  const validation = webhookConfigSchema.safeParse(config);

  if (!validation.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid webhook configuration',
        details: validation.error.issues,
      },
    };
  }

  return { success: true, data: validation.data };
}

/**
 * Tests webhook connectivity by sending a test payload.
 * 
 * @param config - Webhook configuration
 * @returns Result indicating if webhook is reachable
 */
export async function testWebhookConnectivity(
  config: WebhookConfig
): Promise<Result<void>> {
  const testPayload: WebhookPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook delivery',
    },
  };

  const result = await deliverWebhook(config, testPayload);

  if (!result.success) {
    return result as Result<void>;
  }

  return { success: true, data: undefined };
}
