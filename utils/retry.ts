import type { Result } from '@/types';

/**
 * Retry configuration options.
 */
export interface RetryConfig {
  maxRetries: number; // Maximum number of retry attempts
  baseDelay: number; // Base delay in milliseconds
  maxDelay?: number; // Maximum delay cap in milliseconds
  exponential?: boolean; // Use exponential backoff (default: true)
  jitter?: boolean; // Add random jitter (default: true)
  retryableErrors?: string[]; // Only retry these error codes
}

/**
 * Retry result with attempt information.
 */
export type RetryResult<T> = Result<T> & {
  attempts: number;
  totalTime: number;
};

/**
 * Calculates delay for retry attempt with exponential backoff and jitter.
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay: number;

  if (config.exponential !== false) {
    // Exponential backoff: baseDelay * 2^attempt
    delay = config.baseDelay * Math.pow(2, attempt);
  } else {
    // Linear backoff: baseDelay * (attempt + 1)
    delay = config.baseDelay * (attempt + 1);
  }

  // Apply max delay cap if specified
  if (config.maxDelay && delay > config.maxDelay) {
    delay = config.maxDelay;
  }

  // Add jitter if enabled (default: true)
  if (config.jitter !== false) {
    const jitterAmount = delay * 0.1; // 10% jitter
    const jitter = Math.random() * jitterAmount;
    delay = delay + jitter;
  }

  return Math.floor(delay);
}

/**
 * Checks if an error is retryable based on configuration.
 * 
 * @param error - Error to check
 * @param config - Retry configuration
 * @returns True if error should be retried
 */
function isRetryableError(error: { code: string }, config: RetryConfig): boolean {
  // If no specific retryable errors configured, retry all errors
  if (!config.retryableErrors || config.retryableErrors.length === 0) {
    return true;
  }

  return config.retryableErrors.includes(error.code);
}

/**
 * Executes a function with automatic retry on failure.
 * 
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Result with attempt information
 * 
 * @example
 * const result = await retryWithBackoff(
 *   async () => await externalService.call(),
 *   {
 *     maxRetries: 3,
 *     baseDelay: 1000,
 *     retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
 *   }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<Result<T>>,
  config: RetryConfig
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let lastError: { code: string; message: string; details?: unknown } | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      if (result.success) {
        return {
          ...result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime,
        };
      }

      lastError = result.error;

      // Check if error is retryable
      if (!isRetryableError(result.error, config)) {
        return {
          ...result,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime,
        };
      }

      // If this was the last attempt, don't delay
      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate and wait for retry delay
      const delay = calculateDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Execution failed',
        details: error,
      };

      // If this was the last attempt, don't delay
      if (attempt === config.maxRetries) {
        break;
      }

      // Calculate and wait for retry delay
      const delay = calculateDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError || {
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Failed after ${config.maxRetries + 1} attempts`,
    },
    attempts: config.maxRetries + 1,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Creates a retry wrapper function with predefined configuration.
 * 
 * @param config - Retry configuration
 * @returns Function that wraps any async function with retry logic
 * 
 * @example
 * const retryThreeTimes = createRetryWrapper({
 *   maxRetries: 3,
 *   baseDelay: 1000,
 * });
 * 
 * const result = await retryThreeTimes(() => externalService.call());
 */
export function createRetryWrapper(config: RetryConfig) {
  return async <T>(fn: () => Promise<Result<T>>): Promise<RetryResult<T>> => {
    return retryWithBackoff(fn, config);
  };
}

/**
 * Default retry configurations for common scenarios.
 */
export const RetryPresets = {
  /**
   * Quick retry for transient network errors.
   */
  network: {
    maxRetries: 3,
    baseDelay: 500,
    maxDelay: 5000,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_ERROR'],
  },

  /**
   * Aggressive retry for critical operations.
   */
  critical: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  },

  /**
   * Conservative retry for rate-limited APIs.
   */
  rateLimited: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 60000,
    retryableErrors: ['RATE_LIMIT_EXCEEDED', 'TOO_MANY_REQUESTS'],
  },

  /**
   * Minimal retry for non-critical operations.
   */
  minimal: {
    maxRetries: 1,
    baseDelay: 1000,
    maxDelay: 2000,
  },
} as const;
