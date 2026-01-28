import type { Result } from '@/types';

/**
 * Circuit breaker states.
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration.
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time in ms before attempting to close circuit
  resetTimeout?: number; // Time in ms to reset failure count
}

/**
 * Circuit breaker statistics.
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
}

/**
 * Circuit breaker implementation for protecting external service calls.
 * 
 * States:
 * - Closed: Normal operation, requests pass through
 * - Open: Too many failures, requests fail fast
 * - Half-Open: Testing if service recovered, limited requests pass through
 * 
 * @example
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000,
 * });
 * 
 * const result = await breaker.execute(async () => {
 *   return await externalService.call();
 * });
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * Gets current circuit breaker statistics.
   */
  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Resets the circuit breaker to closed state.
   */
  public reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Executes a function with circuit breaker protection.
   * 
   * @param fn - Async function to execute
   * @returns Result from the function or circuit breaker error
   */
  public async execute<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
    // Check if circuit is open
    if (this.state === 'open') {
      const now = Date.now();
      
      // Check if timeout has elapsed
      if (this.nextAttemptTime && now < this.nextAttemptTime) {
        return {
          success: false,
          error: {
            code: 'CIRCUIT_OPEN',
            message: 'Circuit breaker is open, request blocked',
            details: {
              nextAttemptTime: this.nextAttemptTime,
              waitTime: this.nextAttemptTime - now,
            },
          },
        };
      }
      
      // Timeout elapsed, transition to half-open
      this.state = 'half-open';
      this.successes = 0;
    }

    try {
      // Execute the function
      const result = await fn();

      if (result.success) {
        this.onSuccess();
      } else {
        this.onFailure();
      }

      return result;
    } catch (error) {
      this.onFailure();
      
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Execution failed',
          details: error,
        },
      };
    }
  }

  /**
   * Handles successful execution.
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successes++;
      
      // If enough successes in half-open, close the circuit
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.successes = 0;
        this.nextAttemptTime = null;
      }
    }
  }

  /**
   * Handles failed execution.
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failures++;

    if (this.state === 'half-open') {
      // Any failure in half-open reopens the circuit
      this.state = 'open';
      this.successes = 0;
      this.nextAttemptTime = Date.now() + this.config.timeout;
    } else if (this.state === 'closed') {
      // Check if failure threshold reached
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        this.nextAttemptTime = Date.now() + this.config.timeout;
      }
    }
  }
}

/**
 * Global circuit breakers for external services.
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Gets or creates a circuit breaker for a service.
 * 
 * @param serviceName - Name of the external service
 * @param config - Circuit breaker configuration
 * @returns Circuit breaker instance
 */
export function getCircuitBreaker(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    };

    circuitBreakers.set(
      serviceName,
      new CircuitBreaker({ ...defaultConfig, ...config })
    );
  }

  return circuitBreakers.get(serviceName)!;
}

/**
 * Resets all circuit breakers.
 * Useful for testing or manual recovery.
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((breaker) => breaker.reset());
}

/**
 * Gets statistics for all circuit breakers.
 */
export function getAllCircuitBreakerStats(): Record<string, CircuitBreakerStats> {
  const stats: Record<string, CircuitBreakerStats> = {};
  
  circuitBreakers.forEach((breaker, serviceName) => {
    stats[serviceName] = breaker.getStats();
  });
  
  return stats;
}
