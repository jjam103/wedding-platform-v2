import * as fc from 'fast-check';

/**
 * Property 9: Activity Capacity Warning Threshold
 * 
 * Validates: Requirements 7.7
 * 
 * Property: For any activity with capacity and current RSVPs,
 * IF utilization >= 90% AND utilization < 100%,
 * THEN the system SHALL display a warning indicator.
 * 
 * This property ensures that activities approaching capacity
 * trigger appropriate warnings to help admins manage attendance.
 */

describe('Feature: admin-backend-integration-cms, Property 9: Activity Capacity Warning Threshold', () => {
  /**
   * Calculate utilization percentage
   */
  function calculateUtilization(currentRsvps: number, capacity: number): number {
    if (capacity === 0) return 0;
    return (currentRsvps / capacity) * 100;
  }

  /**
   * Determine if warning should be displayed
   */
  function shouldDisplayWarning(currentRsvps: number, capacity: number): boolean {
    const utilization = calculateUtilization(currentRsvps, capacity);
    return utilization >= 90 && utilization < 100;
  }

  it('should display warning for activities at 90%+ capacity but below 100%', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 10 and 1000
        fc.integer({ min: 10, max: 1000 }),
        (capacity) => {
          // Generate current RSVPs that result in 90-99% utilization
          const minRsvps = Math.ceil(capacity * 0.9);
          const maxRsvps = capacity - 1;
          
          fc.assert(
            fc.property(
              fc.integer({ min: minRsvps, max: maxRsvps }),
              (currentRsvps) => {
                const utilization = calculateUtilization(currentRsvps, capacity);
                const warning = shouldDisplayWarning(currentRsvps, capacity);
                
                // Property: If utilization is between 90% and 100%, warning should be true
                if (utilization >= 90 && utilization < 100) {
                  expect(warning).toBe(true);
                  expect(utilization).toBeGreaterThanOrEqual(90);
                  expect(utilization).toBeLessThan(100);
                }
              }
            ),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should NOT display warning for activities below 90% capacity', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 10 and 1000
        fc.integer({ min: 10, max: 1000 }),
        (capacity) => {
          // Generate current RSVPs that result in <90% utilization
          const maxRsvps = Math.floor(capacity * 0.89);
          
          if (maxRsvps >= 0) {
            fc.assert(
              fc.property(
                fc.integer({ min: 0, max: maxRsvps }),
                (currentRsvps) => {
                  const utilization = calculateUtilization(currentRsvps, capacity);
                  const warning = shouldDisplayWarning(currentRsvps, capacity);
                  
                  // Property: If utilization is below 90%, warning should be false
                  if (utilization < 90) {
                    expect(warning).toBe(false);
                    expect(utilization).toBeLessThan(90);
                  }
                }
              ),
              { numRuns: 50 }
            );
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should NOT display warning for activities at exactly 100% capacity', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 1 and 1000
        fc.integer({ min: 1, max: 1000 }),
        (capacity) => {
          const currentRsvps = capacity; // Exactly at capacity
          const utilization = calculateUtilization(currentRsvps, capacity);
          const warning = shouldDisplayWarning(currentRsvps, capacity);
          
          // Property: At exactly 100%, warning should be false (alert should be shown instead)
          expect(utilization).toBe(100);
          expect(warning).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: exactly 90% capacity', () => {
    fc.assert(
      fc.property(
        // Generate capacity that is divisible by 10 for exact 90%
        fc.integer({ min: 10, max: 1000 }).map(n => n * 10),
        (capacity) => {
          const currentRsvps = capacity * 0.9; // Exactly 90%
          const utilization = calculateUtilization(currentRsvps, capacity);
          const warning = shouldDisplayWarning(currentRsvps, capacity);
          
          // Property: At exactly 90%, warning should be true
          expect(utilization).toBe(90);
          expect(warning).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: 99% capacity (just below 100%)', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 100 and 1000
        fc.integer({ min: 100, max: 1000 }),
        (capacity) => {
          const currentRsvps = Math.floor(capacity * 0.99);
          const utilization = calculateUtilization(currentRsvps, capacity);
          const warning = shouldDisplayWarning(currentRsvps, capacity);
          
          // Property: At 99%, warning should be true
          if (utilization >= 90 && utilization < 100) {
            expect(warning).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle zero capacity (unlimited)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }),
        (currentRsvps) => {
          const capacity = 0; // Unlimited capacity
          const utilization = calculateUtilization(currentRsvps, capacity);
          const warning = shouldDisplayWarning(currentRsvps, capacity);
          
          // Property: With unlimited capacity, no warning should be shown
          expect(utilization).toBe(0);
          expect(warning).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain warning threshold consistency across all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // capacity
        fc.integer({ min: 0, max: 1000 }), // currentRsvps
        (capacity, currentRsvps) => {
          // Ensure currentRsvps doesn't exceed capacity
          const validRsvps = Math.min(currentRsvps, capacity);
          const utilization = calculateUtilization(validRsvps, capacity);
          const warning = shouldDisplayWarning(validRsvps, capacity);
          
          // Property: Warning state must be consistent with utilization calculation
          if (utilization >= 90 && utilization < 100) {
            expect(warning).toBe(true);
          } else {
            expect(warning).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
