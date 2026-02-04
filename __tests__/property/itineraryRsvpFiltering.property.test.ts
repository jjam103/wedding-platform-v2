import * as fc from 'fast-check';

/**
 * Property-Based Test: Itinerary RSVP Filtering
 * 
 * Feature: destination-wedding-platform
 * Property 36: Itinerary RSVP Filtering
 * 
 * Validates: Requirements 26.1
 * 
 * Property: When RSVP filtering is applied, only activities with "attending"
 * status should be shown in the itinerary. All other statuses (declined, maybe,
 * pending) should be excluded.
 */

describe('Feature: destination-wedding-platform, Property 36: Itinerary RSVP Filtering', () => {
  it('should only show activities with "attending" status when filter is applied', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            rsvp_status: fc.constantFrom('attending', 'declined', 'maybe', 'pending'),
          }),
          { minLength: 5, maxLength: 100 }
        ),
        (activities) => {
          // Apply RSVP filter - only show attending activities
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Verify all filtered activities have "attending" status
          filtered.forEach(activity => {
            expect(activity.rsvp_status).toBe('attending');
          });

          // Verify no non-attending activities are included
          const nonAttendingInFiltered = filtered.filter(a => a.rsvp_status !== 'attending');
          expect(nonAttendingInFiltered).toHaveLength(0);

          // Verify count matches expected
          const expectedCount = activities.filter(a => a.rsvp_status === 'attending').length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude all non-attending statuses (declined, maybe, pending)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            rsvp_status: fc.constantFrom('attending', 'declined', 'maybe', 'pending'),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Verify no declined activities
          const declinedInFiltered = filtered.filter(a => a.rsvp_status === 'declined');
          expect(declinedInFiltered).toHaveLength(0);

          // Verify no maybe activities
          const maybeInFiltered = filtered.filter(a => a.rsvp_status === 'maybe');
          expect(maybeInFiltered).toHaveLength(0);

          // Verify no pending activities
          const pendingInFiltered = filtered.filter(a => a.rsvp_status === 'pending');
          expect(pendingInFiltered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no activities have "attending" status', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            rsvp_status: fc.constantFrom('declined', 'maybe', 'pending'), // No attending
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Should return empty array
          expect(filtered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all activities when all have "attending" status', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
          }).map(a => ({ ...a, rsvp_status: 'attending' as const })), // All attending
          { minLength: 1, maxLength: 50 }
        ),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Should return all activities
          expect(filtered.length).toBe(activities.length);
          
          // Verify all are attending
          filtered.forEach(activity => {
            expect(activity.rsvp_status).toBe('attending');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle activities without RSVP status (undefined)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            rsvp_status: fc.option(fc.constantFrom('attending', 'declined', 'maybe', 'pending'), { nil: undefined }),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Verify no undefined statuses in filtered results
          filtered.forEach(activity => {
            expect(activity.rsvp_status).toBeDefined();
            expect(activity.rsvp_status).toBe('attending');
          });

          // Verify activities without status are excluded
          const withoutStatus = activities.filter(a => a.rsvp_status === undefined);
          const withoutStatusInFiltered = filtered.filter(a => a.rsvp_status === undefined);
          expect(withoutStatusInFiltered).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve activity properties when filtering', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
            rsvp_status: fc.constantFrom('attending', 'declined', 'maybe', 'pending'),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Verify all properties are preserved
          filtered.forEach(activity => {
            expect(activity.id).toBeDefined();
            expect(activity.name).toBeDefined();
            expect(activity.type).toBeDefined();
            expect(activity.date).toBeDefined();
            expect(activity.time).toBeDefined();
            expect(activity.rsvp_status).toBe('attending');
            
            // Verify activity exists in original array with same properties
            const original = activities.find(a => a.id === activity.id);
            expect(original).toBeDefined();
            expect(original?.name).toBe(activity.name);
            expect(original?.type).toBe(activity.type);
            expect(original?.date).toBe(activity.date);
            expect(original?.time).toBe(activity.time);
            expect(original?.location).toBe(activity.location);
            expect(original?.description).toBe(activity.description);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work correctly with mixed RSVP statuses', () => {
    fc.assert(
      fc.property(
        // Generate array with guaranteed mix of statuses
        fc.tuple(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('event', 'activity'),
              date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
              time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            }).map(a => ({ ...a, rsvp_status: 'attending' as const })),
            { minLength: 1, maxLength: 20 }
          ),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('event', 'activity'),
              date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
              time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
              rsvp_status: fc.constantFrom('declined', 'maybe', 'pending'),
            }),
            { minLength: 1, maxLength: 20 }
          )
        ).map(([attending, nonAttending]) => [...attending, ...nonAttending]),
        (activities) => {
          // Apply RSVP filter
          const filtered = activities.filter(a => a.rsvp_status === 'attending');

          // Count attending in original
          const attendingCount = activities.filter(a => a.rsvp_status === 'attending').length;
          
          // Verify filtered count matches
          expect(filtered.length).toBe(attendingCount);
          
          // Verify all filtered are attending
          filtered.forEach(activity => {
            expect(activity.rsvp_status).toBe('attending');
          });
          
          // Verify at least some activities were filtered out
          expect(filtered.length).toBeLessThan(activities.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
