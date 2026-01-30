/**
 * Integration Test: Activities API
 * 
 * Tests activity creation/updates, capacity management, and RSVP handling
 * for activity management API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock activity service BEFORE importing route handlers
jest.mock('@/services/activityService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteActivity: jest.fn(),
  list: jest.fn(),
  search: jest.fn(),
  getCapacityInfo: jest.fn(),
  calculateNetCost: jest.fn(),
}));

// Mock RSVP service BEFORE importing route handlers
jest.mock('@/services/rsvpService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteRSVP: jest.fn(),
  list: jest.fn(),
  getByGuest: jest.fn(),
  getByEvent: jest.fn(),
  getByActivity: jest.fn(),
  calculateActivityCapacity: jest.fn(),
  generateCapacityAlerts: jest.fn(),
  checkCapacityAvailable: jest.fn(),
  enforceCapacityLimit: jest.fn(),
}));

// Mock Next.js server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
  NextRequest: jest.fn(),
}));

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Supabase server client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabaseServer', () => ({
  createAuthenticatedClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Supabase SSR client for RSVP routes
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

import { GET as GET_ACTIVITIES, POST as POST_ACTIVITIES } from '@/app/api/admin/activities/route';
import {
  GET as GET_ACTIVITY_BY_ID,
  PUT as PUT_ACTIVITY,
  DELETE as DELETE_ACTIVITY,
} from '@/app/api/admin/activities/[id]/route';
import { GET as GET_CAPACITY } from '@/app/api/admin/activities/[id]/capacity/route';
import { GET as GET_RSVPS } from '@/app/api/admin/rsvps/route';
import { PUT as PUT_RSVP } from '@/app/api/admin/rsvps/[id]/route';
import * as activityService from '@/services/activityService';
import * as rsvpService from '@/services/rsvpService';

describe('Activities API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'admin@example.com' },
      },
      error: null,
    } as any);
    
    // Default: valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: 'user-1', email: 'admin@example.com' } },
      },
      error: null,
    } as any);
  });

  describe('Activity Creation/Updates', () => {
    describe('POST /api/admin/activities', () => {
      it('should create activity with valid data', async () => {
        const newActivity = {
          id: 'activity-1',
          name: 'Beach Volleyball',
          activityType: 'activity',
          startTime: '2025-06-15T10:00:00Z',
          capacity: 20,
          costPerPerson: 25.00,
          hostSubsidy: 5.00,
          adultsOnly: false,
          status: 'published',
          createdAt: '2025-01-01T00:00:00Z',
        };

        (activityService.create as jest.Mock).mockResolvedValue({
          success: true,
          data: newActivity,
        } as any);

        const request = {
          json: async () => ({
            name: 'Beach Volleyball',
            activityType: 'activity',
            startTime: '2025-06-15T10:00:00Z',
            capacity: 20,
            costPerPerson: 25.00,
            hostSubsidy: 5.00,
            adultsOnly: false,
          }),
          url: 'http://localhost:3000/api/admin/activities',
        } as any;

        const response = await POST_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(newActivity);
        expect(activityService.create).toHaveBeenCalledWith({
          name: 'Beach Volleyball',
          activityType: 'activity',
          startTime: '2025-06-15T10:00:00Z',
          capacity: 20,
          costPerPerson: 25.00,
          hostSubsidy: 5.00,
          adultsOnly: false,
        });
      });

      it('should return 400 for validation errors', async () => {
        (activityService.create as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: ['name'], message: 'Name is required' }],
          },
        } as any);

        const request = {
          json: async () => ({ name: '' }), // Invalid: empty name
          url: 'http://localhost:3000/api/admin/activities',
        } as any;

        const response = await POST_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 401 when not authenticated', async () => {
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        } as any);

        const request = {
          json: async () => ({ name: 'Beach Volleyball' }),
          url: 'http://localhost:3000/api/admin/activities',
        } as any;

        const response = await POST_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 500 for database errors', async () => {
        (activityService.create as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed',
          },
        } as any);

        const request = {
          json: async () => ({
            name: 'Beach Volleyball',
            activityType: 'activity',
            startTime: '2025-06-15T10:00:00Z',
          }),
          url: 'http://localhost:3000/api/admin/activities',
        } as any;

        const response = await POST_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });

    describe('PUT /api/admin/activities/[id]', () => {
      it('should update activity with valid data', async () => {
        const updatedActivity = {
          id: 'activity-1',
          name: 'Updated Beach Volleyball',
          activityType: 'activity',
          startTime: '2025-06-15T11:00:00Z',
          capacity: 25,
          costPerPerson: 30.00,
          hostSubsidy: 10.00,
          adultsOnly: true,
          status: 'published',
          createdAt: '2025-01-01T00:00:00Z',
        };

        (activityService.update as jest.Mock).mockResolvedValue({
          success: true,
          data: updatedActivity,
        } as any);

        const request = {
          json: async () => ({
            name: 'Updated Beach Volleyball',
            startTime: '2025-06-15T11:00:00Z',
            capacity: 25,
            costPerPerson: 30.00,
            hostSubsidy: 10.00,
            adultsOnly: true,
          }),
          url: 'http://localhost:3000/api/admin/activities/activity-1',
        } as any;

        const response = await PUT_ACTIVITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(updatedActivity);
        expect(activityService.update).toHaveBeenCalledWith('activity-1', {
          name: 'Updated Beach Volleyball',
          startTime: '2025-06-15T11:00:00Z',
          capacity: 25,
          costPerPerson: 30.00,
          hostSubsidy: 10.00,
          adultsOnly: true,
        });
      });

      it('should return 404 when activity not found', async () => {
        (activityService.update as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        } as any);

        const request = {
          json: async () => ({ name: 'Updated Name' }),
          url: 'http://localhost:3000/api/admin/activities/invalid-id',
        } as any;

        const response = await PUT_ACTIVITY(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for validation errors', async () => {
        (activityService.update as jest.Mock).mockResolvedValue({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ path: ['capacity'], message: 'Capacity must be positive' }],
          },
        } as any);

        const request = {
          json: async () => ({ capacity: -5 }), // Invalid: negative capacity
          url: 'http://localhost:3000/api/admin/activities/activity-1',
        } as any;

        const response = await PUT_ACTIVITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('GET /api/admin/activities', () => {
      it('should list activities with filters', async () => {
        const mockActivities = {
          activities: [
            {
              id: 'activity-1',
              name: 'Beach Volleyball',
              activityType: 'activity',
              startTime: '2025-06-15T10:00:00Z',
              capacity: 20,
              status: 'published',
            },
            {
              id: 'activity-2',
              name: 'Sunset Dinner',
              activityType: 'meal',
              startTime: '2025-06-15T18:00:00Z',
              capacity: 50,
              status: 'published',
            },
          ],
          total: 2,
          page: 1,
          pageSize: 50,
          totalPages: 1,
        };

        (activityService.list as jest.Mock).mockResolvedValue({
          success: true,
          data: mockActivities,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities?eventId=event-1&status=published',
        } as any;

        const response = await GET_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockActivities);
        expect(activityService.list).toHaveBeenCalledWith({
          eventId: 'event-1',
          status: 'published',
        });
      });

      it('should handle pagination parameters', async () => {
        const mockActivities = {
          activities: [],
          total: 0,
          page: 2,
          pageSize: 10,
          totalPages: 0,
        };

        (activityService.list as jest.Mock).mockResolvedValue({
          success: true,
          data: mockActivities,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities?page=2&pageSize=10',
        } as any;

        const response = await GET_ACTIVITIES(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(activityService.list).toHaveBeenCalledWith({
          page: 2,
          pageSize: 10,
        });
      });
    });

    describe('GET /api/admin/activities/[id]', () => {
      it('should return activity by ID', async () => {
        const mockActivity = {
          id: 'activity-1',
          name: 'Beach Volleyball',
          activityType: 'activity',
          startTime: '2025-06-15T10:00:00Z',
          capacity: 20,
          status: 'published',
          createdAt: '2025-01-01T00:00:00Z',
        };

        (activityService.get as jest.Mock).mockResolvedValue({
          success: true,
          data: mockActivity,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1',
        } as any;

        const response = await GET_ACTIVITY_BY_ID(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockActivity);
        expect(activityService.get).toHaveBeenCalledWith('activity-1');
      });

      it('should return 404 when activity not found', async () => {
        (activityService.get as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/invalid-id',
        } as any;

        const response = await GET_ACTIVITY_BY_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });
    });

    describe('DELETE /api/admin/activities/[id]', () => {
      it('should delete activity successfully', async () => {
        (activityService.deleteActivity as jest.Mock).mockResolvedValue({
          success: true,
          data: undefined,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1',
        } as any;

        const response = await DELETE_ACTIVITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(activityService.deleteActivity).toHaveBeenCalledWith('activity-1');
      });

      it('should return 500 when deletion fails', async () => {
        (activityService.deleteActivity as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to delete' },
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1',
        } as any;

        const response = await DELETE_ACTIVITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });
  });

  describe('Capacity Management', () => {
    describe('GET /api/admin/activities/[id]/capacity', () => {
      it('should return capacity information for activity', async () => {
        const mockCapacityInfo = {
          activityId: 'activity-1',
          activityName: 'Beach Volleyball',
          capacity: 20,
          currentAttendees: 15,
          availableSpots: 5,
          utilizationPercentage: 75,
          isNearCapacity: false,
          isAtCapacity: false,
        };

        (activityService.getCapacityInfo as jest.Mock).mockResolvedValue({
          success: true,
          data: mockCapacityInfo,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1/capacity',
        } as any;

        const response = await GET_CAPACITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockCapacityInfo);
        expect(activityService.getCapacityInfo).toHaveBeenCalledWith('activity-1');
      });

      it('should return capacity info showing near capacity warning', async () => {
        const mockCapacityInfo = {
          activityId: 'activity-1',
          activityName: 'Beach Volleyball',
          capacity: 20,
          currentAttendees: 18,
          availableSpots: 2,
          utilizationPercentage: 90,
          isNearCapacity: true,
          isAtCapacity: false,
        };

        (activityService.getCapacityInfo as jest.Mock).mockResolvedValue({
          success: true,
          data: mockCapacityInfo,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1/capacity',
        } as any;

        const response = await GET_CAPACITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.isNearCapacity).toBe(true);
        expect(data.data.utilizationPercentage).toBe(90);
      });

      it('should return capacity info showing at capacity', async () => {
        const mockCapacityInfo = {
          activityId: 'activity-1',
          activityName: 'Beach Volleyball',
          capacity: 20,
          currentAttendees: 20,
          availableSpots: 0,
          utilizationPercentage: 100,
          isNearCapacity: true,
          isAtCapacity: true,
        };

        (activityService.getCapacityInfo as jest.Mock).mockResolvedValue({
          success: true,
          data: mockCapacityInfo,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1/capacity',
        } as any;

        const response = await GET_CAPACITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.isAtCapacity).toBe(true);
        expect(data.data.availableSpots).toBe(0);
      });

      it('should return 404 when activity not found', async () => {
        (activityService.getCapacityInfo as jest.Mock).mockResolvedValue({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/invalid-id/capacity',
        } as any;

        const response = await GET_CAPACITY(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });

      it('should handle unlimited capacity activities', async () => {
        const mockCapacityInfo = {
          activityId: 'activity-1',
          activityName: 'Beach Volleyball',
          capacity: null,
          currentAttendees: 25,
          availableSpots: null,
          utilizationPercentage: null,
          isNearCapacity: false,
          isAtCapacity: false,
        };

        (activityService.getCapacityInfo as jest.Mock).mockResolvedValue({
          success: true,
          data: mockCapacityInfo,
        } as any);

        const request = {
          url: 'http://localhost:3000/api/admin/activities/activity-1/capacity',
        } as any;

        const response = await GET_CAPACITY(request, { params: Promise.resolve({ id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.capacity).toBeNull();
        expect(data.data.availableSpots).toBeNull();
        expect(data.data.utilizationPercentage).toBeNull();
      });
    });
  });

  describe('RSVP Handling', () => {
    describe('GET /api/admin/rsvps', () => {
      it('should list RSVPs with filters', async () => {
        const mockRSVPs = [
          {
            id: 'rsvp-1',
            guest_id: 'guest-1',
            activity_id: 'activity-1',
            status: 'attending',
            guest_count: 2,
            created_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'rsvp-2',
            guest_id: 'guest-2',
            activity_id: 'activity-1',
            status: 'declined',
            guest_count: 1,
            created_at: '2025-01-01T01:00:00Z',
          },
        ];

        // Mock Supabase query chain to match the actual route implementation
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockRSVPs,
            error: null,
            count: 2,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          url: 'http://localhost:3000/api/admin/rsvps?activity_id=123e4567-e89b-12d3-a456-426614174000&status=attending',
        } as any;

        const response = await GET_RSVPS(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockRSVPs);
        expect(data.pagination.total).toBe(2);
      });

      it('should handle pagination parameters', async () => {
        const mockRSVPs: any[] = [];

        // Mock Supabase query chain to match the actual route implementation
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockRSVPs,
            error: null,
            count: 0,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          url: 'http://localhost:3000/api/admin/rsvps?page=2&page_size=10',
        } as any;

        const response = await GET_RSVPS(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.pagination.page).toBe(2);
        expect(data.pagination.page_size).toBe(10);
        expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // (page-1)*pageSize to (page*pageSize)-1
      });

      it('should return 400 for invalid filter parameters', async () => {
        const request = {
          url: 'http://localhost:3000/api/admin/rsvps?page=invalid',
        } as any;

        const response = await GET_RSVPS(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should return 500 for database errors', async () => {
        // Mock Supabase query chain with error to match the actual route implementation
        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
            count: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          url: 'http://localhost:3000/api/admin/rsvps',
        } as any;

        const response = await GET_RSVPS(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('DATABASE_ERROR');
      });
    });

    describe('PUT /api/admin/rsvps/[id]', () => {
      it('should update RSVP with valid data', async () => {
        const updatedRSVP = {
          id: 'rsvp-1',
          guest_id: 'guest-1',
          activity_id: 'activity-1',
          status: 'attending',
          guest_count: 3,
          dietary_notes: 'Vegetarian',
          updated_at: '2025-01-01T12:00:00Z',
          responded_at: '2025-01-01T12:00:00Z',
        };

        // Mock Supabase update chain
        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: updatedRSVP,
            error: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          json: async () => ({
            status: 'attending',
            guest_count: 3,
            dietary_notes: 'Vegetarian',
          }),
          url: 'http://localhost:3000/api/admin/rsvps/rsvp-1',
        } as any;

        const response = await PUT_RSVP(request, { params: Promise.resolve({ id: 'rsvp-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(updatedRSVP);
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'attending',
            guest_count: 3,
            dietary_notes: 'Vegetarian',
            updated_at: expect.any(String),
            responded_at: expect.any(String),
          })
        );
      });

      it('should return 404 when RSVP not found', async () => {
        // Mock Supabase update chain with not found error
        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' },
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          json: async () => ({ status: 'attending' }),
          url: 'http://localhost:3000/api/admin/rsvps/invalid-id',
        } as any;

        const response = await PUT_RSVP(request, { params: Promise.resolve({ id: 'invalid-id' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });

      it('should return 400 for validation errors', async () => {
        const request = {
          json: async () => ({ status: 'invalid_status' }), // Invalid status
          url: 'http://localhost:3000/api/admin/rsvps/rsvp-1',
        } as any;

        const response = await PUT_RSVP(request, { params: Promise.resolve({ id: 'rsvp-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });

      it('should set responded_at when status changes from pending', async () => {
        const updatedRSVP = {
          id: 'rsvp-1',
          guest_id: 'guest-1',
          activity_id: 'activity-1',
          status: 'attending',
          guest_count: 1,
          updated_at: '2025-01-01T12:00:00Z',
          responded_at: '2025-01-01T12:00:00Z',
        };

        // Mock Supabase update chain
        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: updatedRSVP,
            error: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          json: async () => ({ status: 'attending' }),
          url: 'http://localhost:3000/api/admin/rsvps/rsvp-1',
        } as any;

        const response = await PUT_RSVP(request, { params: Promise.resolve({ id: 'rsvp-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'attending',
            updated_at: expect.any(String),
            responded_at: expect.any(String),
          })
        );
      });

      it('should not set responded_at when status is pending', async () => {
        const updatedRSVP = {
          id: 'rsvp-1',
          guest_id: 'guest-1',
          activity_id: 'activity-1',
          status: 'pending',
          guest_count: 1,
          updated_at: '2025-01-01T12:00:00Z',
          responded_at: null,
        };

        // Mock Supabase update chain
        const mockQuery = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: updatedRSVP,
            error: null,
          }),
        };

        mockSupabaseClient.from.mockReturnValue(mockQuery);

        const request = {
          json: async () => ({ status: 'pending' }),
          url: 'http://localhost:3000/api/admin/rsvps/rsvp-1',
        } as any;

        const response = await PUT_RSVP(request, { params: Promise.resolve({ id: 'rsvp-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
            updated_at: expect.any(String),
          })
        );
        // Should not include responded_at for pending status
        expect(mockQuery.update).not.toHaveBeenCalledWith(
          expect.objectContaining({
            responded_at: expect.any(String),
          })
        );
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 for all endpoints when not authenticated', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const endpoints = [
        { handler: GET_ACTIVITIES, request: { url: 'http://localhost:3000/api/admin/activities' } },
        { handler: POST_ACTIVITIES, request: { url: 'http://localhost:3000/api/admin/activities', json: async () => ({}) } },
        { handler: GET_ACTIVITY_BY_ID, request: { url: 'http://localhost:3000/api/admin/activities/activity-1' }, params: { params: Promise.resolve({ id: 'activity-1' }) } },
        { handler: PUT_ACTIVITY, request: { url: 'http://localhost:3000/api/admin/activities/activity-1', json: async () => ({}) }, params: { params: Promise.resolve({ id: 'activity-1' }) } },
        { handler: DELETE_ACTIVITY, request: { url: 'http://localhost:3000/api/admin/activities/activity-1' }, params: { params: Promise.resolve({ id: 'activity-1' }) } },
        { handler: GET_CAPACITY, request: { url: 'http://localhost:3000/api/admin/activities/activity-1/capacity' }, params: { params: Promise.resolve({ id: 'activity-1' }) } },
        { handler: GET_RSVPS, request: { url: 'http://localhost:3000/api/admin/rsvps' } },
        { handler: PUT_RSVP, request: { url: 'http://localhost:3000/api/admin/rsvps/rsvp-1', json: async () => ({}) }, params: { params: Promise.resolve({ id: 'rsvp-1' }) } },
      ];

      for (const endpoint of endpoints) {
        const response = endpoint.params 
          ? await endpoint.handler(endpoint.request as any, endpoint.params as any)
          : await endpoint.handler(endpoint.request as any);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should return 401 when session has error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/activities',
      } as any;

      const response = await GET_ACTIVITIES(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });
});