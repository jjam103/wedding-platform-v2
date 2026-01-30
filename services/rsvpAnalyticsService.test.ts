// Mock Supabase before importing the service
jest.mock('@supabase/supabase-js', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  };
  
  return {
    createClient: jest.fn(() => mockSupabase),
  };
});

import {
  calculateResponseRate,
  projectAttendance,
  summarizeDietaryRestrictions,
  getEventAnalytics,
  getActivityAnalytics,
} from './rsvpAnalyticsService';

describe('rsvpAnalyticsService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mock instance
    const { createClient } = require('@supabase/supabase-js');
    mockSupabase = createClient();
  });

  describe('calculateResponseRate', () => {
    it('should return success with response rate statistics when RSVPs exist', async () => {
      const mockRSVPs = [
        { id: '1', guest_id: 'guest-1', status: 'attending' },
        { id: '2', guest_id: 'guest-2', status: 'attending' },
        { id: '3', guest_id: 'guest-3', status: 'declined' },
        { id: '4', guest_id: 'guest-4', status: 'pending' },
      ];

      mockSupabase.eq.mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });

      const result = await calculateResponseRate('event-1', 'event');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total_invited).toBe(4);
        expect(result.data.total_responded).toBe(3); // attending + declined
        expect(result.data.total_pending).toBe(1);
        expect(result.data.response_rate).toBe(75); // 3/4 * 100
        expect(result.data.by_status.attending).toBe(2);
        expect(result.data.by_status.declined).toBe(1);
        expect(result.data.by_status.pending).toBe(1);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await calculateResponseRate('event-1', 'event');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('projectAttendance', () => {
    it('should return success with attendance projection when RSVPs exist', async () => {
      const mockRSVPs = [
        { status: 'attending', guest_count: 2 },
        { status: 'attending', guest_count: 1 },
        { status: 'maybe', guest_count: 2 },
        { status: 'declined', guest_count: 1 },
        { status: 'pending', guest_count: 1 },
      ];

      mockSupabase.eq.mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });

      const result = await projectAttendance('activity-1', 'activity');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmed_attending).toBe(3); // 2 + 1
        expect(result.data.maybe_attending).toBe(2);
        expect(result.data.projected_total).toBe(4); // 3 + (2 * 0.5)
        expect(result.data.declined_count).toBe(1);
        expect(result.data.pending_count).toBe(1);
      }
    });
  });

  describe('getEventAnalytics', () => {
    it('should return success with comprehensive analytics when event exists', async () => {
      // Mock data for the different queries that will be made
      const mockRSVPs = [
        { id: '1', guest_id: 'guest-1', status: 'attending', guest_count: 2 },
        { id: '2', guest_id: 'guest-2', status: 'attending', guest_count: 1 },
        { id: '3', guest_id: 'guest-3', status: 'declined', guest_count: 1 },
        { id: '4', guest_id: 'guest-4', status: 'pending', guest_count: 1 },
      ];

      const mockGuests = [
        { id: 'guest-1', guest_type: 'wedding_guest' },
        { id: 'guest-2', guest_type: 'wedding_guest' },
        { id: 'guest-3', guest_type: 'wedding_guest' },
        { id: 'guest-4', guest_type: 'wedding_guest' },
      ];

      const mockDietaryRSVPs = [
        { guest_id: 'guest-1', dietary_notes: 'Vegetarian' },
      ];

      const mockDietaryGuests = [
        { id: 'guest-1', first_name: 'John', last_name: 'Doe', dietary_restrictions: 'vegetarian' },
      ];

      // Reset the mock before setting up new behavior
      jest.clearAllMocks();

      // Create a more sophisticated mock that can handle the complex query chains
      let callIndex = 0;
      
      // Mock the from() method to track which table is being queried
      mockSupabase.from.mockImplementation((table: string) => {
        callIndex++;
        
        if (table === 'rsvps') {
          // For RSVP queries, we need to handle different query patterns
          const mockRsvpQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
          };
          
          // Set up the select method
          mockRsvpQuery.select.mockImplementation((fields: string) => {
            if (fields === 'id, guest_id, status') {
              // This is for calculateResponseRate - return simple query that resolves immediately
              return {
                eq: jest.fn().mockResolvedValue({ data: mockRSVPs, error: null })
              };
            } else if (fields === 'status, guest_count') {
              // This is for projectAttendance - return simple query that resolves immediately
              return {
                eq: jest.fn().mockResolvedValue({ data: mockRSVPs, error: null })
              };
            } else if (fields === 'guest_id, dietary_notes') {
              // This is for summarizeDietaryRestrictions - return chained query
              return {
                eq: jest.fn().mockImplementation((field: string, value: any) => {
                  if (field === 'event_id') {
                    return {
                      eq: jest.fn().mockImplementation((field2: string, value2: any) => {
                        if (field2 === 'status' && value2 === 'attending') {
                          return {
                            not: jest.fn().mockResolvedValue({ data: mockDietaryRSVPs, error: null })
                          };
                        }
                        return mockRsvpQuery;
                      })
                    };
                  }
                  return mockRsvpQuery;
                })
              };
            }
            return mockRsvpQuery;
          });
          
          return mockRsvpQuery;
        } else if (table === 'guests') {
          // For guest queries
          const mockGuestQuery = {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
          };
          
          mockGuestQuery.select.mockImplementation((fields: string) => {
            if (fields === 'id, guest_type') {
              // This is for guest type breakdown in calculateResponseRate
              return {
                in: jest.fn().mockResolvedValue({ data: mockGuests, error: null })
              };
            } else if (fields === 'id, first_name, last_name, dietary_restrictions') {
              // This is for dietary restrictions in summarizeDietaryRestrictions
              return {
                in: jest.fn().mockResolvedValue({ data: mockDietaryGuests, error: null })
              };
            }
            return mockGuestQuery;
          });
          
          return mockGuestQuery;
        }
        
        return mockSupabase;
      });

      const result = await getEventAnalytics('event-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.response_rates).toBeDefined();
        expect(result.data.attendance_projection).toBeDefined();
        expect(result.data.dietary_summary).toBeDefined();
        // Verify the structure of the returned data
        expect(result.data.response_rates.total_invited).toBe(4);
        expect(result.data.attendance_projection.confirmed_attending).toBe(3);
        expect(result.data.dietary_summary.total_with_restrictions).toBe(1);
        expect(result.data.dietary_summary.notes).toHaveLength(1);
        expect(result.data.dietary_summary.notes[0].guest_name).toBe('John Doe');
        expect(result.data.dietary_summary.restrictions.vegetarian).toBe(1);
      }
    });
  });
});