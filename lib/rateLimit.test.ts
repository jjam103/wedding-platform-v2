import {
  checkRateLimit,
  rateLimitMiddleware,
  getRateLimitHeaders,
  checkEmailRateLimit,
  checkBulkEmailRateLimit,
  RATE_LIMITS,
} from './rateLimit';

describe('rateLimit', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const action = 'test-action';
      const config = { maxRequests: 5, windowMs: 60000 };

      // First request should be allowed
      const result1 = checkRateLimit(identifier, action, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Second request should be allowed
      const result2 = checkRateLimit(identifier, action, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      const action = 'test-action';
      const config = { maxRequests: 3, windowMs: 60000 };

      // Make 3 requests (at limit)
      checkRateLimit(identifier, action, config);
      checkRateLimit(identifier, action, config);
      const result3 = checkRateLimit(identifier, action, config);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);

      // 4th request should be blocked
      const result4 = checkRateLimit(identifier, action, config);
      expect(result4.allowed).toBe(false);
      expect(result4.remaining).toBe(0);
      expect(result4.retryAfter).toBeGreaterThan(0);
    });

    it('should track different identifiers separately', () => {
      const action = 'test-action';
      const config = { maxRequests: 2, windowMs: 60000 };

      const result1 = checkRateLimit('user-a', action, config);
      const result2 = checkRateLimit('user-b', action, config);

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should track different actions separately', () => {
      const identifier = 'test-user-3';
      const config = { maxRequests: 2, windowMs: 60000 };

      const result1 = checkRateLimit(identifier, 'action-a', config);
      const result2 = checkRateLimit(identifier, 'action-b', config);

      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should include reset timestamp', () => {
      const identifier = 'test-user-4';
      const action = 'test-action';
      const config = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(identifier, action, config);

      expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(result.reset).toBeLessThanOrEqual(Math.floor((Date.now() + config.windowMs) / 1000));
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should return success when within limits', () => {
      const identifier = 'test-user-5';
      const action = 'test-action';
      const config = { maxRequests: 5, windowMs: 60000 };

      const result = rateLimitMiddleware(identifier, action, config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should return error when exceeding limits', () => {
      const identifier = 'test-user-6';
      const action = 'test-action';
      const config = { maxRequests: 2, windowMs: 60000 };

      // Exhaust the limit
      rateLimitMiddleware(identifier, action, config);
      rateLimitMiddleware(identifier, action, config);

      // This should fail
      const result = rateLimitMiddleware(identifier, action, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(result.error.details).toHaveProperty('retryAfter');
      }
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return standard rate limit headers', () => {
      const result = {
        allowed: true,
        limit: 10,
        remaining: 5,
        reset: 1234567890,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBe('1234567890');
    });

    it('should include Retry-After when provided', () => {
      const result = {
        allowed: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
        retryAfter: 60,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['Retry-After']).toBe('60');
    });
  });

  describe('checkEmailRateLimit', () => {
    it('should allow email within limits', () => {
      const userId = 'user-email-1';
      const recipientEmail = 'recipient1@example.com';

      const result = checkEmailRateLimit(userId, recipientEmail);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canSend).toBe(true);
      }
    });

    it('should block email when user limit exceeded', () => {
      const userId = 'user-email-2';
      const recipientEmail = 'recipient2@example.com';

      // Exhaust user limit (10 emails per hour)
      for (let i = 0; i < 10; i++) {
        checkEmailRateLimit(userId, `recipient${i}@example.com`);
      }

      const result = checkEmailRateLimit(userId, recipientEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMAIL_RATE_LIMIT_EXCEEDED');
      }
    });

    it('should block email when recipient limit exceeded', () => {
      const recipientEmail = 'recipient3@example.com';

      // Exhaust recipient limit (3 emails per hour)
      for (let i = 0; i < 3; i++) {
        checkEmailRateLimit(`user${i}@example.com`, recipientEmail);
      }

      const result = checkEmailRateLimit('another-user@example.com', recipientEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RECIPIENT_RATE_LIMIT_EXCEEDED');
      }
    });
  });

  describe('checkBulkEmailRateLimit', () => {
    it('should allow bulk email within limits', () => {
      const userId = 'user-bulk-1';
      const recipientCount = 50;

      const result = checkBulkEmailRateLimit(userId, recipientCount);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canSend).toBe(true);
      }
    });

    it('should block bulk email when limit exceeded', () => {
      const userId = 'user-bulk-2';

      // Exhaust bulk limit (100 per hour)
      for (let i = 0; i < 100; i++) {
        checkBulkEmailRateLimit(userId, 1);
      }

      const result = checkBulkEmailRateLimit(userId, 10);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BULK_EMAIL_RATE_LIMIT_EXCEEDED');
      }
    });

    it('should block bulk email when recipient count would exceed remaining limit', () => {
      const userId = 'user-bulk-3';

      // Use up 95 of 100 limit
      for (let i = 0; i < 95; i++) {
        checkBulkEmailRateLimit(userId, 1);
      }

      // Try to send to 10 recipients (would exceed limit)
      const result = checkBulkEmailRateLimit(userId, 10);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BULK_EMAIL_WOULD_EXCEED_LIMIT');
        expect(result.error.details).toHaveProperty('remaining');
      }
    });
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have API rate limits defined', () => {
      expect(RATE_LIMITS.api.strict).toBeDefined();
      expect(RATE_LIMITS.api.moderate).toBeDefined();
      expect(RATE_LIMITS.api.relaxed).toBeDefined();
    });

    it('should have email rate limits defined', () => {
      expect(RATE_LIMITS.email.perUser).toBeDefined();
      expect(RATE_LIMITS.email.perRecipient).toBeDefined();
      expect(RATE_LIMITS.email.bulk).toBeDefined();
    });

    it('should have auth rate limits defined', () => {
      expect(RATE_LIMITS.auth.login).toBeDefined();
      expect(RATE_LIMITS.auth.passwordReset).toBeDefined();
    });

    it('should have upload rate limits defined', () => {
      expect(RATE_LIMITS.upload.photos).toBeDefined();
      expect(RATE_LIMITS.upload.documents).toBeDefined();
    });
  });
});
