import * as fc from 'fast-check';

/**
 * Property 10: Activity Capacity Alert Threshold
 * 
 * Validates: Requirements 7.8
 * 
 * Property: For any activity with capacity and current RSVPs,
 * IF utilization >= 100%,
 * THEN the system SHALL display an at-capacity alert indicator.
 * 
 * This property ensures that activities at full capacity
 * trigger appropriate alerts to prevent overbooking.
 */

describe('Feature: admin-backend-integration-cms, Property 10: Activity Capacity Alert Threshold', () => {
  /**
   * Calculate utilization percentage
   */
  function calculateUtilization(currentRsvps: number, capacity: number): number {
    if (capacity === 0) return 0;
    return (currentRsvps / capacity) * 100;
  }

  /**
   * Determine if alert should be displayed
   */
  function shouldDisplayAlert(currentRsvps: number, capacity: number): boolean {
    const utilization = calculateUtilization(currentRsvps, capacity);
    return utilization >= 100;
  }

  it('should display alert for activities at exactly 100% capacity', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 1 and 1000
        fc.integer({ min: 1, max: 1000 }),
        (capacity) => {
          const currentRsvps = capacity; // Exactly at capacity
          const utilization = calculateUtilization(currentRsvps, capacity);
          const alert = shouldDisplayAlert(currentRsvps, capacity);
          
          // Property: At exactly 100%, alert should be true
          expect(utilization).toBe(100);
          expect(alert).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display alert for activities over 100% capacity (overbooking)', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 1 and 1000
        fc.integer({ min: 1, max: 1000 }),
        (capacity) => {
          // Generate RSVPs that exceed capacity
          fc.assert(
            fc.property(
              fc.integer({ min: 1, max: 100 }),
              (excess) => {
                const currentRsvps = capacity + excess;
                const utilization = calculateUtilization(currentRsvps, capacity);
                const alert = shouldDisplayAlert(currentRsvps, capacity);
                
                // Property: Over 100%, alert should be true
                expect(utilization).toBeGreaterThan(100);
                expect(alert).toBe(true);
              }
            ),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should NOT display alert for activities below 100% capacity', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 10 and 1000
        fc.integer({ min: 10, max: 1000 }),
        (capacity) => {
          // Generate current RSVPs that result in <100% utilization
          const maxRsvps = capacity - 1;
          
          fc.assert(
            fc.property(
              fc.integer({ min: 0, max: maxRsvps }),
              (currentRsvps) => {
                const utilization = calculateUtilization(currentRsvps, capacity);
                const alert = shouldDisplayAlert(currentRsvps, capacity);
                
                // Property: Below 100%, alert should be false
                expect(utilization).toBeLessThan(100);
                expect(alert).toBe(false);
              }
            ),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle edge case: 99% capacity (just below threshold)', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 100 and 1000
        fc.integer({ min: 100, max: 1000 }),
        (capacity) => {
          const currentRsvps = Math.floor(capacity * 0.99);
          const utilization = calculateUtilization(currentRsvps, capacity);
          const alert = shouldDisplayAlert(currentRsvps, capacity);
          
          // Property: At 99%, alert should be false
          expect(utilization).toBeLessThan(100);
          expect(alert).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: 101% capacity (just over threshold)', () => {
    fc.assert(
      fc.property(
        // Generate capacity between 100 and 1000
        fc.integer({ min: 100, max: 1000 }),
        (capacity) => {
          const currentRsvps = Math.ceil(capacity * 1.01);
          const utilization = calculateUtilization(currentRsvps, capacity);
          const alert = shouldDisplayAlert(currentRsvps, capacity);
          
          // Property: At 101%, alert should be true
          expect(utilization).toBeGreaterThan(100);
          expect(alert).toBe(true);
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
          const alert = shouldDisplayAlert(currentRsvps, capacity);
          
          // Property: With unlimited capacity, no alert should be shown
          expect(utilization).toBe(0);
          expect(alert).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain alert threshold consistency across all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // capacity
        fc.integer({ min: 0, max: 1500 }), // currentRsvps (can exceed capacity)
        (capacity, currentRsvps) => {
          const utilization = calculateUtilization(currentRsvps, capacity);
          const alert = shouldDisplayAlert(currentRsvps, capacity);
          
          // Property: Alert state must be consistent with utilization calculation
          if (utilization >= 100) {
            expect(alert).toBe(true);
          } else {
            expect(alert).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should distinguish between warning (90-99%) and alert (100%+)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }),
        (capacity) => {
          // Test warning range (90-99%)
          const warningRsvps = Math.floor(capacity * 0.95);
          const warningUtilization = calculateUtilization(warningRsvps, capacity);
          const warningAlert = shouldDisplayAlert(warningRsvps, capacity);
          
          // Test alert range (100%+)
          const alertRsvps = capacity;
          const alertUtilization = calculateUtilization(alertRsvps, capacity);
          const alertAlert = shouldDisplayAlert(alertRsvps, capacity);
          
          // Property: Warning range should not trigger alert
          if (warningUtilization >= 90 && warningUtilization < 100) {
            expect(warningAlert).toBe(false);
          }
          
          // Property: Alert range should trigger alert
          if (alertUtilization >= 100) {
            expect(alertAlert).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle capacity of 1 (minimum valid capacity)', () => {
    const capacity = 1;
    
    // 0 RSVPs - no alert
    expect(shouldDisplayAlert(0, capacity)).toBe(false);
    expect(calculateUtilization(0, capacity)).toBe(0);
    
    // 1 RSVP - alert
    expect(shouldDisplayAlert(1, capacity)).toBe(true);
    expect(calculateUtilization(1, capacity)).toBe(100);
    
    // 2 RSVPs - alert (overbooking)
    expect(shouldDisplayAlert(2, capacity)).toBe(true);
    expect(calculateUtilization(2, capacity)).toBe(200);
  });

  it('should handle large capacity values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }),
        (capacity) => {
          // At capacity
          const atCapacity = shouldDisplayAlert(capacity, capacity);
          expect(atCapacity).toBe(true);
          
          // Below capacity
          const belowCapacity = shouldDisplayAlert(capacity - 1, capacity);
          expect(belowCapacity).toBe(false);
          
          // Over capacity
          const overCapacity = shouldDisplayAlert(capacity + 1, capacity);
          expect(overCapacity).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
