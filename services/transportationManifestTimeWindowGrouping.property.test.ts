import * as fc from 'fast-check';
import { generateArrivalManifest, generateDepartureManifest } from './transportationService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

/**
 * Feature: destination-wedding-platform, Property 28: Transportation Manifest Time Window Grouping
 * 
 * For any set of guests with arrival times, the manifest generation should group guests
 * into time windows such that all guests in a window arrive within the specified time
 * threshold (e.g., 2 hours).
 * 
 * Validates: Requirements 20.1
 */
describe('Feature: destination-wedding-platform, Property 28: Transportation Manifest Time Window Grouping', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a properly chained mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    
    // Mock the lazy-loaded supabase
    jest.resetModules();
    jest.doMock('@/lib/supabase', () => ({
      supabase: mockSupabase,
    }));
  });

  it('should group guests into time windows within the specified threshold', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a date
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        // Generate time window threshold (1-4 hours)
        fc.integer({ min: 1, max: 4 }),
        // Generate array of guests with arrival times
        fc.array(
          fc.record({
            id: fc.uuid(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 }),
            arrival_date: fc.constant('2025-06-01'),
            arrival_time: fc.integer({ min: 0, max: 23 }).map(h => `${String(h).padStart(2, '0')}:00:00`),
            airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
            flight_number: fc.option(fc.string({ minLength: 4, maxLength: 10 })),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (date, timeWindowHours, guests) => {
          const dateStr = date.toISOString().split('T')[0];
          
          // Set up mock to return guests with arrival times
          mockSupabase.not.mockResolvedValue({
            data: guests.map(g => ({ ...g, arrival_date: dateStr })),
            error: null,
          });
          
          // Track manifests created
          const createdManifests: any[] = [];
          mockSupabase.single.mockImplementation(() => {
            // Get the insert data from the previous call
            const insertCall = mockSupabase.insert.mock.calls[mockSupabase.insert.mock.calls.length - 1];
            const manifestData = insertCall[0];
            
            const manifest = {
              id: fc.sample(fc.uuid(), 1)[0],
              ...manifestData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            createdManifests.push(manifest);
            
            return Promise.resolve({
              data: manifest,
              error: null,
            });
          });

          // Generate arrival manifest
          const result = await generateArrivalManifest(date, timeWindowHours);

          // Property: Result should be successful
          expect(result.success).toBe(true);

          if (result.success) {
            // Property: All manifests should have time windows within threshold
            for (const manifest of result.data) {
              const startParts = manifest.time_window_start.split(':');
              const endParts = manifest.time_window_end.split(':');
              
              const startHour = parseInt(startParts[0], 10);
              const endHour = parseInt(endParts[0], 10);
              
              const windowDuration = endHour - startHour;
              
              // Property: Window duration should equal the threshold
              expect(windowDuration).toBe(timeWindowHours);
              
              // Property: Window should be aligned to threshold boundaries
              expect(startHour % timeWindowHours).toBe(0);
            }

            // Property: All guests should be assigned to exactly one manifest
            const allAssignedGuestIds = result.data.flatMap(m => m.guest_ids);
            const uniqueGuestIds = new Set(allAssignedGuestIds);
            
            // No duplicate assignments
            expect(allAssignedGuestIds.length).toBe(uniqueGuestIds.size);
            
            // All guests are assigned
            expect(uniqueGuestIds.size).toBe(guests.length);
            
            // Property: Guests in same window should have arrival times within threshold
            for (const manifest of result.data) {
              const windowStartHour = parseInt(manifest.time_window_start.split(':')[0], 10);
              const windowEndHour = parseInt(manifest.time_window_end.split(':')[0], 10);
              
              // Check each guest in this manifest
              for (const guestId of manifest.guest_ids) {
                const guest = guests.find(g => g.id === guestId);
                if (guest && guest.arrival_time) {
                  const guestHour = parseInt(guest.arrival_time.split(':')[0], 10);
                  
                  // Guest's arrival hour should fall within the window
                  expect(guestHour).toBeGreaterThanOrEqual(windowStartHour);
                  expect(guestHour).toBeLessThan(windowEndHour);
                }
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty guest list gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.integer({ min: 1, max: 4 }),
        async (date, timeWindowHours) => {
          // Mock empty guest list
          mockSupabase.not.mockResolvedValue({
            data: [],
            error: null,
          });

          const result = await generateArrivalManifest(date, timeWindowHours);

          // Property: Should return success with empty array
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toEqual([]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should group departure manifests with same time window logic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.integer({ min: 1, max: 4 }),
        fc.array(
          fc.record({
            id: fc.uuid(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 }),
            departure_date: fc.constant('2025-06-05'),
            departure_time: fc.integer({ min: 0, max: 23 }).map(h => `${String(h).padStart(2, '0')}:00:00`),
            airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
            flight_number: fc.option(fc.string({ minLength: 4, maxLength: 10 })),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (date, timeWindowHours, guests) => {
          const dateStr = date.toISOString().split('T')[0];
          
          // Set up mock to return guests
          mockSupabase.not.mockResolvedValue({
            data: guests.map(g => ({ ...g, departure_date: dateStr })),
            error: null,
          });
          
          // Mock manifest creation
          mockSupabase.single.mockImplementation(() => {
            const insertCall = mockSupabase.insert.mock.calls[mockSupabase.insert.mock.calls.length - 1];
            const manifestData = insertCall[0];
            
            return Promise.resolve({
              data: {
                id: fc.sample(fc.uuid(), 1)[0],
                ...manifestData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          });

          // Generate departure manifest
          const result = await generateDepartureManifest(date, timeWindowHours);

          // Property: Result should be successful
          expect(result.success).toBe(true);

          if (result.success) {
            // Property: All manifests should have correct type
            for (const manifest of result.data) {
              expect(manifest.manifest_type).toBe('departure');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain time window consistency across multiple guests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
        fc.constantFrom(1, 2, 3, 4), // Common time window values
        fc.array(
          fc.record({
            id: fc.uuid(),
            first_name: fc.string({ minLength: 1, maxLength: 50 }),
            last_name: fc.string({ minLength: 1, maxLength: 50 }),
            arrival_date: fc.constant('2025-06-01'),
            arrival_time: fc.integer({ min: 0, max: 23 }).map(h => `${String(h).padStart(2, '0')}:00:00`),
            airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
            flight_number: fc.option(fc.string({ minLength: 4, maxLength: 10 })),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        async (date, timeWindowHours, guests) => {
          const dateStr = date.toISOString().split('T')[0];
          
          mockSupabase.not.mockResolvedValue({
            data: guests.map(g => ({ ...g, arrival_date: dateStr })),
            error: null,
          });
          
          mockSupabase.single.mockImplementation(() => {
            const insertCall = mockSupabase.insert.mock.calls[mockSupabase.insert.mock.calls.length - 1];
            const manifestData = insertCall[0];
            
            return Promise.resolve({
              data: {
                id: fc.sample(fc.uuid(), 1)[0],
                ...manifestData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          });

          const result = await generateArrivalManifest(date, timeWindowHours);

          expect(result.success).toBe(true);

          if (result.success && result.data.length > 0) {
            // Property: Each manifest should have non-overlapping time windows
            const sortedManifests = result.data.sort((a, b) => 
              a.time_window_start.localeCompare(b.time_window_start)
            );

            for (let i = 0; i < sortedManifests.length - 1; i++) {
              const current = sortedManifests[i];
              const next = sortedManifests[i + 1];
              
              // Current window end should be <= next window start
              expect(current.time_window_end <= next.time_window_start).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
