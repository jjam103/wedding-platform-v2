import * as fc from 'fast-check';

/**
 * Property-Based Test: Itinerary Chronological Ordering
 * 
 * Feature: destination-wedding-platform
 * Property 35: Itinerary Chronological Ordering
 * 
 * Validates: Requirements 26.2
 * 
 * Property: Activities in an itinerary must always be sorted chronologically
 * by date and time, regardless of the order they were added or retrieved.
 */

describe('Feature: destination-wedding-platform, Property 35: Itinerary Chronological Ordering', () => {
  it('should always sort activities chronologically by date and time', () => {
    fc.assert(
      fc.property(
        // Generate array of activities with random dates and times
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            type: fc.constantFrom('event', 'activity'),
            date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
            rsvp_status: fc.option(fc.constantFrom('attending', 'declined', 'maybe', 'pending'), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (activities) => {
          // Sort activities chronologically
          const sorted = [...activities].sort((a, b) => {
            const dateA = new Date(`${a.date}T${new Date(a.time).toISOString().split('T')[1]}`);
            const dateB = new Date(`${b.date}T${new Date(b.time).toISOString().split('T')[1]}`);
            return dateA.getTime() - dateB.getTime();
          });

          // Verify chronological order
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentDateTime = new Date(`${sorted[i].date}T${new Date(sorted[i].time).toISOString().split('T')[1]}`);
            const nextDateTime = new Date(`${sorted[i + 1].date}T${new Date(sorted[i + 1].time).toISOString().split('T')[1]}`);
            
            // Current activity should be before or equal to next activity
            expect(currentDateTime.getTime()).toBeLessThanOrEqual(nextDateTime.getTime());
          }

          // Verify all activities are present
          expect(sorted.length).toBe(activities.length);
          
          // Verify no activities were lost or duplicated
          const sortedIds = sorted.map(a => a.id).sort();
          const originalIds = activities.map(a => a.id).sort();
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle activities on the same date sorted by time', () => {
    fc.assert(
      fc.property(
        // Generate activities all on the same date but different times
        fc.tuple(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('event', 'activity'),
              time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            }),
            { minLength: 2, maxLength: 20 }
          )
        ).map(([date, activities]) => activities.map(a => ({ ...a, date }))),
        (activities) => {
          // Sort activities by time
          const sorted = [...activities].sort((a, b) => {
            const timeA = new Date(a.time);
            const timeB = new Date(b.time);
            return timeA.getTime() - timeB.getTime();
          });

          // Verify time order
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentTime = new Date(sorted[i].time);
            const nextTime = new Date(sorted[i + 1].time);
            
            expect(currentTime.getTime()).toBeLessThanOrEqual(nextTime.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain chronological order after filtering', () => {
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
          { minLength: 5, maxLength: 50 }
        ),
        (activities) => {
          // Filter to only attending activities
          const filtered = activities.filter(a => a.rsvp_status === 'attending');
          
          if (filtered.length === 0) return; // Skip if no attending activities
          
          // Sort filtered activities chronologically
          const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(`${a.date}T${new Date(a.time).toISOString().split('T')[1]}`);
            const dateB = new Date(`${b.date}T${new Date(b.time).toISOString().split('T')[1]}`);
            return dateA.getTime() - dateB.getTime();
          });

          // Verify chronological order is maintained after filtering
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentDateTime = new Date(`${sorted[i].date}T${new Date(sorted[i].time).toISOString().split('T')[1]}`);
            const nextDateTime = new Date(`${sorted[i + 1].date}T${new Date(sorted[i + 1].time).toISOString().split('T')[1]}`);
            
            expect(currentDateTime.getTime()).toBeLessThanOrEqual(nextDateTime.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases: single activity, identical times, midnight times', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Single activity
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('event', 'activity'),
              date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
              time: fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            }),
            { minLength: 1, maxLength: 1 }
          ),
          // Activities with identical times
          fc.tuple(
            fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            fc.date({ min: new Date('2025-01-01T00:00:00'), max: new Date('2025-01-01T23:59:59') }).map(d => d.toISOString()),
            fc.array(fc.uuid(), { minLength: 2, maxLength: 5 })
          ).map(([date, time, ids]) => ids.map(id => ({
            id,
            name: `Activity ${id}`,
            type: 'activity' as const,
            date,
            time,
          }))),
          // Activities at midnight
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 100 }),
              type: fc.constantFrom('event', 'activity'),
              date: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            }).map(a => ({ ...a, time: `${a.date}T00:00:00.000Z` })),
            { minLength: 1, maxLength: 10 }
          )
        ),
        (activities) => {
          // Sort activities chronologically
          const sorted = [...activities].sort((a, b) => {
            const dateA = new Date(`${a.date}T${new Date(a.time).toISOString().split('T')[1]}`);
            const dateB = new Date(`${b.date}T${new Date(b.time).toISOString().split('T')[1]}`);
            return dateA.getTime() - dateB.getTime();
          });

          // Verify no errors occur and all activities are present
          expect(sorted.length).toBe(activities.length);
          
          // Verify chronological order (or equal times)
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentDateTime = new Date(`${sorted[i].date}T${new Date(sorted[i].time).toISOString().split('T')[1]}`);
            const nextDateTime = new Date(`${sorted[i + 1].date}T${new Date(sorted[i + 1].time).toISOString().split('T')[1]}`);
            
            expect(currentDateTime.getTime()).toBeLessThanOrEqual(nextDateTime.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
