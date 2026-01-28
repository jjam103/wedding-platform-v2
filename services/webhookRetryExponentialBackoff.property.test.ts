import * as fc from 'fast-check';
import { calculateRetryDelay } from './webhookService';

/**
 * Feature: destination-wedding-platform, Property 32: Webhook Retry Exponential Backoff
 * 
 * For any failed webhook delivery, the retry delays should follow exponential backoff
 * (e.g., 1s, 2s, 4s, 8s), with each retry delay being approximately double the previous delay.
 * 
 * Validates: Requirements 19.6
 */

describe('Feature: destination-wedding-platform, Property 32: Webhook Retry Exponential Backoff', () => {
  describe('Exponential backoff calculation', () => {
    it('should follow exponential backoff pattern for retry delays', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }), // attempt number
          fc.integer({ min: 100, max: 5000 }), // base delay
          (attempt, baseDelay) => {
            const delay = calculateRetryDelay(attempt, baseDelay);
            
            // Expected delay is baseDelay * 2^attempt (with jitter)
            const expectedDelay = baseDelay * Math.pow(2, attempt);
            
            // Allow for 10% jitter
            const minDelay = expectedDelay * 0.9;
            const maxDelay = expectedDelay * 1.1;
            
            expect(delay).toBeGreaterThanOrEqual(minDelay);
            expect(delay).toBeLessThanOrEqual(maxDelay);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should double the delay with each retry attempt', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }), // attempt number (leave room for attempt + 1)
          fc.integer({ min: 100, max: 2000 }), // base delay
          (attempt, baseDelay) => {
            const delay1 = calculateRetryDelay(attempt, baseDelay);
            const delay2 = calculateRetryDelay(attempt + 1, baseDelay);
            
            // Second delay should be approximately double the first
            // Account for jitter by checking a range
            const ratio = delay2 / delay1;
            
            // Ratio should be close to 2 (between 1.8 and 2.2 accounting for jitter)
            expect(ratio).toBeGreaterThan(1.8);
            expect(ratio).toBeLessThan(2.2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase monotonically with attempt number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 100, max: 2000 }),
          (attempt, baseDelay) => {
            const delays = [];
            for (let i = attempt; i <= attempt + 3; i++) {
              delays.push(calculateRetryDelay(i, baseDelay));
            }
            
            // Each delay should be greater than the previous (accounting for jitter)
            for (let i = 1; i < delays.length; i++) {
              // Allow small variance due to jitter, but overall trend should be increasing
              expect(delays[i]).toBeGreaterThan(delays[i - 1] * 0.9);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Base delay parameter', () => {
    it('should scale proportionally with base delay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 100, max: 1000 }),
          (attempt, baseDelay) => {
            const delay1 = calculateRetryDelay(attempt, baseDelay);
            const delay2 = calculateRetryDelay(attempt, baseDelay * 2);
            
            // Doubling base delay should approximately double the result
            const ratio = delay2 / delay1;
            
            // Account for jitter - ratio should be close to 2
            expect(ratio).toBeGreaterThan(1.8);
            expect(ratio).toBeLessThan(2.2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default base delay of 1000ms when not specified', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          (attempt) => {
            const delayWithDefault = calculateRetryDelay(attempt);
            const delayWithExplicit = calculateRetryDelay(attempt, 1000);
            
            // Both should produce similar results (within jitter range)
            const ratio = delayWithDefault / delayWithExplicit;
            expect(ratio).toBeGreaterThan(0.9);
            expect(ratio).toBeLessThan(1.1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle attempt 0 correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 5000 }),
          (baseDelay) => {
            const delay = calculateRetryDelay(0, baseDelay);
            
            // For attempt 0, delay should be baseDelay * 2^0 = baseDelay (with jitter)
            expect(delay).toBeGreaterThanOrEqual(baseDelay * 0.9);
            expect(delay).toBeLessThanOrEqual(baseDelay * 1.1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle large attempt numbers without overflow', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 20 }),
          fc.integer({ min: 100, max: 1000 }),
          (attempt, baseDelay) => {
            const delay = calculateRetryDelay(attempt, baseDelay);
            
            // Should return a finite number
            expect(Number.isFinite(delay)).toBe(true);
            expect(delay).toBeGreaterThan(0);
            
            // Should still follow exponential pattern
            const expectedDelay = baseDelay * Math.pow(2, attempt);
            expect(delay).toBeGreaterThan(expectedDelay * 0.9);
            expect(delay).toBeLessThan(expectedDelay * 1.1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return integer milliseconds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 100, max: 5000 }),
          (attempt, baseDelay) => {
            const delay = calculateRetryDelay(attempt, baseDelay);
            
            // Should be an integer (no fractional milliseconds)
            expect(Number.isInteger(delay)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Jitter properties', () => {
    it('should add randomness to prevent thundering herd', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 1000, max: 2000 }),
          (attempt, baseDelay) => {
            // Generate multiple delays for the same attempt
            const delays = Array.from({ length: 10 }, () =>
              calculateRetryDelay(attempt, baseDelay)
            );
            
            // Not all delays should be identical (jitter adds randomness)
            const uniqueDelays = new Set(delays);
            
            // With 10 samples, we should see some variation
            // (might occasionally fail due to randomness, but very unlikely)
            expect(uniqueDelays.size).toBeGreaterThan(1);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should keep jitter within 10% of base exponential delay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 100, max: 5000 }),
          (attempt, baseDelay) => {
            const delay = calculateRetryDelay(attempt, baseDelay);
            const expectedDelay = baseDelay * Math.pow(2, attempt);
            
            // Jitter should be within 10% of expected delay
            const minDelay = expectedDelay * 0.9;
            const maxDelay = expectedDelay * 1.1;
            
            expect(delay).toBeGreaterThanOrEqual(minDelay);
            expect(delay).toBeLessThanOrEqual(maxDelay);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Practical retry scenarios', () => {
    it('should produce reasonable delays for typical retry sequences', () => {
      const baseDelay = 1000; // 1 second
      const delays = [];
      
      for (let attempt = 0; attempt < 5; attempt++) {
        delays.push(calculateRetryDelay(attempt, baseDelay));
      }
      
      // Verify the sequence follows exponential pattern
      // Attempt 0: ~1s, Attempt 1: ~2s, Attempt 2: ~4s, Attempt 3: ~8s, Attempt 4: ~16s
      expect(delays[0]).toBeGreaterThan(900);
      expect(delays[0]).toBeLessThan(1100);
      
      expect(delays[1]).toBeGreaterThan(1800);
      expect(delays[1]).toBeLessThan(2200);
      
      expect(delays[2]).toBeGreaterThan(3600);
      expect(delays[2]).toBeLessThan(4400);
      
      expect(delays[3]).toBeGreaterThan(7200);
      expect(delays[3]).toBeLessThan(8800);
      
      expect(delays[4]).toBeGreaterThan(14400);
      expect(delays[4]).toBeLessThan(17600);
    });

    it('should handle different base delays appropriately', () => {
      const attempt = 3;
      
      const delay100 = calculateRetryDelay(attempt, 100);
      const delay1000 = calculateRetryDelay(attempt, 1000);
      const delay5000 = calculateRetryDelay(attempt, 5000);
      
      // Delays should scale with base delay
      expect(delay1000).toBeGreaterThan(delay100 * 9);
      expect(delay1000).toBeLessThan(delay100 * 11);
      
      expect(delay5000).toBeGreaterThan(delay1000 * 4.5);
      expect(delay5000).toBeLessThan(delay1000 * 5.5);
    });
  });
});
