import { createMockSupabaseClient } from '../helpers/mockSupabase';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { GET } from '@/app/api/admin/guests/[id]/rsvps/route';
import { PUT } from '@/app/api/admin/guests/[id]/rsvps/[rsvpId]/route';

describe('Inline RSVP API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/admin/guests/[id]/rsvps', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/guests/guest-123/rsvps');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'guest-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when guest ID is missing', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/guests//rsvps');
      const response = await GET(request, {
        params: Promise.resolve({ id: '' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return guest RSVPs with capacity information', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock activity RSVPs
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'rsvp-1',
              status: 'attending',
              guest_count: 2,
              dietary_restrictions: 'Vegetarian',
              activities: {
                id: 'activity-1',
                title: 'Beach Volleyball',
                date: '2024-06-15',
                time: '14:00',
                location: 'Beach',
                capacity: 20,
                requires_guest_count: true,
                requires_dietary_info: false,
              },
            },
          ],
          error: null,
        }),
      });

      // Mock event RSVPs
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'rsvp-2',
              status: 'attending',
              events: {
                id: 'event-1',
                title: 'Wedding Ceremony',
                date: '2024-06-16',
                time: '16:00',
                location: 'Beach',
              },
            },
          ],
          error: null,
        }),
      });

      // Mock accommodations
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'acc-1',
              check_in_date: '2024-06-14',
              check_out_date: '2024-06-17',
              room_types: {
                id: 'room-1',
                name: 'Deluxe Room',
                accommodations: {
                  id: 'hotel-1',
                  name: 'Hotel Paradise',
                  location: 'Downtown',
                },
              },
            },
          ],
          error: null,
        }),
      });

      // Mock capacity count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 15,
          error: null,
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/guests/guest-123/rsvps');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'guest-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.activities).toHaveLength(1);
      expect(data.data.activities[0]).toMatchObject({
        id: 'rsvp-1',
        name: 'Beach Volleyball',
        type: 'activity',
        status: 'attending',
        guestCount: 2,
        dietaryRestrictions: 'Vegetarian',
        capacity: 20,
        capacityRemaining: 5, // 20 - 15
      });
      expect(data.data.events).toHaveLength(1);
      expect(data.data.accommodations).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/guests/guest-123/rsvps');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'guest-123' }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/admin/guests/[id]/rsvps/[rsvpId]', () => {
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'attending' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when request data is invalid', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'invalid_status' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should update activity RSVP status', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            guest_id: 'guest-123',
            activity_id: 'activity-1',
            status: 'pending',
            activities: {
              id: 'activity-1',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock capacity check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockResolvedValue({
          count: 15,
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            status: 'attending',
            activities: {
              id: 'activity-1',
              title: 'Beach Volleyball',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock new capacity count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 16,
          error: null,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'attending' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('attending');
      expect(data.data.capacityRemaining).toBe(4); // 20 - 16
    });

    it('should return 409 when activity is at full capacity', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            guest_id: 'guest-123',
            activity_id: 'activity-1',
            status: 'pending',
            activities: {
              id: 'activity-1',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock capacity check - full
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockResolvedValue({
          count: 20, // Full capacity
          error: null,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'attending' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CAPACITY_EXCEEDED');
    });

    it('should update guest count', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            guest_id: 'guest-123',
            activity_id: 'activity-1',
            status: 'attending',
            guest_count: 2,
            activities: {
              id: 'activity-1',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            status: 'attending',
            guest_count: 3,
            activities: {
              id: 'activity-1',
              title: 'Beach Volleyball',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock capacity count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 15,
          error: null,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestCount: 3 }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.guestCount).toBe(3);
    });

    it('should update dietary restrictions', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            guest_id: 'guest-123',
            activity_id: 'activity-1',
            status: 'attending',
            dietary_restrictions: 'Vegetarian',
            activities: {
              id: 'activity-1',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-1',
            status: 'attending',
            dietary_restrictions: 'Vegan',
            activities: {
              id: 'activity-1',
              title: 'Beach Volleyball',
              capacity: 20,
            },
          },
          error: null,
        }),
      });

      // Mock capacity count
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 15,
          error: null,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-1',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dietaryRestrictions: 'Vegan' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-1' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dietaryRestrictions).toBe('Vegan');
    });

    it('should update event RSVP status', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      // Mock finding event RSVP
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-2',
            guest_id: 'guest-123',
            event_id: 'event-1',
            status: 'pending',
          },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rsvp-2',
            status: 'attending',
          },
          error: null,
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-2',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'attending' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-2' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('attending');
    });

    it('should return 404 when RSVP not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'admin-1' } } },
        error: null,
      });

      // Mock finding activity RSVP - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      // Mock finding event RSVP - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      const request = new Request(
        'http://localhost:3000/api/admin/guests/guest-123/rsvps/rsvp-999',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'attending' }),
        }
      );
      const response = await PUT(request, {
        params: Promise.resolve({ id: 'guest-123', rsvpId: 'rsvp-999' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
});
