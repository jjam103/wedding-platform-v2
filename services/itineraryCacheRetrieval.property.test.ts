import * as fc from 'fast-check';
import { cacheItinerary, getCachedItinerary } from './itineraryService';

/**
 * Property 31: Itinerary Cache Retrieval
 * 
 * For any guest's personalized itinerary, after caching via the PWA service worker,
 * the itinerary data should be retrievable from the cache even when offline,
 * and should match the originally cached data.
 * 
 * Validates: Requirements 18.3, 18.4
 * Feature: destination-wedding-platform, Property 31: Itinerary Cache Retrieval
 */

// Mock localStorage for testing
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Setup mock localStorage
let mockLocalStorage: MockLocalStorage;

beforeEach(() => {
  mockLocalStorage = new MockLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
});

afterEach(() => {
  mockLocalStorage.clear();
});

// Arbitraries for property-based testing
const guestIdArbitrary = fc.uuid();

const itineraryEventArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('event' as const, 'activity' as const),
  date: fc.date().map((d) => d.toISOString()),
  time: fc.date().map((d) => d.toISOString()),
  location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  rsvp_status: fc.option(fc.constantFrom('attending', 'declined', 'maybe', 'pending'), {
    nil: undefined,
  }),
});

const accommodationDetailsArbitrary = fc.record({
  accommodation_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  room_type: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  check_in: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
  check_out: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
  address: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

const transportationDetailsArbitrary = fc.record({
  airport_code: fc.option(fc.constantFrom('SJO', 'LIR', 'Other'), { nil: undefined }),
  flight_number: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  arrival_date: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
  departure_date: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
});

const itineraryArbitrary = fc.record({
  guest_id: fc.uuid(),
  guest_name: fc.string({ minLength: 1, maxLength: 100 }),
  events: fc.array(itineraryEventArbitrary, { minLength: 0, maxLength: 10 }),
  accommodation: fc.option(accommodationDetailsArbitrary, { nil: undefined }),
  transportation: fc.option(transportationDetailsArbitrary, { nil: undefined }),
  generated_at: fc.date().map((d) => d.toISOString()),
});

describe('Feature: destination-wedding-platform, Property 31: Itinerary Cache Retrieval', () => {
  it('should retrieve cached itinerary that matches the originally cached data', async () => {
    await fc.assert(
      fc.asyncProperty(guestIdArbitrary, itineraryArbitrary, async (guestId, itinerary) => {
        // Arrange: Set guest_id to match
        const testItinerary = { ...itinerary, guest_id: guestId };

        // Act: Cache the itinerary
        const cacheResult = await cacheItinerary(guestId, testItinerary);

        // Assert: Caching should succeed
        expect(cacheResult.success).toBe(true);

        // Act: Retrieve the cached itinerary
        const retrieveResult = await getCachedItinerary(guestId);

        // Assert: Retrieval should succeed and match original data
        expect(retrieveResult.success).toBe(true);
        
        if (retrieveResult.success) {
          expect(retrieveResult.data).not.toBeNull();

          if (retrieveResult.data) {
            expect(retrieveResult.data.guest_id).toBe(testItinerary.guest_id);
            expect(retrieveResult.data.guest_name).toBe(testItinerary.guest_name);
            expect(retrieveResult.data.events).toHaveLength(testItinerary.events.length);
            expect(retrieveResult.data.generated_at).toBe(testItinerary.generated_at);

            // Verify events match
            testItinerary.events.forEach((event, index) => {
              expect(retrieveResult.data!.events[index].id).toBe(event.id);
              expect(retrieveResult.data!.events[index].name).toBe(event.name);
              expect(retrieveResult.data!.events[index].type).toBe(event.type);
            });
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return null for non-existent cached itinerary', async () => {
    await fc.assert(
      fc.asyncProperty(guestIdArbitrary, async (guestId) => {
        // Act: Try to retrieve itinerary that was never cached
        const result = await getCachedItinerary(guestId);

        // Assert: Should succeed but return null
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all itinerary fields through cache round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(itineraryArbitrary, async (itinerary) => {
        // Act: Cache and retrieve
        const cacheResult = await cacheItinerary(itinerary.guest_id, itinerary);
        expect(cacheResult.success).toBe(true);

        const retrieveResult = await getCachedItinerary(itinerary.guest_id);

        // Assert: All fields should be preserved
        expect(retrieveResult.success).toBe(true);
        
        if (retrieveResult.success) {
          expect(retrieveResult.data).not.toBeNull();

          if (retrieveResult.data) {
            const cached = retrieveResult.data;

            // Verify all top-level fields
            expect(cached.guest_id).toBe(itinerary.guest_id);
            expect(cached.guest_name).toBe(itinerary.guest_name);
            expect(cached.generated_at).toBe(itinerary.generated_at);

            // Verify accommodation details if present
            if (itinerary.accommodation) {
              expect(cached.accommodation).toBeDefined();
              expect(cached.accommodation?.accommodation_name).toBe(
                itinerary.accommodation.accommodation_name
              );
              expect(cached.accommodation?.room_type).toBe(itinerary.accommodation.room_type);
            }

            // Verify transportation details if present
            if (itinerary.transportation) {
              expect(cached.transportation).toBeDefined();
              expect(cached.transportation?.airport_code).toBe(
                itinerary.transportation.airport_code
              );
              expect(cached.transportation?.flight_number).toBe(
                itinerary.transportation.flight_number
              );
            }

            // Verify all events
            expect(cached.events).toHaveLength(itinerary.events.length);
            itinerary.events.forEach((event, index) => {
              expect(cached.events[index].id).toBe(event.id);
              expect(cached.events[index].name).toBe(event.name);
              expect(cached.events[index].type).toBe(event.type);
              expect(cached.events[index].date).toBe(event.date);
              expect(cached.events[index].time).toBe(event.time);
              expect(cached.events[index].location).toBe(event.location);
              expect(cached.events[index].description).toBe(event.description);
              expect(cached.events[index].rsvp_status).toBe(event.rsvp_status);
            });
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle multiple guests with separate cached itineraries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            guestId: fc.uuid(),
            itinerary: itineraryArbitrary,
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (guestItineraries) => {
          // Ensure unique guest IDs
          const uniqueGuests = Array.from(
            new Map(guestItineraries.map((g) => [g.guestId, g])).values()
          );

          // Act: Cache all itineraries
          for (const { guestId, itinerary } of uniqueGuests) {
            const testItinerary = { ...itinerary, guest_id: guestId };
            const result = await cacheItinerary(guestId, testItinerary);
            expect(result.success).toBe(true);
          }

          // Assert: Each guest should retrieve their own itinerary
          for (const { guestId, itinerary } of uniqueGuests) {
            const result = await getCachedItinerary(guestId);
            expect(result.success).toBe(true);
            
            if (result.success) {
              expect(result.data).not.toBeNull();

              if (result.data) {
                expect(result.data.guest_id).toBe(guestId);
                expect(result.data.guest_name).toBe(itinerary.guest_name);
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle cache updates by overwriting previous data', async () => {
    await fc.assert(
      fc.asyncProperty(
        guestIdArbitrary,
        itineraryArbitrary,
        itineraryArbitrary,
        async (guestId, itinerary1, itinerary2) => {
          // Arrange: Create two different itineraries for same guest
          const firstItinerary = { ...itinerary1, guest_id: guestId };
          const secondItinerary = { ...itinerary2, guest_id: guestId };

          // Act: Cache first itinerary
          const cache1Result = await cacheItinerary(guestId, firstItinerary);
          expect(cache1Result.success).toBe(true);

          // Act: Cache second itinerary (should overwrite)
          const cache2Result = await cacheItinerary(guestId, secondItinerary);
          expect(cache2Result.success).toBe(true);

          // Act: Retrieve cached itinerary
          const retrieveResult = await getCachedItinerary(guestId);

          // Assert: Should retrieve the second (most recent) itinerary
          expect(retrieveResult.success).toBe(true);
          
          if (retrieveResult.success) {
            expect(retrieveResult.data).not.toBeNull();

            if (retrieveResult.data) {
              expect(retrieveResult.data.guest_name).toBe(secondItinerary.guest_name);
              expect(retrieveResult.data.generated_at).toBe(secondItinerary.generated_at);
              expect(retrieveResult.data.events).toHaveLength(secondItinerary.events.length);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
