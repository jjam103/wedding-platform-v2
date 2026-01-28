/**
 * Rate limiting utilities for API endpoints and email sending
 */

/**
 * Result type for consistent error handling
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  retryAfter?: number; // Seconds until retry is allowed
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * In-memory store for rate limiting
 * In production, this should be replaced with Redis or similar
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Gets the current count and reset time for an identifier
   */
  get(key: string): { count: number; resetAt: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if the window has expired
    if (Date.now() > entry.resetAt) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Increments the count for an identifier
   */
  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      this.store.set(key, existing);
      return existing;
    }

    const resetAt = Date.now() + windowMs;
    const entry = { count: 1, resetAt };
    this.store.set(key, entry);
    return entry;
  }

  /**
   * Clears expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
const store = new RateLimitStore();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => store.cleanup(), 5 * 60 * 1000);
}

/**
 * Checks if a request is within rate limits.
 * 
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param action - Action being rate limited (e.g., 'api:guests:create')
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 * 
 * @example
 * const result = await checkRateLimit('user-123', 'api:guests:create', {
 *   maxRequests: 10,
 *   windowMs: 60000, // 1 minute
 * });
 * 
 * if (!result.allowed) {
 *   return Response with 429 status
 * }
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${identifier}:${action}`;
  const entry = store.increment(key, config.windowMs);

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = Math.floor(entry.resetAt / 1000); // Convert to seconds
  const retryAfter = allowed ? undefined : Math.ceil((entry.resetAt - Date.now()) / 1000);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    reset,
    retryAfter,
  };
}

/**
 * Predefined rate limit configurations for common use cases
 */
export const RATE_LIMITS = {
  // API endpoints
  api: {
    strict: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    moderate: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
    relaxed: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  },
  // Email sending
  email: {
    perUser: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 emails per hour per user
    perRecipient: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 emails per hour per recipient
    bulk: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 bulk emails per hour
  },
  // Authentication
  auth: {
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 login attempts per 15 minutes
    passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 password resets per hour
  },
  // File uploads
  upload: {
    photos: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 photo uploads per hour
    documents: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 document uploads per hour
  },
} as const;

/**
 * Middleware helper for rate limiting API routes.
 * 
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param action - Action being rate limited
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 * 
 * @example
 * const rateLimitResult = await rateLimitMiddleware(
 *   session.user.id,
 *   'api:guests:create',
 *   RATE_LIMITS.api.moderate
 * );
 * 
 * if (!rateLimitResult.success) {
 *   return NextResponse.json(rateLimitResult, { status: 429 });
 * }
 */
export function rateLimitMiddleware(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Result<RateLimitResult> {
  try {
    const result = checkRateLimit(identifier, action, config);

    if (!result.allowed) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retryAfter: result.retryAfter,
          },
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    return {
      success: true,
      data: {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.floor((Date.now() + config.windowMs) / 1000),
      },
    };
  }
}

/**
 * Gets rate limit headers for HTTP responses.
 * 
 * @param result - Rate limit check result
 * @returns Headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Email-specific rate limiting helper.
 * 
 * @param userId - User ID sending the email
 * @param recipientEmail - Recipient email address
 * @returns Result indicating if email can be sent
 */
export function checkEmailRateLimit(
  userId: string,
  recipientEmail: string
): Result<{ canSend: boolean; reason?: string }> {
  // Check per-user limit
  const userLimit = checkRateLimit(userId, 'email:send', RATE_LIMITS.email.perUser);
  if (!userLimit.allowed) {
    return {
      success: false,
      error: {
        code: 'EMAIL_RATE_LIMIT_EXCEEDED',
        message: 'You have sent too many emails. Please try again later.',
        details: {
          limit: userLimit.limit,
          retryAfter: userLimit.retryAfter,
        },
      },
    };
  }

  // Check per-recipient limit
  const recipientLimit = checkRateLimit(
    recipientEmail,
    'email:receive',
    RATE_LIMITS.email.perRecipient
  );
  if (!recipientLimit.allowed) {
    return {
      success: false,
      error: {
        code: 'RECIPIENT_RATE_LIMIT_EXCEEDED',
        message: 'This recipient has received too many emails. Please try again later.',
        details: {
          limit: recipientLimit.limit,
          retryAfter: recipientLimit.retryAfter,
        },
      },
    };
  }

  return {
    success: true,
    data: {
      canSend: true,
    },
  };
}

/**
 * Bulk email rate limiting helper.
 * 
 * @param userId - User ID sending bulk emails
 * @param recipientCount - Number of recipients
 * @returns Result indicating if bulk email can be sent
 */
export function checkBulkEmailRateLimit(
  userId: string,
  recipientCount: number
): Result<{ canSend: boolean; reason?: string }> {
  const bulkLimit = checkRateLimit(userId, 'email:bulk', RATE_LIMITS.email.bulk);

  if (!bulkLimit.allowed) {
    return {
      success: false,
      error: {
        code: 'BULK_EMAIL_RATE_LIMIT_EXCEEDED',
        message: 'You have sent too many bulk emails. Please try again later.',
        details: {
          limit: bulkLimit.limit,
          retryAfter: bulkLimit.retryAfter,
        },
      },
    };
  }

  // Check if this bulk send would exceed the limit
  if (bulkLimit.remaining < recipientCount) {
    return {
      success: false,
      error: {
        code: 'BULK_EMAIL_WOULD_EXCEED_LIMIT',
        message: `Sending to ${recipientCount} recipients would exceed your rate limit. You can send to ${bulkLimit.remaining} more recipients.`,
        details: {
          limit: bulkLimit.limit,
          remaining: bulkLimit.remaining,
          requested: recipientCount,
        },
      },
    };
  }

  return {
    success: true,
    data: {
      canSend: true,
    },
  };
}

export const rateLimitService = {
  check: checkRateLimit,
  middleware: rateLimitMiddleware,
  getHeaders: getRateLimitHeaders,
  checkEmail: checkEmailRateLimit,
  checkBulkEmail: checkBulkEmailRateLimit,
};
