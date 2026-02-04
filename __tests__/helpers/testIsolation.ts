/**
 * Test Isolation Utilities
 * 
 * Ensures tests can run in parallel without interfering with each other.
 * Provides unique identifiers and cleanup mechanisms for test data.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a unique test identifier for parallel test isolation.
 * Each test worker gets unique IDs to prevent data collisions.
 * 
 * @param prefix - Optional prefix for the identifier
 * @returns Unique identifier string
 * 
 * @example
 * const testId = generateTestId('guest');
 * // Returns: 'guest-abc123-worker1'
 */
export function generateTestId(prefix: string = 'test'): string {
  const workerId = process.env.JEST_WORKER_ID || '0';
  const randomId = randomBytes(4).toString('hex');
  const timestamp = Date.now().toString(36);
  
  return `${prefix}-${randomId}-${timestamp}-w${workerId}`;
}

/**
 * Generate a unique email for test users.
 * Ensures each test worker has unique email addresses.
 * 
 * @param prefix - Optional prefix for the email
 * @returns Unique email address
 * 
 * @example
 * const email = generateTestEmail('admin');
 * // Returns: 'admin-abc123-worker1@test.example.com'
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const testId = generateTestId(prefix);
  return `${testId}@test.example.com`;
}

/**
 * Generate a unique slug for test content.
 * Ensures each test worker has unique slugs.
 * 
 * @param prefix - Optional prefix for the slug
 * @returns Unique slug string
 * 
 * @example
 * const slug = generateTestSlug('page');
 * // Returns: 'page-abc123-worker1'
 */
export function generateTestSlug(prefix: string = 'test'): string {
  return generateTestId(prefix);
}

/**
 * Create a test-scoped cleanup tracker.
 * Tracks resources created during a test for cleanup.
 * 
 * @returns Cleanup tracker object
 * 
 * @example
 * const cleanup = createCleanupTracker();
 * cleanup.track('guest', guestId);
 * await cleanup.cleanupAll(supabase);
 */
export function createCleanupTracker() {
  const resources: Map<string, Set<string>> = new Map();
  
  return {
    /**
     * Track a resource for cleanup
     */
    track(table: string, id: string): void {
      if (!resources.has(table)) {
        resources.set(table, new Set());
      }
      resources.get(table)!.add(id);
    },
    
    /**
     * Get all tracked resources for a table
     */
    getTracked(table: string): string[] {
      return Array.from(resources.get(table) || []);
    },
    
    /**
     * Clean up all tracked resources
     */
    async cleanupAll(supabase: any): Promise<void> {
      const errors: Error[] = [];
      
      for (const [table, ids] of resources.entries()) {
        try {
          if (ids.size > 0) {
            const { error } = await supabase
              .from(table)
              .delete()
              .in('id', Array.from(ids));
            
            if (error) {
              errors.push(new Error(`Failed to cleanup ${table}: ${error.message}`));
            }
          }
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }
      
      if (errors.length > 0) {
        console.warn('Cleanup errors:', errors);
      }
      
      resources.clear();
    },
    
    /**
     * Clear tracking without cleanup (for when resources are already deleted)
     */
    clear(): void {
      resources.clear();
    }
  };
}

/**
 * Create a test-scoped namespace for data isolation.
 * Useful for tests that need to create multiple related entities.
 * 
 * @returns Namespace object with unique identifiers
 * 
 * @example
 * const ns = createTestNamespace('guest-flow');
 * const group = await createGroup({ name: ns.name('Family Group') });
 * const guest = await createGuest({ email: ns.email('john') });
 */
export function createTestNamespace(prefix: string = 'test') {
  const baseId = generateTestId(prefix);
  
  return {
    id: baseId,
    
    /**
     * Generate a namespaced name
     */
    name(suffix: string): string {
      return `${baseId}-${suffix}`;
    },
    
    /**
     * Generate a namespaced email
     */
    email(suffix: string): string {
      return `${baseId}-${suffix}@test.example.com`;
    },
    
    /**
     * Generate a namespaced slug
     */
    slug(suffix: string): string {
      return `${baseId}-${suffix}`;
    },
    
    /**
     * Generate a namespaced ID
     */
    subId(suffix: string): string {
      return `${baseId}-${suffix}`;
    }
  };
}

/**
 * Wait for a condition with timeout.
 * Useful for waiting for async operations in tests.
 * 
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Check interval in milliseconds
 * @returns Promise that resolves when condition is met or rejects on timeout
 * 
 * @example
 * await waitFor(() => data.length > 0, 5000);
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Retry a function with exponential backoff.
 * Useful for flaky operations like external API calls.
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Result of the function
 * 
 * @example
 * const result = await retry(() => fetchData(), 3, 100);
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Get the current Jest worker ID.
 * Useful for debugging parallel test issues.
 * 
 * @returns Worker ID string
 */
export function getWorkerId(): string {
  return process.env.JEST_WORKER_ID || '0';
}

/**
 * Check if running in CI environment.
 * 
 * @returns True if running in CI
 */
export function isCI(): boolean {
  return process.env.CI === 'true';
}

/**
 * Get test execution mode.
 * 
 * @returns 'parallel' or 'serial'
 */
export function getTestMode(): 'parallel' | 'serial' {
  return process.env.JEST_WORKER_ID ? 'parallel' : 'serial';
}
