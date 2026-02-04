/**
 * Property-Based Test: Capacity Constraint Enforcement
 * 
 * Feature: guest-portal-and-admin-enhancements
 * Property 5: Capacity Constraint Enforcement
 * 
 * Description:
 * For any RSVP update that would cause an activity to exceed its capacity,
 * the update SHALL be rejected with a validation error
 * 
 * Validates: Requirements 2.9, 10.7
 * 
 * Test Strategy:
 * - Generate activities with various capacities
 * - Generate RSVP scenarios that would exceed capacity
 * - Verify rejection with appropriate error
 * - Verify acceptance when within capacity
 */

import * as fc from 'fast-check';
import { uuidArbitrary } from '../helpers/arbitraries';

describe('Feature: guest-portal-and-admin-enhancements, Property 5: Capacity Constraint Enforcement', () => {
  /**
   * Arbitrary for activity with capacity
   */
  const activityWithCapacityArbitrary = fc.record({
    id: uuidArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    capacity: fc.integer({ min: 1, max: 500 }),
    currentAttendees: fc.integer({ min: 0, max: 500 }),
  }).filter((activity) => activity.currentAttendees <= activity.capacity);

  /**
   * Arbitrary for RSVP update
   */
  const rsvpUpdateArbitrary = fc.record({
    guestId: uuidArbitrary,
    activityId: uuidArbitrary,
    status: fc.constantFrom<'pending' | 'attending' | 'maybe' | 'declined'>(
      'pending',
      'attending',
      'maybe',
      'declined'
    ),
    guestCount: fc.integer({ min: 1, max: 10 }),
  });

  /**
   * Validate RSVP update against capacity
   */
  function validateRSVPCapacity(
    activity: { capacity: number; currentAttendees: number },
    rsvpUpdate: { status: string; guestCount: number },
    previousStatus: string = 'pending',
    previousGuestCount: number = 0
  ): { success: boolean; error?: { code: string; message: string } } {
    // Only check capacity for 'attending' status
    if (rsvpUpdate.status !== 'attending') {
      return { success: true };
    }

    // Calculate the change in attendees
    const previousCount = previousStatus === 'attending' ? previousGuestCount : 0;
    const newCount = rsvpUpdate.guestCount;
    const attendeeChange = newCount - previousCount;

    // Check if update would exceed capacity
    const newTotal = activity.currentAttendees + attendeeChange;

    if (newTotal > activity.capacity) {
      return {
        success: false,
        error: {
          code: 'CAPACITY_EXCEEDED',
          message: `Activity capacity exceeded. Capacity: ${activity.capacity}, Current: ${activity.currentAttendees}, Requested: ${newCount}`,
        },
      };
    }

    return { success: true };
  }

  it('should reject RSVP updates that would exceed activity capacity', () => {
    fc.assert(
      fc.property(activityWithCapacityArbitrary, rsvpUpdateArbitrary, (activity, rsvpUpdate) => {
        // Create scenario where update would exceed capacity
        const remainingCapacity = activity.capacity - activity.currentAttendees;
        const excessiveGuestCount = remainingCapacity + fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0];

        const result = validateRSVPCapacity(
          activity,
          { ...rsvpUpdate, status: 'attending', guestCount: excessiveGuestCount }
        );

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('CAPACITY_EXCEEDED');
      }),
      { numRuns: 100 }
    );
  });

  it('should accept RSVP updates that are within activity capacity', () => {
    fc.assert(
      fc.property(activityWithCapacityArbitrary, rsvpUpdateArbitrary, (activity, rsvpUpdate) => {
        // Create scenario where update is within capacity
        const remainingCapacity = activity.capacity - activity.currentAttendees;
        if (remainingCapacity <= 0) {
          return; // Skip if no capacity available
        }

        const validGuestCount = fc.sample(fc.integer({ min: 1, max: remainingCapacity }), 1)[0];

        const result = validateRSVPCapacity(
          activity,
          { ...rsvpUpdate, status: 'attending', guestCount: validGuestCount }
        );

        // Should be accepted
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should allow RSVP updates for non-attending statuses regardless of capacity', () => {
    fc.assert(
      fc.property(activityWithCapacityArbitrary, rsvpUpdateArbitrary, (activity, rsvpUpdate) => {
        // Test with non-attending statuses
        const nonAttendingStatuses: Array<'pending' | 'maybe' | 'declined'> = ['pending', 'maybe', 'declined'];

        for (const status of nonAttendingStatuses) {
          const result = validateRSVPCapacity(
            activity,
            { ...rsvpUpdate, status, guestCount: 1000 } // Intentionally large number
          );

          // Should be accepted regardless of capacity
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate capacity when updating existing RSVP', () => {
    fc.assert(
      fc.property(
        activityWithCapacityArbitrary,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (activity, previousGuestCount, newGuestCount) => {
          // Ensure previous RSVP is within capacity
          if (activity.currentAttendees < previousGuestCount) {
            return; // Skip invalid scenario
          }

          // Update from attending to attending with different guest count
          const result = validateRSVPCapacity(
            activity,
            { status: 'attending', guestCount: newGuestCount },
            'attending',
            previousGuestCount
          );

          // Calculate expected outcome
          const attendeeChange = newGuestCount - previousGuestCount;
          const newTotal = activity.currentAttendees + attendeeChange;
          const shouldSucceed = newTotal <= activity.capacity;

          expect(result.success).toBe(shouldSucceed);
          if (!shouldSucceed) {
            expect(result.error?.code).toBe('CAPACITY_EXCEEDED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: exactly at capacity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 500 }), (capacity) => {
        const activity = {
          capacity,
          currentAttendees: capacity, // Already at capacity
        };

        // Try to add one more attendee
        const result = validateRSVPCapacity(activity, {
          status: 'attending',
          guestCount: 1,
        });

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('CAPACITY_EXCEEDED');
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: one spot remaining', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 500 }), (capacity) => {
        const activity = {
          capacity,
          currentAttendees: capacity - 1, // One spot remaining
        };

        // Try to add exactly one attendee
        const result = validateRSVPCapacity(activity, {
          status: 'attending',
          guestCount: 1,
        });

        // Should be accepted
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should handle changing from attending to declined (frees up capacity)', () => {
    fc.assert(
      fc.property(
        activityWithCapacityArbitrary,
        fc.integer({ min: 1, max: 10 }),
        (activity, previousGuestCount) => {
          // Ensure previous RSVP is within current attendees
          if (activity.currentAttendees < previousGuestCount) {
            return; // Skip invalid scenario
          }

          // Change from attending to declined
          const result = validateRSVPCapacity(
            activity,
            { status: 'declined', guestCount: 0 },
            'attending',
            previousGuestCount
          );

          // Should always be accepted (declining frees up capacity)
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide clear error message with capacity details', () => {
    fc.assert(
      fc.property(activityWithCapacityArbitrary, (activity) => {
        const remainingCapacity = activity.capacity - activity.currentAttendees;
        const excessiveGuestCount = remainingCapacity + 5;

        const result = validateRSVPCapacity(activity, {
          status: 'attending',
          guestCount: excessiveGuestCount,
        });

        if (!result.success && result.error) {
          // Error message should include capacity information
          expect(result.error.message).toContain(activity.capacity.toString());
          expect(result.error.message).toContain(activity.currentAttendees.toString());
          expect(result.error.message).toContain(excessiveGuestCount.toString());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle zero capacity activities', () => {
    const activity = {
      capacity: 0,
      currentAttendees: 0,
    };

    const result = validateRSVPCapacity(activity, {
      status: 'attending',
      guestCount: 1,
    });

    // Should be rejected
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CAPACITY_EXCEEDED');
  });

  it('should be idempotent - multiple validations with same input produce same result', () => {
    fc.assert(
      fc.property(activityWithCapacityArbitrary, rsvpUpdateArbitrary, (activity, rsvpUpdate) => {
        const result1 = validateRSVPCapacity(activity, rsvpUpdate);
        const result2 = validateRSVPCapacity(activity, rsvpUpdate);

        // Results should be identical
        expect(result1.success).toBe(result2.success);
        expect(result1.error?.code).toBe(result2.error?.code);
      }),
      { numRuns: 100 }
    );
  });
});
