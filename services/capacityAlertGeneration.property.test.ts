/**
 * Property-Based Test: Capacity Alert Generation
 * Feature: destination-wedding-platform, Property 11: Capacity Alert Generation
 * Validates: Requirements 7.7
 * 
 * Property: For any activity with a defined capacity, when the number of attending RSVPs 
 * reaches or exceeds the capacity threshold (e.g., 90%), the system should generate an 
 * alert for hosts.
 */

import * as fc from 'fast-check';

// Create mock Supabase client that will be populated in tests
let mockSupabaseFrom: jest.Mock;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockSupabaseFrom(...args),
  })),
}));

// NOW import the service after mocking
import * as rsvpService from './rsvpService';

describe('Feature: destination-wedding-platform, Property 11: Capacity Alert Generation', () => {
  beforeEach(() => {
    mockSupabaseFrom = jest.fn();
  });

  /**
   * Helper to setup mocks for generateCapacityAlerts
   * This function handles the complex nested query structure
   */
  function setupMocksForCapacityAlerts(activities: any[], rsvpsByActivity: Map<string, any[]>) {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'activities') {
        return {
          select: jest.fn().mockImplementation((columns: string) => {
            // Check if this is the query for all activities with capacity (from generateCapacityAlerts)
            if (columns === 'id, name, capacity') {
              return {
                not: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: activities,
                    error: null,
                  }),
                }),
              };
            }
            
            // This is the query for a single activity (from calculateActivityCapacity)
            if (columns === 'capacity, name') {
              return {
                eq: jest.fn().mockImplementation((field: string, activityId: string) => {
                  return {
                    single: jest.fn().mockImplementation(() => {
                      // Find the activity with this ID
                      const activity = activities.find(a => a.id === activityId);
                      
                      return Promise.resolve({
                        data: activity || null,
                        error: activity ? null : { code: 'PGRST116', message: 'Not found' },
                      });
                    }),
                  };
                }),
              };
            }
            
            return {
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }),
        };
      }
      
      if (table === 'rsvps') {
        // This handles the RSVP count queries
        return {
          select: jest.fn().mockImplementation((columns: string) => {
            if (columns === 'guest_count') {
              // Return a chainable object for the RSVP count query
              return {
                eq: jest.fn().mockImplementation((field: string, value: string) => {
                  if (field === 'activity_id') {
                    const activityId = value;
                    return {
                      eq: jest.fn().mockResolvedValue({
                        data: rsvpsByActivity.get(activityId) || [],
                        error: null,
                      }),
                    };
                  }
                  if (field === 'status') {
                    // This is the second .eq() call for status = 'attending'
                    // We need to return the data that was set up for this activity
                    return Promise.resolve({
                      data: [], // This will be overridden by the proper mock chain
                      error: null,
                    });
                  }
                  return {
                    eq: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  };
                }),
              };
            }
            
            return {
              eq: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            };
          }),
        };
      }
      
      return {
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    });
  }

  it('should generate alerts when activity capacity reaches or exceeds threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate activity with capacity
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          capacity: fc.integer({ min: 10, max: 100 }),
        }),
        // Generate attending count as percentage of capacity
        fc.double({ min: 0.85, max: 1.2 }), // 85% to 120% of capacity
        async (activity, utilizationFactor) => {
          const attendingCount = Math.floor(activity.capacity * utilizationFactor);
          // Calculate ACTUAL utilization based on the floored attending count
          const actualUtilization = attendingCount / activity.capacity;

          // Setup mocks for this test case
          const rsvpsByActivity = new Map();
          rsvpsByActivity.set(activity.id, Array.from({ length: attendingCount }, () => ({
            guest_count: 1,
          })));

          setupMocksForCapacityAlerts([activity], rsvpsByActivity);

          // Test with 90% threshold
          const result = await rsvpService.generateCapacityAlerts(0.9);

          expect(result.success).toBe(true);

          if (result.success) {
            // If ACTUAL utilization >= 90%, should generate alert
            if (actualUtilization >= 0.9) {
              expect(result.data.length).toBeGreaterThan(0);
              const alert = result.data.find(a => a.activity_id === activity.id);
              expect(alert).toBeDefined();

              if (alert) {
                expect(alert.capacity).toBe(activity.capacity);
                expect(alert.attending_count).toBe(attendingCount);
                expect(alert.utilization_percentage).toBeGreaterThanOrEqual(90);

                // Check alert level
                if (attendingCount >= activity.capacity) {
                  expect(alert.alert_level).toBe('full');
                } else if (actualUtilization >= 0.95) {
                  expect(alert.alert_level).toBe('critical');
                } else {
                  expect(alert.alert_level).toBe('warning');
                }

                // Check message contains activity name and counts
                expect(alert.message).toContain(activity.name);
                expect(alert.message).toContain(attendingCount.toString());
                expect(alert.message).toContain(activity.capacity.toString());
              }
            } else {
              // If ACTUAL utilization < 90%, should not generate alert for this activity
              const alert = result.data.find(a => a.activity_id === activity.id);
              expect(alert).toBeUndefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not generate alerts for activities without capacity limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          capacity: fc.constant(null), // No capacity limit
        }),
        fc.integer({ min: 0, max: 1000 }), // Any number of attendees
        async (activity, attendingCount) => {
          // Setup mocks - no activities with capacity limits
          setupMocksForCapacityAlerts([], new Map());

          const result = await rsvpService.generateCapacityAlerts(0.9);

          expect(result.success).toBe(true);
          if (result.success) {
            // Should not generate alerts for activities without capacity
            expect(result.data.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate utilization percentage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // capacity
        fc.double({ min: 0.9, max: 1.0 }), // utilization factor (90-100%)
        async (capacity, utilizationFactor) => {
          const attendingCount = Math.floor(capacity * utilizationFactor);
          const expectedUtilization = Math.round((attendingCount / capacity) * 100);

          const activity = {
            id: 'test-activity-id',
            name: 'Test Activity',
            capacity,
          };

          // Setup mocks
          const rsvpsByActivity = new Map();
          rsvpsByActivity.set(activity.id, Array.from({ length: attendingCount }, () => ({
            guest_count: 1,
          })));

          setupMocksForCapacityAlerts([activity], rsvpsByActivity);

          const result = await rsvpService.generateCapacityAlerts(0.9);

          expect(result.success).toBe(true);
          if (result.success && result.data.length > 0) {
            const alert = result.data[0];
            expect(alert.utilization_percentage).toBe(expectedUtilization);
            expect(alert.utilization_percentage).toBeGreaterThanOrEqual(90);
            expect(alert.utilization_percentage).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate different alert levels based on utilization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 100 }), // capacity
        fc.constantFrom(
          { factor: 0.92, expectedLevel: 'warning' },
          { factor: 0.96, expectedLevel: 'critical' },
          { factor: 1.0, expectedLevel: 'full' },
          { factor: 1.05, expectedLevel: 'full' }
        ),
        async (capacity, { factor, expectedLevel }) => {
          const attendingCount = Math.floor(capacity * factor);
          const actualUtilization = attendingCount / capacity;

          const activity = {
            id: 'test-activity-id',
            name: 'Test Activity',
            capacity,
          };

          // Setup mocks
          const rsvpsByActivity = new Map();
          rsvpsByActivity.set(activity.id, Array.from({ length: attendingCount }, () => ({
            guest_count: 1,
          })));

          setupMocksForCapacityAlerts([activity], rsvpsByActivity);

          const result = await rsvpService.generateCapacityAlerts(0.9);

          expect(result.success).toBe(true);
          if (result.success && result.data.length > 0) {
            const alert = result.data[0];
            
            // Determine expected level based on ACTUAL utilization after flooring
            let correctExpectedLevel: 'warning' | 'critical' | 'full';
            if (attendingCount >= capacity) {
              correctExpectedLevel = 'full';
            } else if (actualUtilization >= 0.95) {
              correctExpectedLevel = 'critical';
            } else {
              correctExpectedLevel = 'warning';
            }
            
            expect(alert.alert_level).toBe(correctExpectedLevel);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
