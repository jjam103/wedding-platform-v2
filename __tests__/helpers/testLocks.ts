/**
 * Test Execution Locks
 * 
 * Provides locking mechanism to prevent race conditions when multiple tests
 * access shared resources in parallel execution.
 */

const locks = new Map<string, Promise<void>>();

/**
 * Execute a function with a lock on a resource
 * 
 * Ensures only one test can access the resource at a time.
 * Other tests will wait for the lock to be released.
 * 
 * @param resourceId - Unique identifier for the resource
 * @param fn - Function to execute with the lock
 * @returns Result of the function
 * 
 * @example
 * await withLock('admin-settings', async () => {
 *   // Only one test can modify admin settings at a time
 *   const result = await updateSettings({ theme: 'dark' });
 *   expect(result.success).toBe(true);
 * });
 */
export async function withLock<T>(
  resourceId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Wait for existing lock
  while (locks.has(resourceId)) {
    await locks.get(resourceId);
    // Small delay to prevent tight loop
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Acquire lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  locks.set(resourceId, lockPromise);
  
  try {
    // Execute function
    return await fn();
  } finally {
    // Release lock
    locks.delete(resourceId);
    releaseLock!();
  }
}

/**
 * Check if a resource is currently locked
 * 
 * @param resourceId - Unique identifier for the resource
 * @returns True if locked, false otherwise
 */
export function isLocked(resourceId: string): boolean {
  return locks.has(resourceId);
}

/**
 * Wait for a resource to be unlocked
 * 
 * @param resourceId - Unique identifier for the resource
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns Promise that resolves when resource is unlocked
 */
export async function waitForUnlock(
  resourceId: string,
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now();
  
  while (locks.has(resourceId)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for lock on ${resourceId}`);
    }
    
    await locks.get(resourceId);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Clear all locks (use with caution!)
 * 
 * This should only be used in test cleanup or error recovery.
 */
export function clearAllLocks(): void {
  locks.clear();
}

/**
 * Get count of active locks
 * 
 * @returns Number of active locks
 */
export function getActiveLockCount(): number {
  return locks.size;
}

/**
 * Get list of locked resource IDs
 * 
 * @returns Array of resource IDs that are currently locked
 */
export function getLockedResources(): string[] {
  return Array.from(locks.keys());
}

export default {
  withLock,
  isLocked,
  waitForUnlock,
  clearAllLocks,
  getActiveLockCount,
  getLockedResources,
};
