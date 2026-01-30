// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature'),
  }),
  timingSafeEqual: jest.fn().mockReturnValue(true),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Import service AFTER mocking dependencies
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  calculateRetryDelay,
  sendWebhookEvent,
  retryFailedWebhooks,
  validateWebhookConfig,
  testWebhookConnectivity,
} from './webhookService';
import { createMockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock the supabase lib at the module level
const mockSupabase = createMockSupabaseClient();
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('webhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('generateWebhookSignature', () => {
    it('should generate HMAC signature for webhook payload', () => {
      const payload = '{"event":"test","data":{}}';
      const secret = 'test-secret-key';

      const signature = generateWebhookSignature(payload, secret);

      expect(signature).toBe('mocked-signature');
      expect(require('crypto').createHmac).toHaveBeenCalledWith('sha256', secret);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true when signature is valid', () => {
      const payload = '{"event":"test","data":{}}';
      const signature = 'valid-signature';
      const secret = 'test-secret-key';

      const isValid = verifyWebhookSignature(payload, signature, secret);

      expect(isValid).toBe(true);
      expect(require('crypto').timingSafeEqual).toHaveBeenCalled();
    });

    it('should return false when timingSafeEqual throws error', () => {
      require('crypto').timingSafeEqual.mockImplementationOnce(() => {
        throw new Error('Buffer length mismatch');
      });

      const payload = '{"event":"test","data":{}}';
      const signature = 'invalid-signature';
      const secret = 'test-secret-key';

      const isValid = verifyWebhookSignature(payload, signature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delay', () => {
      const baseDelay = 1000;

      const delay0 = calculateRetryDelay(0, baseDelay);
      const delay1 = calculateRetryDelay(1, baseDelay);
      const delay2 = calculateRetryDelay(2, baseDelay);

      // Exponential backoff: baseDelay * 2^attempt
      // With jitter, so we check ranges
      expect(delay0).toBeGreaterThanOrEqual(1000); // 1000 * 2^0 = 1000
      expect(delay0).toBeLessThanOrEqual(1100); // With 10% jitter

      expect(delay1).toBeGreaterThanOrEqual(2000); // 1000 * 2^1 = 2000
      expect(delay1).toBeLessThanOrEqual(2200); // With 10% jitter

      expect(delay2).toBeGreaterThanOrEqual(4000); // 1000 * 2^2 = 4000
      expect(delay2).toBeLessThanOrEqual(4400); // With 10% jitter
    });

    it('should use default base delay when not provided', () => {
      const delay = calculateRetryDelay(0);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1100);
    });
  });

  describe('sendWebhookEvent', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });
    });

    it('should return success when no webhooks configured for event', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            contains: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await sendWebhookEvent('rsvp.submitted', {
        guestId: 'guest-123',
        status: 'attending',
      });

      expect(result.success).toBe(true);
    });

    it('should return success when webhooks delivered successfully', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook',
          events: ['rsvp.submitted'],
          secret: 'test-secret-key-12345678901234567890',
          enabled: true,
          retry_config: null,
        },
      ];

      // Set up mock chain for webhook fetch, log insertion, and log update
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              contains: jest.fn().mockResolvedValue({
                data: mockWebhooks,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'log-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await sendWebhookEvent('rsvp.submitted', {
        guestId: 'guest-123',
        status: 'attending',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Signature': 'mocked-signature',
            'X-Webhook-Event': 'rsvp.submitted',
          }),
        })
      );
    });

    it('should return DATABASE_ERROR when fetching webhooks fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            contains: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const result = await sendWebhookEvent('rsvp.submitted', {
        guestId: 'guest-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should handle webhook delivery failures and schedule retries', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook',
          events: ['rsvp.submitted'],
          secret: 'test-secret-key-12345678901234567890',
          enabled: true,
          retry_config: { maxRetries: 3, baseDelay: 1000 },
        },
      ];

      // Set up mock chain for webhook fetch, log insertion, and log update
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              contains: jest.fn().mockResolvedValue({
                data: mockWebhooks,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'log-123' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      const result = await sendWebhookEvent('rsvp.submitted', {
        guestId: 'guest-123',
      });

      expect(result.success).toBe(true);
    });

    it('should return WEBHOOK_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await sendWebhookEvent('rsvp.submitted', {
        guestId: 'guest-123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_ERROR');
      }
    });
  });

  describe('retryFailedWebhooks', () => {
    it('should return success with retry count when failed webhooks retried', async () => {
      const mockPendingDeliveries = [
        {
          id: 'log-1',
          webhook_id: 'webhook-1',
          event: 'rsvp.submitted',
          payload: { event: 'rsvp.submitted', timestamp: '2024-01-01T10:00:00Z', data: {} },
          url: 'https://example.com/webhook',
          status: 'retrying',
          attempts: 1,
          next_retry_at: '2024-01-01T10:00:00Z',
          webhooks: {
            id: 'webhook-1',
            url: 'https://example.com/webhook',
            events: ['rsvp.submitted'],
            secret: 'test-secret-key-12345678901234567890',
            enabled: true,
            retry_config: { maxRetries: 3, baseDelay: 1000 },
          },
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockPendingDeliveries,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      const result = await retryFailedWebhooks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retriedCount).toBe(1);
      }
    });

    it('should return success with zero count when no pending deliveries exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await retryFailedWebhooks();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retriedCount).toBe(0);
      }
    });

    it('should mark deliveries as failed when max retries exceeded', async () => {
      const mockPendingDeliveries = [
        {
          id: 'log-1',
          webhook_id: 'webhook-1',
          attempts: 5, // Exceeds max retries
          webhooks: {
            id: 'webhook-1',
            enabled: true,
            retry_config: { maxRetries: 3 },
          },
        },
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockPendingDeliveries,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        })
        .mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await retryFailedWebhooks();

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when fetching pending deliveries fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              }),
            }),
          }),
        }),
      });

      const result = await retryFailedWebhooks();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return WEBHOOK_RETRY_ERROR when unexpected error occurs', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await retryFailedWebhooks();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_RETRY_ERROR');
      }
    });
  });

  describe('validateWebhookConfig', () => {
    it('should return success when valid webhook configuration provided', () => {
      const validConfig = {
        url: 'https://example.com/webhook',
        events: ['rsvp.submitted', 'photo.uploaded'],
        secret: 'test-secret-key-12345678901234567890',
        enabled: true,
        retryConfig: {
          maxRetries: 5,
          baseDelay: 2000,
        },
      };

      const result = validateWebhookConfig(validConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://example.com/webhook');
        expect(result.data.events).toEqual(['rsvp.submitted', 'photo.uploaded']);
        expect(result.data.secret).toBe('test-secret-key-12345678901234567890');
        expect(result.data.enabled).toBe(true);
      }
    });

    it('should return VALIDATION_ERROR when invalid URL provided', () => {
      const invalidConfig = {
        url: 'not-a-valid-url',
        events: ['rsvp.submitted'],
        secret: 'test-secret-key-12345678901234567890',
      };

      const result = validateWebhookConfig(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when secret is too short', () => {
      const invalidConfig = {
        url: 'https://example.com/webhook',
        events: ['rsvp.submitted'],
        secret: 'short', // Less than 32 characters
      };

      const result = validateWebhookConfig(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return success when events array is empty', () => {
      const configWithEmptyEvents = {
        url: 'https://example.com/webhook',
        events: [], // Empty array is allowed by the schema
        secret: 'test-secret-key-12345678901234567890',
      };

      const result = validateWebhookConfig(configWithEmptyEvents);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toEqual([]);
      }
    });

    it('should return success with default values when optional fields omitted', () => {
      const minimalConfig = {
        url: 'https://example.com/webhook',
        events: ['rsvp.submitted'],
        secret: 'test-secret-key-12345678901234567890',
      };

      const result = validateWebhookConfig(minimalConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true); // Default value
        expect(result.data.retryConfig).toBeUndefined(); // Optional field not provided
      }
    });
  });

  describe('testWebhookConnectivity', () => {
    it('should return success when webhook endpoint is reachable', async () => {
      const config = {
        url: 'https://example.com/webhook',
        events: ['webhook.test'],
        secret: 'test-secret-key-12345678901234567890',
        enabled: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('OK'),
      });

      const result = await testWebhookConnectivity(config);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'webhook.test',
          }),
        })
      );
    });

    it('should return WEBHOOK_DELIVERY_FAILED when endpoint returns error status', async () => {
      const config = {
        url: 'https://example.com/webhook',
        events: ['webhook.test'],
        secret: 'test-secret-key-12345678901234567890',
        enabled: true,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      });

      const result = await testWebhookConnectivity(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_DELIVERY_FAILED');
      }
    });

    it('should return WEBHOOK_TIMEOUT when request times out', async () => {
      const config = {
        url: 'https://example.com/webhook',
        events: ['webhook.test'],
        secret: 'test-secret-key-12345678901234567890',
        enabled: true,
      };

      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Request timed out');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const result = await testWebhookConnectivity(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_TIMEOUT');
      }
    });

    it('should return WEBHOOK_DELIVERY_ERROR when network error occurs', async () => {
      const config = {
        url: 'https://example.com/webhook',
        events: ['webhook.test'],
        secret: 'test-secret-key-12345678901234567890',
        enabled: true,
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testWebhookConnectivity(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('WEBHOOK_DELIVERY_ERROR');
      }
    });
  });
});