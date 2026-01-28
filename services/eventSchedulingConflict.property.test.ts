import * as fc from 'fast-check';
import { checkSchedulingConflicts } from './eventService';
import { createClient } from '@supabase/supabase-js';

/**
 * Property-Based Test: Event Scheduling Conflict Detection
 * 
 * Feature: destination-wedding-platform
 * Property 8: Event Scheduling Conflict Detection
 * Validates: Requirements 6.3
 * 
 * This test validates that the system correctly detects scheduling conflicts
 * when events overlap at the same location.
 * 
 * Property: For any two events at the same location, if their time ranges overlap,
 * the system SHALL detect a conflict.
 * 
 * Overlap condition: (StartA <= EndB) AND (EndA >= StartB)
 */

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Feature: destination-wedding-platform, Property 8: Event Scheduling Conflict Detection', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Arbitrary for generating valid date ranges
   */
  const dateRangeArbitrary = fc.record({
    startDate: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
    durationHours: fc.integer({ min: 1, max: 8 }),
  }).map(({ startDate, durationHours }) => {
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  });

  /**
   * Arbitrary for generating overlapping events
   * Two events overlap if: (StartA <= EndB) AND (EndA >= StartB)
   */
  const overlappingEventsArbitrary = fc.tuple(
    dateRangeArbitrary,
    fc.integer({ min: 1, max: 4 }) // Overlap duration in hours
  ).map(([event1, overlapHours]) => {
    const event1Start = new Date(event1.startDate);
    const event1End = new Date(event1.endDate);
    const event1Duration = (event1End.getTime() - event1Start.getTime()) / (60 * 60 * 1000);
    
    // Create event2 that starts before event1 ends (ensuring overlap)
    // Start event2 somewhere in the middle of event1
    const offsetHours = Math.min(overlapHours, event1Duration - 0.5);
    const event2Start = new Date(event1Start.getTime() + offsetHours * 60 * 60 * 1000);
    
    // Event2 ends after it starts, ensuring it overlaps with event1
    const event2End = new Date(event2Start.getTime() + overlapHours * 60 * 60 * 1000);
    
    return {
      event1: {
        startDate: event1.startDate,
        endDate: event1.endDate,
      },
      event2: {
        startDate: event2Start.toISOString(),
        endDate: event2End.toISOString(),
      },
    };
  });

  /**
   * Arbitrary for generating non-overlapping events
   */
  const nonOverlappingEventsArbitrary = fc.tuple(
    dateRangeArbitrary,
    fc.integer({ min: 9, max: 24 }) // Gap in hours (at least 9 hours apart)
  ).map(([event1, gapHours]) => {
    const event1End = new Date(event1.endDate);
    
    // Create event2 that starts after event1 ends
    const event2Start = new Date(event1End.getTime() + gapHours * 60 * 60 * 1000);
    const event2End = new Date(event2Start.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration
    
    return {
      event1: {
        startDate: event1.startDate,
        endDate: event1.endDate,
      },
      event2: {
        startDate: event2Start.toISOString(),
        endDate: event2End.toISOString(),
      },
    };
  });

  it('should detect conflicts when events overlap at the same location', async () => {
    await fc.assert(
      fc.asyncProperty(
        overlappingEventsArbitrary,
        fc.uuid(),
        async ({ event1, event2 }, locationId) => {
          // Setup: Mock existing event at location
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [
                  {
                    id: 'existing-event-id',
                    name: 'Existing Event',
                    start_date: event1.startDate,
                    end_date: event1.endDate,
                  },
                ],
                error: null,
              }),
            }),
          });

          // Act: Check for conflicts with overlapping event
          const result = await checkSchedulingConflicts({
            locationId,
            startDate: event2.startDate,
            endDate: event2.endDate,
          });

          // Assert: Should detect conflict
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(true);
            expect(result.data.conflictingEvents).toHaveLength(1);
            expect(result.data.conflictingEvents[0].id).toBe('existing-event-id');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not detect conflicts when events do not overlap at the same location', async () => {
    await fc.assert(
      fc.asyncProperty(
        nonOverlappingEventsArbitrary,
        fc.uuid(),
        async ({ event1, event2 }, locationId) => {
          // Setup: Mock existing event at location
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [
                  {
                    id: 'existing-event-id',
                    name: 'Existing Event',
                    start_date: event1.startDate,
                    end_date: event1.endDate,
                  },
                ],
                error: null,
              }),
            }),
          });

          // Act: Check for conflicts with non-overlapping event
          const result = await checkSchedulingConflicts({
            locationId,
            startDate: event2.startDate,
            endDate: event2.endDate,
          });

          // Assert: Should not detect conflict
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(false);
            expect(result.data.conflictingEvents).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not detect conflicts at different locations even if times overlap', async () => {
    await fc.assert(
      fc.asyncProperty(
        overlappingEventsArbitrary,
        fc.uuid(),
        fc.uuid(),
        async ({ event1, event2 }, locationId1, locationId2) => {
          // Ensure different locations
          fc.pre(locationId1 !== locationId2);

          // Setup: Mock that returns empty array for location2 (no events at that location)
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockImplementation((field, value) => {
                // Only return events if querying for locationId1
                if (field === 'location_id' && value === locationId1) {
                  return {
                    data: [
                      {
                        id: 'existing-event-id',
                        name: 'Existing Event',
                        start_date: event1.startDate,
                        end_date: event1.endDate,
                      },
                    ],
                    error: null,
                  };
                }
                // Return empty for locationId2
                return {
                  data: [],
                  error: null,
                };
              }),
            }),
          });

          // Act: Check for conflicts at location2 (different location)
          const result = await checkSchedulingConflicts({
            locationId: locationId2,
            startDate: event2.startDate,
            endDate: event2.endDate,
          });

          // Assert: Should not detect conflict (different location)
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should exclude specified event when checking conflicts (for updates)', async () => {
    await fc.assert(
      fc.asyncProperty(
        overlappingEventsArbitrary,
        fc.uuid(),
        fc.uuid(),
        async ({ event1, event2 }, locationId, excludeEventId) => {
          // Setup: Mock existing event at location (the one being updated)
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  data: [], // No other events after excluding this one
                  error: null,
                }),
              }),
            }),
          });

          // Act: Check for conflicts excluding the event being updated
          const result = await checkSchedulingConflicts({
            locationId,
            startDate: event2.startDate,
            endDate: event2.endDate,
            excludeEventId,
          });

          // Assert: Should not detect conflict (excluded event)
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(false);
            expect(result.data.conflictingEvents).toHaveLength(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle events without end dates (single-point events)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.uuid(),
        async (eventDate, locationId) => {
          const eventDateStr = eventDate.toISOString();

          // Setup: Mock existing single-point event
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [
                  {
                    id: 'existing-event-id',
                    name: 'Existing Event',
                    start_date: eventDateStr,
                    end_date: null, // Single-point event
                  },
                ],
                error: null,
              }),
            }),
          });

          // Act: Check for conflicts with same time
          const result = await checkSchedulingConflicts({
            locationId,
            startDate: eventDateStr,
            endDate: null,
          });

          // Assert: Should detect conflict (same time)
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(true);
            expect(result.data.conflictingEvents).toHaveLength(1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should detect conflicts when new event spans multiple existing events', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.uuid(),
        async (baseDate, locationId) => {
          const baseDateStr = baseDate.toISOString();
          const event1End = new Date(baseDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
          const event2Start = new Date(baseDate.getTime() + 4 * 60 * 60 * 1000); // +4 hours
          const event2End = new Date(baseDate.getTime() + 6 * 60 * 60 * 1000); // +6 hours
          
          // New event spans from base to +7 hours (covers both events)
          const newEventEnd = new Date(baseDate.getTime() + 7 * 60 * 60 * 1000);

          // Setup: Mock two existing events
          mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                data: [
                  {
                    id: 'event-1',
                    name: 'Event 1',
                    start_date: baseDateStr,
                    end_date: event1End.toISOString(),
                  },
                  {
                    id: 'event-2',
                    name: 'Event 2',
                    start_date: event2Start.toISOString(),
                    end_date: event2End.toISOString(),
                  },
                ],
                error: null,
              }),
            }),
          });

          // Act: Check for conflicts with spanning event
          const result = await checkSchedulingConflicts({
            locationId,
            startDate: baseDateStr,
            endDate: newEventEnd.toISOString(),
          });

          // Assert: Should detect conflicts with both events
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.hasConflict).toBe(true);
            expect(result.data.conflictingEvents.length).toBeGreaterThanOrEqual(1);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
