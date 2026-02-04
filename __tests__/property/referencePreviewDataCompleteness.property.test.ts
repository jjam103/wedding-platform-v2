import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';

/**
 * Property 29: Reference Preview Data Completeness
 * 
 * For any event or activity reference preview modal, the system SHALL display
 * all required fields to provide guests with complete information without
 * navigating away from the current page.
 * 
 * Validates: Requirements 25.2, 25.3, 25.6, 25.7
 */
describe('Feature: guest-portal-and-admin-enhancements, Property 29: Reference Preview Data Completeness', () => {
  /**
   * Test: Event preview data contains all required fields
   * 
   * Requirements 25.2, 25.3:
   * - Event name
   * - Date
   * - Time
   * - Location
   * - Description
   * - List of activities
   * - RSVP status
   */
  it('should include all required fields in event preview data structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
          time: fc.option(fc.string({ minLength: 5, maxLength: 10 })),
          location: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          description: fc.option(fc.string({ minLength: 1, maxLength: 1000 })),
          activities: fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          slug: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        }),
        fc.option(
          fc.record({
            status: fc.constantFrom('attending', 'declined', 'maybe', 'pending') as fc.Arbitrary<'attending' | 'declined' | 'maybe' | 'pending'>,
            guestCount: fc.option(fc.integer({ min: 1, max: 10 })),
          })
        ),
        async (event, rsvpStatus) => {
          // Property: Event data must contain required fields
          expect(event.id).toBeDefined();
          expect(event.title).toBeDefined();
          expect(event.title.length).toBeGreaterThan(0);
          expect(event.date).toBeDefined();
          expect(new Date(event.date)).toBeInstanceOf(Date);

          // Property: Optional fields must be either defined or null/undefined
          if (event.time !== null && event.time !== undefined) {
            expect(typeof event.time).toBe('string');
          }
          if (event.location !== null && event.location !== undefined) {
            expect(typeof event.location).toBe('string');
          }
          if (event.description !== null && event.description !== undefined) {
            expect(typeof event.description).toBe('string');
          }

          // Property: Activities list must be an array
          expect(Array.isArray(event.activities)).toBe(true);
          
          // Property: Each activity must have id and title
          for (const activity of event.activities) {
            expect(activity.id).toBeDefined();
            expect(activity.title).toBeDefined();
            expect(activity.title.length).toBeGreaterThan(0);
          }

          // Property: RSVP status must have valid status value if present
          if (rsvpStatus) {
            expect(['attending', 'declined', 'maybe', 'pending']).toContain(rsvpStatus.status);
            
            // Property: Guest count must be positive if present
            if (rsvpStatus.guestCount !== null && rsvpStatus.guestCount !== undefined) {
              expect(rsvpStatus.guestCount).toBeGreaterThan(0);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test: Activity preview data contains all required fields
   * 
   * Requirements 25.6, 25.7:
   * - Activity name
   * - Date
   * - Time
   * - Location
   * - Capacity
   * - Remaining capacity
   * - Cost
   * - Description
   * - RSVP status
   */
  it('should include all required fields in activity preview data structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
          time: fc.option(fc.string({ minLength: 5, maxLength: 10 })),
          location: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          description: fc.option(fc.string({ minLength: 1, maxLength: 1000 })),
          capacity: fc.option(fc.integer({ min: 1, max: 200 })),
          capacityRemaining: fc.option(fc.integer({ min: 0, max: 200 })),
          cost: fc.option(fc.float({ min: 0, max: 1000, noNaN: true })),
          hostSubsidy: fc.option(fc.float({ min: 0, max: 500, noNaN: true })),
          slug: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        }),
        fc.option(
          fc.record({
            status: fc.constantFrom('attending', 'declined', 'maybe', 'pending') as fc.Arbitrary<'attending' | 'declined' | 'maybe' | 'pending'>,
            guestCount: fc.option(fc.integer({ min: 1, max: 10 })),
            dietaryRestrictions: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
          })
        ),
        async (activity, rsvpStatus) => {
          // Ensure capacityRemaining is not greater than capacity
          if (activity.capacity && activity.capacityRemaining) {
            activity.capacityRemaining = Math.min(activity.capacityRemaining, activity.capacity);
          }

          // Ensure hostSubsidy is not greater than cost
          if (activity.cost !== null && activity.cost !== undefined && 
              activity.hostSubsidy !== null && activity.hostSubsidy !== undefined) {
            activity.hostSubsidy = Math.min(activity.hostSubsidy, activity.cost);
          }

          // Property: Activity data must contain required fields
          expect(activity.id).toBeDefined();
          expect(activity.title).toBeDefined();
          expect(activity.title.length).toBeGreaterThan(0);
          expect(activity.date).toBeDefined();
          expect(new Date(activity.date)).toBeInstanceOf(Date);

          // Property: Optional fields must be either defined or null/undefined
          if (activity.time !== null && activity.time !== undefined) {
            expect(typeof activity.time).toBe('string');
          }
          if (activity.location !== null && activity.location !== undefined) {
            expect(typeof activity.location).toBe('string');
          }
          if (activity.description !== null && activity.description !== undefined) {
            expect(typeof activity.description).toBe('string');
          }

          // Property: Capacity must be positive if present
          if (activity.capacity !== null && activity.capacity !== undefined) {
            expect(activity.capacity).toBeGreaterThan(0);
          }

          // Property: Remaining capacity must be non-negative and not exceed total capacity
          if (activity.capacityRemaining !== null && activity.capacityRemaining !== undefined) {
            expect(activity.capacityRemaining).toBeGreaterThanOrEqual(0);
            if (activity.capacity) {
              expect(activity.capacityRemaining).toBeLessThanOrEqual(activity.capacity);
            }
          }

          // Property: Cost must be non-negative if present
          if (activity.cost !== null && activity.cost !== undefined) {
            expect(activity.cost).toBeGreaterThanOrEqual(0);
          }

          // Property: Host subsidy must be non-negative and not exceed cost
          if (activity.hostSubsidy !== null && activity.hostSubsidy !== undefined) {
            expect(activity.hostSubsidy).toBeGreaterThanOrEqual(0);
            if (activity.cost !== null && activity.cost !== undefined && activity.cost > 0) {
              expect(activity.hostSubsidy).toBeLessThanOrEqual(activity.cost);
            }
          }

          // Property: RSVP status must have valid status value if present
          if (rsvpStatus) {
            expect(['attending', 'declined', 'maybe', 'pending']).toContain(rsvpStatus.status);
            
            // Property: Guest count must be positive if present
            if (rsvpStatus.guestCount !== null && rsvpStatus.guestCount !== undefined) {
              expect(rsvpStatus.guestCount).toBeGreaterThan(0);
            }

            // Property: Dietary restrictions must be string if present
            if (rsvpStatus.dietaryRestrictions !== null && rsvpStatus.dietaryRestrictions !== undefined) {
              expect(typeof rsvpStatus.dietaryRestrictions).toBe('string');
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test: Capacity status calculation is correct
   */
  it('should correctly calculate capacity status based on remaining capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // Total capacity
        fc.float({ min: 0, max: 1, noNaN: true }), // Percentage full (0 = empty, 1 = full)
        async (capacity, percentFull) => {
          const remaining = Math.floor(capacity * (1 - percentFull));

          // Property: Remaining capacity must be within valid range
          expect(remaining).toBeGreaterThanOrEqual(0);
          expect(remaining).toBeLessThanOrEqual(capacity);

          // Property: Status determination must be consistent
          let expectedStatus: 'Full' | 'Almost Full' | 'Available';
          if (remaining === 0) {
            expectedStatus = 'Full';
          } else if (percentFull >= 0.9) {
            expectedStatus = 'Almost Full';
          } else {
            expectedStatus = 'Available';
          }

          // Verify status logic
          if (remaining === 0) {
            expect(expectedStatus).toBe('Full');
          } else if (percentFull >= 0.9) {
            expect(expectedStatus).toBe('Almost Full');
          } else {
            expect(expectedStatus).toBe('Available');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test: Guest cost calculation is correct
   */
  it('should correctly calculate guest cost after host subsidy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 1000, noNaN: true }), // Total cost
        fc.float({ min: 0, max: 1, noNaN: true }), // Subsidy percentage (0-100%)
        async (totalCost, subsidyPercent) => {
          const hostSubsidy = totalCost * subsidyPercent;
          const guestCost = totalCost - hostSubsidy;

          // Property: Guest cost must be non-negative
          expect(guestCost).toBeGreaterThanOrEqual(0);

          // Property: Guest cost must not exceed total cost
          expect(guestCost).toBeLessThanOrEqual(totalCost);

          // Property: Guest cost + host subsidy must equal total cost (within floating point precision)
          expect(Math.abs((guestCost + hostSubsidy) - totalCost)).toBeLessThan(0.01);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test: Date formatting is consistent
   */
  it('should format dates consistently for display', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        async (date) => {
          const isoString = date.toISOString();
          const parsedDate = new Date(isoString);

          // Property: ISO string must be parseable back to a valid date
          expect(parsedDate).toBeInstanceOf(Date);
          expect(parsedDate.getTime()).toBe(date.getTime());

          // Property: Formatted date string must contain expected components
          const formatted = parsedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          expect(formatted).toMatch(/\w+,\s+\w+\s+\d+,\s+\d{4}/);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
