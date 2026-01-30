/**
 * Integration Test: Guests API
 * 
 * Tests authenticated requests, validation errors, CRUD operations,
 * and error responses for guest management API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock guest service BEFORE importing route handlers
jest.mock('@/services/guestService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteGuest: jest.fn(),
  list: jest.fn(),
  search: jest.fn(),
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

// Mock Supabase SSR client
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

// Mock createAuthenticatedClient
jest.mock('@/lib/supabaseServer', () => ({
  createAuthenticatedClient: jest.fn(() => mockSupabaseClient),
}));

import { GET, POST } from '@/app/api/admin/guests/route';
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/admin/guests/[id]/route';
import * as guestService from '@/services/guestService';

describe('Guests API Integration Tests', () => {
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

  describe('Authentication Tests', () => {
    it('should return 401 when not authenticated (GET /api/admin/guests)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when auth error occurs (POST /api/admin/guests)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error' },
      } as any);

      const request = {
        json: async () => ({ firstName: 'John', lastName: 'Doe' }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when not authenticated (GET /api/admin/guests/:id)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when not authenticated (PUT /api/admin/guests/:id)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const request = {
        json: async () => ({ firstName: 'Updated' }),
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when not authenticated (DELETE /api/admin/guests/:id)', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/admin/guests', () => {
    it('should return guest list when authenticated', async () => {
      const mockGuestList = {
        guests: [
          {
            id: 'guest-1',
            groupId: 'group-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: null,
            ageType: 'adult' as const,
            guestType: 'wedding_guest',
            dietaryRestrictions: null,
            plusOneName: null,
            plusOneAttending: false,
            arrivalDate: null,
            departureDate: null,
            airportCode: null,
            flightNumber: null,
            invitationSent: false,
            invitationSentDate: null,
            rsvpDeadline: null,
            notes: null,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      };

      (guestService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: mockGuestList,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockGuestList);
      expect(guestService.list).toHaveBeenCalledWith({
        groupId: undefined,
        ageType: undefined,
        guestType: undefined,
        page: 1,
        pageSize: 50,
      });
    });

    it('should handle query parameters for filtering', async () => {
      const mockGuestList = {
        guests: [],
        total: 0,
        page: 2,
        pageSize: 25,
        totalPages: 0,
      };

      (guestService.list as jest.Mock).mockResolvedValue({
        success: true,
        data: mockGuestList,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests?groupId=group-1&ageType=adult&guestType=wedding_guest&page=2&pageSize=25',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(guestService.list).toHaveBeenCalledWith({
        groupId: 'group-1',
        ageType: 'adult',
        guestType: 'wedding_guest',
        page: 2,
        pageSize: 25,
      });
    });

    it('should return 500 when service fails', async () => {
      (guestService.list as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database error' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/admin/guests', () => {
    it('should create guest with valid data', async () => {
      const newGuest = {
        id: 'guest-1',
        groupId: 'group-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        ageType: 'adult' as const,
        guestType: 'wedding_guest',
        dietaryRestrictions: null,
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: null,
        departureDate: null,
        airportCode: null,
        flightNumber: null,
        invitationSent: false,
        invitationSentDate: null,
        rsvpDeadline: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (guestService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: newGuest,
      } as any);

      const request = {
        json: async () => ({
          groupId: 'group-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newGuest);
      expect(guestService.create).toHaveBeenCalledWith({
        groupId: 'group-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        ageType: 'adult',
        guestType: 'wedding_guest',
      });
    });

    it('should return 400 for validation errors', async () => {
      (guestService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['firstName'], message: 'First name is required' }],
        },
      } as any);

      const request = {
        json: async () => ({
          groupId: 'group-1',
          firstName: '', // Invalid: empty name
          lastName: 'Doe',
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      (guestService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['email'], message: 'Invalid email format' }],
        },
      } as any);

      const request = {
        json: async () => ({
          groupId: 'group-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email', // Invalid email format
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid group ID format', async () => {
      (guestService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['groupId'], message: 'Invalid group ID format' }],
        },
      } as any);

      const request = {
        json: async () => ({
          groupId: 'invalid-uuid', // Invalid UUID format
          firstName: 'John',
          lastName: 'Doe',
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      (guestService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
      } as any);

      const request = {
        json: async () => ({
          groupId: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'John',
          lastName: 'Doe',
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/guests/:id', () => {
    it('should return guest by ID', async () => {
      const mockGuest = {
        id: 'guest-1',
        groupId: 'group-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        ageType: 'adult' as const,
        guestType: 'wedding_guest',
        dietaryRestrictions: null,
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: null,
        departureDate: null,
        airportCode: null,
        flightNumber: null,
        invitationSent: false,
        invitationSentDate: null,
        rsvpDeadline: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (guestService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockGuest,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockGuest);
      expect(guestService.get).toHaveBeenCalledWith('guest-1');
    });

    it('should return 404 when guest not found', async () => {
      (guestService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Guest not found' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/invalid-id',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 500 for database errors', async () => {
      (guestService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/admin/guests/:id', () => {
    it('should update guest with valid data', async () => {
      const updatedGuest = {
        id: 'guest-1',
        groupId: 'group-1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        ageType: 'adult' as const,
        guestType: 'wedding_guest',
        dietaryRestrictions: 'Vegetarian',
        plusOneName: 'John Smith',
        plusOneAttending: true,
        arrivalDate: '2025-06-01',
        departureDate: '2025-06-05',
        airportCode: 'SJO' as const,
        flightNumber: 'AA123',
        invitationSent: true,
        invitationSentDate: '2025-01-01T00:00:00Z',
        rsvpDeadline: '2025-05-01',
        notes: 'VIP guest',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      (guestService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedGuest,
      } as any);

      const request = {
        json: async () => ({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+1234567890',
          dietaryRestrictions: 'Vegetarian',
          plusOneName: 'John Smith',
          plusOneAttending: true,
        }),
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedGuest);
      expect(guestService.update).toHaveBeenCalledWith('guest-1', {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        dietaryRestrictions: 'Vegetarian',
        plusOneName: 'John Smith',
        plusOneAttending: true,
      });
    });

    it('should return 404 when guest not found', async () => {
      (guestService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Guest not found' },
      } as any);

      const request = {
        json: async () => ({ firstName: 'Updated' }),
        url: 'http://localhost:3000/api/admin/guests/invalid-id',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for validation errors', async () => {
      (guestService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['email'], message: 'Invalid email format' }],
        },
      } as any);

      const request = {
        json: async () => ({ email: 'invalid-email' }),
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      (guestService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
      } as any);

      const request = {
        json: async () => ({ firstName: 'Updated' }),
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('DELETE /api/admin/guests/:id', () => {
    it('should delete guest successfully', async () => {
      (guestService.deleteGuest as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(guestService.deleteGuest).toHaveBeenCalledWith('guest-1');
    });

    it('should return 404 when guest not found', async () => {
      (guestService.deleteGuest as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Guest not found' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/invalid-id',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 500 when deletion fails', async () => {
      (guestService.deleteGuest as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to delete guest' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed JSON in POST request', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle malformed JSON in PUT request', async () => {
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle service throwing unexpected errors', async () => {
      (guestService.get as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const request = {
        url: 'http://localhost:3000/api/admin/guests/guest-1',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'guest-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle guest with all optional fields', async () => {
      const minimalGuest = {
        id: 'guest-1',
        groupId: 'group-1',
        firstName: 'John',
        lastName: 'Doe',
        email: null,
        phone: null,
        ageType: 'adult' as const,
        guestType: 'wedding_guest',
        dietaryRestrictions: null,
        plusOneName: null,
        plusOneAttending: false,
        arrivalDate: null,
        departureDate: null,
        airportCode: null,
        flightNumber: null,
        invitationSent: false,
        invitationSentDate: null,
        rsvpDeadline: null,
        notes: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (guestService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: minimalGuest,
      } as any);

      const request = {
        json: async () => ({
          groupId: 'group-1',
          firstName: 'John',
          lastName: 'Doe',
          ageType: 'adult',
          guestType: 'wedding_guest',
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(minimalGuest);
    });

    it('should handle guest with maximum field lengths', async () => {
      const maxFieldGuest = {
        id: 'guest-1',
        groupId: 'group-1',
        firstName: 'A'.repeat(50), // Max length
        lastName: 'B'.repeat(50), // Max length
        email: 'test@example.com',
        phone: '1'.repeat(20), // Max length
        ageType: 'senior' as const,
        guestType: 'wedding_party',
        dietaryRestrictions: 'C'.repeat(500), // Max length
        plusOneName: 'D'.repeat(100), // Max length
        plusOneAttending: true,
        arrivalDate: '2025-06-01',
        departureDate: '2025-06-05',
        airportCode: 'LIR' as const,
        flightNumber: 'E'.repeat(20), // Max length
        invitationSent: true,
        invitationSentDate: '2025-01-01T00:00:00Z',
        rsvpDeadline: '2025-05-01',
        notes: 'F'.repeat(1000), // Max length
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      (guestService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: maxFieldGuest,
      } as any);

      const request = {
        json: async () => ({
          groupId: 'group-1',
          firstName: 'A'.repeat(50),
          lastName: 'B'.repeat(50),
          email: 'test@example.com',
          phone: '1'.repeat(20),
          ageType: 'senior',
          guestType: 'wedding_party',
          dietaryRestrictions: 'C'.repeat(500),
          plusOneName: 'D'.repeat(100),
          plusOneAttending: true,
          arrivalDate: '2025-06-01',
          departureDate: '2025-06-05',
          airportCode: 'LIR',
          flightNumber: 'E'.repeat(20),
          invitationSent: true,
          invitationSentDate: '2025-01-01T00:00:00Z',
          rsvpDeadline: '2025-05-01',
          notes: 'F'.repeat(1000),
        }),
        url: 'http://localhost:3000/api/admin/guests',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(maxFieldGuest);
    });
  });
});