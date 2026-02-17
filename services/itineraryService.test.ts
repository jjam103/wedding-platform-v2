import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  generateItinerary,
  cacheItinerary,
  getCachedItinerary,
  invalidateCache,
} from './itineraryService';
import { createMockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock the supabase lib at the module level
const mockSupabase = createMockSupabaseClient();
jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock localStorage for browser environment
const mockLocalStorage = {
  getItem: (jest.fn() as any),
  setItem: (jest.fn() as any),
  removeItem: (jest.fn() as any),
};

// Mock window and localStorage
Object.defineProperty(global, 'window', {
  value: {
    localStorage: mockLocalStorage,
  },
  writable: true,
});

describe('itineraryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
  });

  describe('generateItinerary', () => {
    it('should return success with guest itinerary when guest exists', async () => {
      const mockGuest = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        guest_type: 'wedding_guest',
        airport_code: 'SJO',
        flight_number: 'AA123',
        arrival_date: '2025-06-14',
        departure_date: '2025-06-17',
      };

      const mockEvents = [
        {
          id: 'event-1',
          name: 'Wedding Ceremony',
          event_type: 'ceremony',
          start_date: '2025-06-15T14:00:00Z',
          end_date: '2025-06-15T15:00:00Z',
          location_id: 'location-1',
          description: 'Beach ceremony',
        },
      ];

      const mockActivities = [
        {
          id: 'activity-1',
          name: 'Beach Volleyball',
          activity_type: 'sport',
          start_time: '2025-06-16T10:00:00Z',
          end_time: '2025-06-16T12:00:00Z',
          location_id: 'location-2',
          description: 'Fun beach activity',
        },
      ];

      const mockRsvps = [
        { event_id: 'event-1', activity_id: null, status: 'attending' },
        { event_id: null, activity_id: 'activity-1', status: 'maybe' },
      ];

      const mockRoomAssignment = {
        check_in: '2025-06-14',
        check_out: '2025-06-17',
        room_types: {
          name: 'Ocean View Suite',
          accommodations: {
            name: 'Beach Resort',
            address: '123 Beach Road',
          },
        },
      };

      // Set up mock responses for different table queries
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                single: (jest.fn() as any).mockResolvedValue({
                  data: mockGuest,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                or: (jest.fn() as any).mockReturnValue({
                  order: (jest.fn() as any).mockResolvedValue({
                    data: mockEvents,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'activities') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                or: (jest.fn() as any).mockReturnValue({
                  order: (jest.fn() as any).mockResolvedValue({
                    data: mockActivities,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'rsvps') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockResolvedValue({
                data: mockRsvps,
                error: null,
              }),
            }),
          };
        }
        if (table === 'room_assignments') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                maybeSingle: (jest.fn() as any).mockResolvedValue({
                  data: mockRoomAssignment,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await generateItinerary('guest-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guest_name).toBe('John Doe');
        expect(result.data.events).toHaveLength(2); // 1 event + 1 activity
        expect(result.data.events[0].name).toBe('Wedding Ceremony');
        expect(result.data.events[0].rsvp_status).toBe('attending');
        expect(result.data.events[1].name).toBe('Beach Volleyball');
        expect(result.data.events[1].rsvp_status).toBe('maybe');
        expect(result.data.accommodation?.accommodation_name).toBe('Beach Resort');
        expect(result.data.transportation?.airport_code).toBe('SJO');
      }
    });

    it('should return GUEST_NOT_FOUND when guest does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await generateItinerary('nonexistent-guest');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('GUEST_NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when events query fails', async () => {
      const mockGuest = {
        id: 'guest-1',
        first_name: 'John',
        last_name: 'Doe',
        guest_type: 'wedding_guest',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'guests') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                single: (jest.fn() as any).mockResolvedValue({
                  data: mockGuest,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: (jest.fn() as any).mockReturnValue({
              eq: (jest.fn() as any).mockReturnValue({
                or: (jest.fn() as any).mockReturnValue({
                  order: (jest.fn() as any).mockResolvedValue({
                    data: null,
                    error: { message: 'Connection failed' },
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await generateItinerary('guest-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('cacheItinerary', () => {
    it('should return success when itinerary is cached successfully', async () => {
      const mockItinerary = {
        guest_id: 'guest-1',
        guest_name: 'John Doe',
        events: [],
        generated_at: '2025-01-01T00:00:00Z',
      };

      const result = await cacheItinerary('guest-1', mockItinerary);

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'itinerary-guest-1',
        JSON.stringify(mockItinerary)
      );
    });

    it('should return STORAGE_UNAVAILABLE when localStorage is not available', async () => {
      // Mock window.localStorage as undefined
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      const mockItinerary = {
        guest_id: 'guest-1',
        guest_name: 'John Doe',
        events: [],
        generated_at: '2025-01-01T00:00:00Z',
      };

      const result = await cacheItinerary('guest-1', mockItinerary);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_UNAVAILABLE');
      }

      // Restore window
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: mockLocalStorage,
        },
        writable: true,
      });
    });
  });

  describe('getCachedItinerary', () => {
    it('should return success with cached itinerary when it exists', async () => {
      const mockItinerary = {
        guest_id: 'guest-1',
        guest_name: 'John Doe',
        events: [],
        generated_at: '2025-01-01T00:00:00Z',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockItinerary));

      const result = await getCachedItinerary('guest-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockItinerary);
      }
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('itinerary-guest-1');
    });

    it('should return success with null when no cached itinerary exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await getCachedItinerary('guest-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return STORAGE_UNAVAILABLE when localStorage is not available', async () => {
      // Mock window as undefined
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      const result = await getCachedItinerary('guest-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_UNAVAILABLE');
      }

      // Restore window
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: mockLocalStorage,
        },
        writable: true,
      });
    });
  });

  describe('invalidateCache', () => {
    it('should return success when cache is invalidated successfully', async () => {
      const result = await invalidateCache('guest-1');

      expect(result.success).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('itinerary-guest-1');
    });

    it('should return STORAGE_UNAVAILABLE when localStorage is not available', async () => {
      // Mock window as undefined
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      const result = await invalidateCache('guest-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORAGE_UNAVAILABLE');
      }

      // Restore window
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: mockLocalStorage,
        },
        writable: true,
      });
    });
  });
});