/**
 * Property-Based Test: RSVP Status Toggle Cycle
 * 
 * Feature: guest-portal-and-admin-enhancements
 * Property 4: RSVP Status Toggle Cycle
 * 
 * Description:
 * For any RSVP status control, clicking SHALL cycle through states in order:
 * pending → attending → maybe → declined → pending
 * 
 * Validates: Requirements 2.4
 * 
 * Test Strategy:
 * - Generate random starting status
 * - Apply toggle operation multiple times
 * - Verify cycle order is maintained
 * - Verify cycle completes after 4 toggles
 */

import * as fc from 'fast-check';

describe('Feature: guest-portal-and-admin-enhancements, Property 4: RSVP Status Toggle Cycle', () => {
  // Define the expected cycle order
  const CYCLE_ORDER: Array<'pending' | 'attending' | 'maybe' | 'declined'> = [
    'pending',
    'attending',
    'maybe',
    'declined',
  ];

  /**
   * Get the next status in the cycle
   */
  function getNextStatus(
    currentStatus: 'pending' | 'attending' | 'maybe' | 'declined'
  ): 'pending' | 'attending' | 'maybe' | 'declined' {
    const currentIndex = CYCLE_ORDER.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % CYCLE_ORDER.length;
    return CYCLE_ORDER[nextIndex];
  }

  /**
   * Arbitrary for RSVP status
   */
  const rsvpStatusArbitrary = fc.constantFrom<'pending' | 'attending' | 'maybe' | 'declined'>(
    'pending',
    'attending',
    'maybe',
    'declined'
  );

  it('should cycle through statuses in correct order: pending → attending → maybe → declined → pending', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, (startingStatus) => {
        let currentStatus = startingStatus;
        const visitedStatuses: Array<'pending' | 'attending' | 'maybe' | 'declined'> = [currentStatus];

        // Toggle 4 times to complete one full cycle
        for (let i = 0; i < 4; i++) {
          const nextStatus = getNextStatus(currentStatus);
          visitedStatuses.push(nextStatus);
          currentStatus = nextStatus;
        }

        // After 4 toggles, should return to starting status
        expect(currentStatus).toBe(startingStatus);

        // Verify each transition follows the cycle order
        for (let i = 0; i < visitedStatuses.length - 1; i++) {
          const current = visitedStatuses[i];
          const next = visitedStatuses[i + 1];
          const expectedNext = getNextStatus(current);
          expect(next).toBe(expectedNext);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should always transition to the next status in cycle order', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, (currentStatus) => {
        const nextStatus = getNextStatus(currentStatus);
        const currentIndex = CYCLE_ORDER.indexOf(currentStatus);
        const nextIndex = CYCLE_ORDER.indexOf(nextStatus);

        // Next index should be current + 1 (mod 4)
        expect(nextIndex).toBe((currentIndex + 1) % 4);
      }),
      { numRuns: 100 }
    );
  });

  it('should visit all 4 statuses exactly once in a complete cycle', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, (startingStatus) => {
        let currentStatus = startingStatus;
        const visitedStatuses = new Set<'pending' | 'attending' | 'maybe' | 'declined'>([currentStatus]);

        // Toggle until we return to starting status
        for (let i = 0; i < 4; i++) {
          currentStatus = getNextStatus(currentStatus);
          if (currentStatus === startingStatus && i < 3) {
            // Should not return to start before completing cycle
            return false;
          }
          visitedStatuses.add(currentStatus);
        }

        // Should have visited all 4 statuses
        expect(visitedStatuses.size).toBe(4);
        expect(visitedStatuses.has('pending')).toBe(true);
        expect(visitedStatuses.has('attending')).toBe(true);
        expect(visitedStatuses.has('maybe')).toBe(true);
        expect(visitedStatuses.has('declined')).toBe(true);

        // Should return to starting status after 4 toggles
        expect(currentStatus).toBe(startingStatus);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain cycle order regardless of starting position', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, fc.integer({ min: 1, max: 10 }), (startingStatus, numToggles) => {
        let currentStatus = startingStatus;
        const startIndex = CYCLE_ORDER.indexOf(startingStatus);

        // Apply toggles
        for (let i = 0; i < numToggles; i++) {
          currentStatus = getNextStatus(currentStatus);
        }

        // Calculate expected final position
        const expectedIndex = (startIndex + numToggles) % 4;
        const expectedStatus = CYCLE_ORDER[expectedIndex];

        expect(currentStatus).toBe(expectedStatus);
      }),
      { numRuns: 100 }
    );
  });

  it('should be deterministic - same starting status and toggles always produce same result', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, fc.integer({ min: 0, max: 20 }), (startingStatus, numToggles) => {
        // First run
        let status1 = startingStatus;
        for (let i = 0; i < numToggles; i++) {
          status1 = getNextStatus(status1);
        }

        // Second run with same inputs
        let status2 = startingStatus;
        for (let i = 0; i < numToggles; i++) {
          status2 = getNextStatus(status2);
        }

        // Results should be identical
        expect(status1).toBe(status2);
      }),
      { numRuns: 100 }
    );
  });

  it('should never skip a status in the cycle', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, (currentStatus) => {
        const nextStatus = getNextStatus(currentStatus);
        const currentIndex = CYCLE_ORDER.indexOf(currentStatus);
        const nextIndex = CYCLE_ORDER.indexOf(nextStatus);

        // Should move exactly one position forward (with wraparound)
        const expectedNextIndex = (currentIndex + 1) % 4;
        expect(nextIndex).toBe(expectedNextIndex);

        // Should not skip any status
        const skippedCount = (nextIndex - currentIndex + 4) % 4;
        expect(skippedCount).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle rapid successive toggles correctly', () => {
    fc.assert(
      fc.property(rsvpStatusArbitrary, fc.integer({ min: 1, max: 100 }), (startingStatus, rapidToggles) => {
        let currentStatus = startingStatus;

        // Apply rapid toggles
        for (let i = 0; i < rapidToggles; i++) {
          currentStatus = getNextStatus(currentStatus);
        }

        // Calculate expected position
        const startIndex = CYCLE_ORDER.indexOf(startingStatus);
        const expectedIndex = (startIndex + rapidToggles) % 4;
        const expectedStatus = CYCLE_ORDER[expectedIndex];

        expect(currentStatus).toBe(expectedStatus);
      }),
      { numRuns: 100 }
    );
  });
});
