/**
 * Property-Based Test: Guest Count Validation
 * 
 * Feature: guest-portal-and-admin-enhancements
 * Property 7: Guest Count Validation
 * 
 * Description:
 * For any activity RSVP with guest count, the guest count SHALL be less than
 * or equal to the activity's maximum guests per party setting
 * 
 * Validates: Requirements 10.3
 * 
 * Test Strategy:
 * - Generate activities with various max guests per party settings
 * - Generate RSVP scenarios with different guest counts
 * - Verify rejection when guest count exceeds maximum
 * - Verify acceptance when guest count is within limit
 */

import * as fc from 'fast-check';
import { uuidArbitrary } from '../helpers/arbitraries';

describe('Feature: guest-portal-and-admin-enhancements, Property 7: Guest Count Validation', () => {
  /**
   * Arbitrary for activity with max guests per party setting
   */
  const activityWithMaxGuestsArbitrary = fc.record({
    id: uuidArbitrary,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    maxGuestsPerParty: fc.option(fc.integer({ min: 1, max: 20 }), { nil: null }),
    requiresGuestCount: fc.boolean(),
  });

  /**
   * Arbitrary for RSVP with guest count
   */
  const rsvpWithGuestCountArbitrary = fc.record({
    guestId: uuidArbitrary,
    activityId: uuidArbitrary,
    status: fc.constantFrom<'pending' | 'attending' | 'maybe' | 'declined'>(
      'pending',
      'attending',
      'maybe',
      'declined'
    ),
    guestCount: fc.integer({ min: 1, max: 50 }),
  });

  /**
   * Validate guest count against activity's max guests per party
   */
  function validateGuestCount(
    activity: { maxGuestsPerParty: number | null; requiresGuestCount: boolean },
    rsvp: { status: string; guestCount: number }
  ): { success: boolean; error?: { code: string; message: string } } {
    // Only validate for attending status
    if (rsvp.status !== 'attending') {
      return { success: true };
    }

    // Validate minimum guest count (must be at least 1)
    if (rsvp.guestCount < 1) {
      return {
        success: false,
        error: {
          code: 'INVALID_GUEST_COUNT',
          message: 'Guest count must be at least 1',
        },
      };
    }

    // If no max guests per party set, accept any positive count
    if (activity.maxGuestsPerParty === null) {
      return { success: true };
    }

    // Validate guest count against maximum
    if (rsvp.guestCount > activity.maxGuestsPerParty) {
      return {
        success: false,
        error: {
          code: 'GUEST_COUNT_EXCEEDED',
          message: `Guest count (${rsvp.guestCount}) exceeds maximum allowed per party (${activity.maxGuestsPerParty})`,
        },
      };
    }

    return { success: true };
  }

  it('should reject RSVP when guest count exceeds max guests per party', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, rsvpWithGuestCountArbitrary, (activity, rsvp) => {
        // Skip if no max guests per party set
        if (activity.maxGuestsPerParty === null) {
          return;
        }

        // Create scenario where guest count exceeds maximum
        const excessiveGuestCount = activity.maxGuestsPerParty + fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0];

        const result = validateGuestCount(activity, {
          ...rsvp,
          status: 'attending',
          guestCount: excessiveGuestCount,
        });

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBe('GUEST_COUNT_EXCEEDED');
      }),
      { numRuns: 100 }
    );
  });

  it('should accept RSVP when guest count is within max guests per party', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, rsvpWithGuestCountArbitrary, (activity, rsvp) => {
        // Skip if no max guests per party set
        if (activity.maxGuestsPerParty === null) {
          return;
        }

        // Create scenario where guest count is within maximum
        const validGuestCount = fc.sample(fc.integer({ min: 1, max: activity.maxGuestsPerParty }), 1)[0];

        const result = validateGuestCount(activity, {
          ...rsvp,
          status: 'attending',
          guestCount: validGuestCount,
        });

        // Should be accepted
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should accept any guest count when max guests per party is not set', () => {
    fc.assert(
      fc.property(rsvpWithGuestCountArbitrary, fc.integer({ min: 1, max: 100 }), (rsvp, largeGuestCount) => {
        const activity = {
          maxGuestsPerParty: null,
          requiresGuestCount: true,
        };

        const result = validateGuestCount(activity, {
          ...rsvp,
          status: 'attending',
          guestCount: largeGuestCount,
        });

        // Should be accepted regardless of count
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should not validate guest count for non-attending statuses', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, rsvpWithGuestCountArbitrary, (activity, rsvp) => {
        // Skip if no max guests per party set
        if (activity.maxGuestsPerParty === null) {
          return;
        }

        // Test with non-attending statuses and excessive guest count
        const nonAttendingStatuses: Array<'pending' | 'maybe' | 'declined'> = ['pending', 'maybe', 'declined'];
        const excessiveGuestCount = activity.maxGuestsPerParty + 10;

        for (const status of nonAttendingStatuses) {
          const result = validateGuestCount(activity, {
            ...rsvp,
            status,
            guestCount: excessiveGuestCount,
          });

          // Should be accepted regardless of guest count
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: guest count exactly at maximum', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (maxGuestsPerParty) => {
        const activity = {
          maxGuestsPerParty,
          requiresGuestCount: true,
        };

        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: maxGuestsPerParty,
        });

        // Should be accepted
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: guest count one over maximum', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (maxGuestsPerParty) => {
        const activity = {
          maxGuestsPerParty,
          requiresGuestCount: true,
        };

        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: maxGuestsPerParty + 1,
        });

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('GUEST_COUNT_EXCEEDED');
      }),
      { numRuns: 100 }
    );
  });

  it('should reject guest count of zero', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, (activity) => {
        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: 0,
        });

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_GUEST_COUNT');
      }),
      { numRuns: 100 }
    );
  });

  it('should reject negative guest count', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, fc.integer({ min: -100, max: -1 }), (activity, negativeCount) => {
        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: negativeCount,
        });

        // Should be rejected
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_GUEST_COUNT');
      }),
      { numRuns: 100 }
    );
  });

  it('should provide clear error message with guest count details', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 10 }), (maxGuestsPerParty, excess) => {
        const activity = {
          maxGuestsPerParty,
          requiresGuestCount: true,
        };

        const excessiveGuestCount = maxGuestsPerParty + excess;

        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: excessiveGuestCount,
        });

        if (!result.success && result.error) {
          // Error message should include both counts
          expect(result.error.message).toContain(excessiveGuestCount.toString());
          expect(result.error.message).toContain(maxGuestsPerParty.toString());
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle max guests per party of 1 (solo activities)', () => {
    const activity = {
      maxGuestsPerParty: 1,
      requiresGuestCount: true,
    };

    // Guest count of 1 should be accepted
    const result1 = validateGuestCount(activity, {
      status: 'attending',
      guestCount: 1,
    });
    expect(result1.success).toBe(true);

    // Guest count of 2 should be rejected
    const result2 = validateGuestCount(activity, {
      status: 'attending',
      guestCount: 2,
    });
    expect(result2.success).toBe(false);
    expect(result2.error?.code).toBe('GUEST_COUNT_EXCEEDED');
  });

  it('should handle large max guests per party values', () => {
    fc.assert(
      fc.property(fc.integer({ min: 50, max: 1000 }), (largeMaxGuests) => {
        const activity = {
          maxGuestsPerParty: largeMaxGuests,
          requiresGuestCount: true,
        };

        // Any count up to max should be accepted
        const validCount = fc.sample(fc.integer({ min: 1, max: largeMaxGuests }), 1)[0];
        const result = validateGuestCount(activity, {
          status: 'attending',
          guestCount: validCount,
        });

        expect(result.success).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should be idempotent - multiple validations with same input produce same result', () => {
    fc.assert(
      fc.property(activityWithMaxGuestsArbitrary, rsvpWithGuestCountArbitrary, (activity, rsvp) => {
        const result1 = validateGuestCount(activity, rsvp);
        const result2 = validateGuestCount(activity, rsvp);

        // Results should be identical
        expect(result1.success).toBe(result2.success);
        expect(result1.error?.code).toBe(result2.error?.code);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate guest count independently of capacity constraints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 100 }),
        (maxGuestsPerParty, activityCapacity) => {
          const activity = {
            maxGuestsPerParty,
            requiresGuestCount: true,
          };

          // Guest count validation should not consider activity capacity
          // It only checks against max guests per party
          const validGuestCount = maxGuestsPerParty;
          const result = validateGuestCount(activity, {
            status: 'attending',
            guestCount: validGuestCount,
          });

          // Should be accepted based on max guests per party alone
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
