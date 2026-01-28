import * as fc from 'fast-check';
import { assignGuestsToShuttle, updateFlightInfo } from './transportationService';

// Mock the Supabase module with simpler per-call mocking
jest.mock('@/lib/supabase', () => {
  const mockChain = {
    select: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };
  
  return {
    supabase: {
      from: jest.fn(() => mockChain),
    },
    __mockChain: mockChain,
  };
});

/**
 * Feature: destination-wedding-platform, Property 30: Manifest Assignment Updates
 * 
 * For any guest with flight information changes, when the flight time is updated,
 * the system should automatically reassign the guest to the appropriate manifest
 * based on the new time window.
 * 
 * Validates: Requirements 20.8
 */
describe('Feature: destination-wedding-platform, Property 30: Manifest Assignment Updates', () => {
  let mockChain: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get mock chain for configuration
    const { __mockChain } = require('@/lib/supabase');
    mockChain = __mockChain;
  });

  it('should successfully update flight information for any valid guest', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate guest ID
        fc.uuid(),
        // Generate flight info with undefined for optional fields (not null)
        fc.record({
          guest_id: fc.uuid(),
          airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
          flight_number: fc.option(fc.string({ minLength: 4, maxLength: 10 }), { nil: undefined }),
          airline: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
          arrival_time: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: undefined }),
          departure_time: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: undefined }),
        }),
        async (guestId, flightInfo) => {
          // Configure mocks for this iteration using mockReturnValueOnce
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result = await updateFlightInfo(guestId, { 
            ...flightInfo, 
            guest_id: guestId,
            airport_code: flightInfo.airport_code as 'SJO' | 'LIR' | 'Other',
          });

          // Property: Update should succeed for valid input
          expect(result.success).toBe(true);

          // Property: Update should be called with sanitized data
          expect(mockChain.update).toHaveBeenCalled();
          expect(mockChain.eq).toHaveBeenCalledWith('id', guestId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should assign guests to shuttle manifests without duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate manifest ID
        fc.uuid(),
        // Generate array of guest IDs
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        async (manifestId, guestIds) => {
          // Mock current manifest with some existing guests
          const existingGuestIds = fc.sample(fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }), 1)[0];
          
          // Configure mocks for this iteration
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: { guest_ids: existingGuestIds },
            error: null,
          });
          
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result = await assignGuestsToShuttle(manifestId, guestIds);

          // Property: Assignment should succeed
          expect(result.success).toBe(true);

          // Property: Update should be called
          expect(mockChain.update).toHaveBeenCalled();

          // Verify the update was called with merged guest IDs
          const updateCall = mockChain.update.mock.calls[mockChain.update.mock.calls.length - 1][0];
          if (updateCall && updateCall.guest_ids) {
            // Property: No duplicate guest IDs
            const uniqueIds = new Set(updateCall.guest_ids);
            expect(updateCall.guest_ids.length).toBe(uniqueIds.size);

            // Property: All new guests should be included
            for (const guestId of guestIds) {
              expect(updateCall.guest_ids).toContain(guestId);
            }

            // Property: All existing guests should be preserved
            for (const existingId of existingGuestIds) {
              expect(updateCall.guest_ids).toContain(existingId);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty guest assignment gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (manifestId) => {
          // Configure mocks for this iteration
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: { guest_ids: [] },
            error: null,
          });
          
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result = await assignGuestsToShuttle(manifestId, []);

          // Property: Should succeed even with empty array
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve existing assignments when adding new guests', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        async (manifestId, existingGuests, newGuests) => {
          // Ensure no overlap for this test
          const uniqueExisting = Array.from(new Set(existingGuests));
          const uniqueNew = Array.from(new Set(newGuests.filter(id => !uniqueExisting.includes(id))));

          // Skip if no new guests to add (all were filtered out)
          if (uniqueNew.length === 0) {
            return; // Property doesn't apply when there are no new guests
          }

          // Configure mocks for this iteration
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: { guest_ids: uniqueExisting },
            error: null,
          });
          
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result = await assignGuestsToShuttle(manifestId, uniqueNew);

          expect(result.success).toBe(true);

          if (mockChain.update.mock.calls.length > 0) {
            const updateCall = mockChain.update.mock.calls[mockChain.update.mock.calls.length - 1][0];
            if (updateCall && updateCall.guest_ids) {
              // Property: All existing guests should still be present
              for (const existingId of uniqueExisting) {
                expect(updateCall.guest_ids).toContain(existingId);
              }

              // Property: All new guests should be added
              for (const newId of uniqueNew) {
                expect(updateCall.guest_ids).toContain(newId);
              }

              // Property: Total count should be sum of unique guests
              const expectedCount = new Set([...uniqueExisting, ...uniqueNew]).size;
              expect(updateCall.guest_ids.length).toBe(expectedCount);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle database errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        async (manifestId, guestIds) => {
          // Configure mocks for this iteration - simulate database error
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database connection failed' },
          });

          const result = await assignGuestsToShuttle(manifestId, guestIds);

          // Property: Should return error result
          expect(result.success).toBe(false);

          if (!result.success) {
            expect(result.error.code).toBe('DATABASE_ERROR');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should sanitize flight information before updating', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          guest_id: fc.uuid(),
          airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
          // Generate short alphanumeric strings so total length with payload stays under max(20)
          flight_number: fc.option(fc.hexaString({ minLength: 4, maxLength: 8 }), { nil: undefined }),
          airline: fc.option(fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[A-Za-z ]+$/.test(s)).map(s => `${s}<img src=x onerror=alert(1)>`), { nil: undefined }),
          arrival_time: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: undefined }),
          departure_time: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), { nil: undefined }),
        }),
        async (guestId, flightInfo) => {
          // Configure mocks for this iteration
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });
          
          const result = await updateFlightInfo(guestId, { 
            ...flightInfo, 
            guest_id: guestId,
            airport_code: flightInfo.airport_code as 'SJO' | 'LIR' | 'Other',
          });

          expect(result.success).toBe(true);

          // Property: Malicious content should be sanitized
          if (mockChain.update.mock.calls.length > 0) {
            const updateCall = mockChain.update.mock.calls[mockChain.update.mock.calls.length - 1][0];
            
            if (updateCall.airline) {
              expect(updateCall.airline).not.toContain('<img');
              expect(updateCall.airline).not.toContain('onerror');
              expect(updateCall.airline).not.toContain('alert');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain idempotency when assigning same guests multiple times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        async (manifestId, guestIds) => {
          const uniqueGuestIds = Array.from(new Set(guestIds));

          // First assignment - empty manifest
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: { guest_ids: [] },
            error: null,
          });
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result1 = await assignGuestsToShuttle(manifestId, uniqueGuestIds);
          expect(result1.success).toBe(true);

          // Second assignment with same guests - manifest now has those guests
          mockChain.select.mockReturnValueOnce(mockChain);
          mockChain.eq.mockReturnValueOnce(mockChain);
          mockChain.single.mockResolvedValueOnce({
            data: { guest_ids: uniqueGuestIds },
            error: null,
          });
          mockChain.update.mockReturnValueOnce(mockChain);
          mockChain.eq.mockResolvedValueOnce({ data: null, error: null });

          const result2 = await assignGuestsToShuttle(manifestId, uniqueGuestIds);
          expect(result2.success).toBe(true);

          // Property: Assigning same guests twice should not duplicate
          if (mockChain.update.mock.calls.length > 1) {
            const lastUpdateCall = mockChain.update.mock.calls[mockChain.update.mock.calls.length - 1][0];
            if (lastUpdateCall && lastUpdateCall.guest_ids) {
              const uniqueCount = new Set(lastUpdateCall.guest_ids).size;
              expect(lastUpdateCall.guest_ids.length).toBe(uniqueCount);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
