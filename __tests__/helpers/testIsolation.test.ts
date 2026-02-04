/**
 * Test Isolation Utilities Tests
 * 
 * Validates that test isolation utilities work correctly for parallel execution.
 */

import {
  generateTestId,
  generateTestEmail,
  generateTestSlug,
  createCleanupTracker,
  createTestNamespace,
  waitFor,
  retry,
  getWorkerId,
  isCI,
  getTestMode,
} from './testIsolation';

describe('Test Isolation Utilities', () => {
  describe('generateTestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTestId('test');
      const id2 = generateTestId('test');
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test-[a-f0-9]+-[a-z0-9]+-w\d+$/);
    });
    
    it('should include worker ID', () => {
      const id = generateTestId('test');
      const workerId = process.env.JEST_WORKER_ID || '0';
      
      expect(id).toContain(`-w${workerId}`);
    });
    
    it('should use custom prefix', () => {
      const id = generateTestId('custom');
      
      expect(id).toMatch(/^custom-/);
    });
  });
  
  describe('generateTestEmail', () => {
    it('should generate unique emails', () => {
      const email1 = generateTestEmail('user');
      const email2 = generateTestEmail('user');
      
      expect(email1).not.toBe(email2);
      expect(email1).toMatch(/^user-[a-f0-9]+-[a-z0-9]+-w\d+@test\.example\.com$/);
    });
    
    it('should be valid email format', () => {
      const email = generateTestEmail('test');
      
      expect(email).toContain('@');
      expect(email).toContain('test.example.com');
    });
  });
  
  describe('generateTestSlug', () => {
    it('should generate unique slugs', () => {
      const slug1 = generateTestSlug('page');
      const slug2 = generateTestSlug('page');
      
      expect(slug1).not.toBe(slug2);
      expect(slug1).toMatch(/^page-[a-f0-9]+-[a-z0-9]+-w\d+$/);
    });
  });
  
  describe('createCleanupTracker', () => {
    it('should track resources', () => {
      const tracker = createCleanupTracker();
      
      tracker.track('guests', 'guest-1');
      tracker.track('guests', 'guest-2');
      tracker.track('events', 'event-1');
      
      expect(tracker.getTracked('guests')).toEqual(['guest-1', 'guest-2']);
      expect(tracker.getTracked('events')).toEqual(['event-1']);
    });
    
    it('should not track duplicates', () => {
      const tracker = createCleanupTracker();
      
      tracker.track('guests', 'guest-1');
      tracker.track('guests', 'guest-1');
      
      expect(tracker.getTracked('guests')).toEqual(['guest-1']);
    });
    
    it('should clear tracking', () => {
      const tracker = createCleanupTracker();
      
      tracker.track('guests', 'guest-1');
      tracker.clear();
      
      expect(tracker.getTracked('guests')).toEqual([]);
    });
    
    it('should cleanup resources', async () => {
      const tracker = createCleanupTracker();
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
      
      tracker.track('guests', 'guest-1');
      tracker.track('guests', 'guest-2');
      
      await tracker.cleanupAll(mockSupabase);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('guests');
    });
    
    it('should handle cleanup errors gracefully', async () => {
      const tracker = createCleanupTracker();
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ 
              error: { message: 'Cleanup failed' } 
            }),
          }),
        }),
      };
      
      tracker.track('guests', 'guest-1');
      
      // Should not throw
      await expect(tracker.cleanupAll(mockSupabase)).resolves.not.toThrow();
    });
  });
  
  describe('createTestNamespace', () => {
    it('should create namespaced identifiers', () => {
      const ns = createTestNamespace('flow');
      
      expect(ns.id).toMatch(/^flow-/);
      expect(ns.name('test')).toContain(ns.id);
      expect(ns.email('user')).toContain(ns.id);
      expect(ns.slug('page')).toContain(ns.id);
      expect(ns.subId('sub')).toContain(ns.id);
    });
    
    it('should generate consistent namespace', () => {
      const ns = createTestNamespace('test');
      
      const name1 = ns.name('item');
      const name2 = ns.name('item');
      
      expect(name1).toBe(name2);
    });
    
    it('should generate valid emails', () => {
      const ns = createTestNamespace('test');
      const email = ns.email('john');
      
      expect(email).toMatch(/@test\.example\.com$/);
      expect(email).toContain(ns.id);
    });
  });
  
  describe('waitFor', () => {
    it('should resolve when condition is met', async () => {
      let value = false;
      setTimeout(() => { value = true; }, 100);
      
      await expect(waitFor(() => value, 1000)).resolves.not.toThrow();
    });
    
    it('should timeout if condition not met', async () => {
      await expect(
        waitFor(() => false, 100)
      ).rejects.toThrow('Timeout waiting for condition');
    });
    
    it('should support async conditions', async () => {
      let value = false;
      setTimeout(() => { value = true; }, 100);
      
      await expect(
        waitFor(async () => value, 1000)
      ).resolves.not.toThrow();
    });
  });
  
  describe('retry', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await retry(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await retry(fn, 3, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retry(fn, 2, 10)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
    
    it('should use exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retry(fn, 2, 100);
      const duration = Date.now() - startTime;
      
      // Should wait at least 100ms for first retry
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });
  
  describe('getWorkerId', () => {
    it('should return worker ID', () => {
      const workerId = getWorkerId();
      
      expect(workerId).toBeDefined();
      expect(typeof workerId).toBe('string');
    });
  });
  
  describe('isCI', () => {
    it('should detect CI environment', () => {
      const originalCI = process.env.CI;
      
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
      
      process.env.CI = 'false';
      expect(isCI()).toBe(false);
      
      delete process.env.CI;
      expect(isCI()).toBe(false);
      
      // Restore
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      }
    });
  });
  
  describe('getTestMode', () => {
    it('should detect parallel mode', () => {
      const mode = getTestMode();
      
      expect(mode).toMatch(/^(parallel|serial)$/);
      
      if (process.env.JEST_WORKER_ID) {
        expect(mode).toBe('parallel');
      } else {
        expect(mode).toBe('serial');
      }
    });
  });
});
