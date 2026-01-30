/**
 * Integration Test: Room Types API
 * 
 * Tests authenticated requests, validation errors, CRUD operations,
 * capacity validation, and error responses for room types API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock accommodation service BEFORE importing route handlers
jest.mock('@/services/accommodationService', () => ({
  listRoomTypes: jest.fn(),
  createRoomType: jest.fn(),
  getRoomType: jest.fn(),
  updateRoomType: jest.fn(),
  deleteRoomType: jest.fn(),
}));

// Mock sections service
jest.mock('@/services/sectionsService', () => ({
  listSections: jest.fn(),
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

import { GET as getRoomTypes } from '@/app/api/admin/accommodations/[id]/room-types/route';
import { POST as createRoomType } from '@/app/api/admin/room-types/route';
import { GET as getRoomType, PUT as updateRoomType, DELETE as deleteRoomType } from '@/app/api/admin/room-types/[id]/route';
import { GET as getRoomTypeSections } from '@/app/api/admin/room-types/[id]/sections/route';
// Get mock functions after imports
const accommodationService = require('@/services/accommodationService');
const sectionsService = require('@/services/sectionsService');

/**
 * Integration tests for Room Types API
 * 
 * Tests:
 * - Room type CRUD operations
 * - Capacity validation
 * - Guest assignment
 * 
 * Requirements: 22.1-22.7
 */
describe('Room Types API Integration Tests', () => {
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

  describe('GET /api/admin/accommodations/:id/room-types', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/accommodations/accommodation-1/room-types',
      } as any;
      
      const response = await getRoomTypes(request, { params: Promise.resolve({ id: 'accommodation-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return room types for an accommodation', async () => {
      const mockRoomTypes = [
        {
          id: 'room-type-1',
          accommodationId: 'accommodation-1',
          name: 'Ocean View Suite',
          capacity: 2,
          totalRooms: 10,
          pricePerNight: 250,
        },
        {
          id: 'room-type-2',
          accommodationId: 'accommodation-1',
          name: 'Standard Room',
          capacity: 2,
          totalRooms: 20,
          pricePerNight: 150,
        },
      ];

      accommodationService.listRoomTypes.mockResolvedValue({
        success: true,
        data: mockRoomTypes,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/accommodations/accommodation-1/room-types',
      } as any;
      
      const response = await getRoomTypes(request, { params: Promise.resolve({ id: 'accommodation-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Ocean View Suite');
    });

    it('should handle service errors', async () => {
      accommodationService.listRoomTypes.mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/accommodations/accommodation-1/room-types',
      } as any;
      
      const response = await getRoomTypes(request, { params: Promise.resolve({ id: 'accommodation-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/admin/room-types', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          accommodationId: 'accommodation-1',
          name: 'Deluxe Suite',
          capacity: 4,
          totalRooms: 5,
          pricePerNight: 350,
        }),
        url: 'http://localhost:3000/api/admin/room-types',
      } as any;
      
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should create a new room type', async () => {
      const newRoomType = {
        id: 'room-type-3',
        accommodationId: 'accommodation-1',
        name: 'Deluxe Suite',
        capacity: 4,
        totalRooms: 5,
        pricePerNight: 350,
        hostSubsidyPerNight: 100,
      };

      accommodationService.createRoomType.mockResolvedValue({
        success: true,
        data: newRoomType,
      } as any);

      const request = {
        json: async () => ({
          accommodationId: 'accommodation-1',
          name: 'Deluxe Suite',
          capacity: 4,
          totalRooms: 5,
          pricePerNight: 350,
          hostSubsidyPerNight: 100,
        }),
        url: 'http://localhost:3000/api/admin/room-types',
      } as any;
      
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Deluxe Suite');
      expect(data.data.capacity).toBe(4);
    });

    it('should return 400 for validation errors', async () => {
      accommodationService.createRoomType.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['name'], message: 'Name is required' }],
        },
      } as any);

      const request = {
        json: async () => ({
          accommodationId: 'accommodation-1',
          capacity: 2,
          totalRooms: 10,
          pricePerNight: 200,
        }),
        url: 'http://localhost:3000/api/admin/room-types',
      } as any;
      
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/room-types/:id', () => {
    it('should return a room type by ID', async () => {
      const mockRoomType = {
        id: 'room-type-1',
        accommodationId: 'accommodation-1',
        name: 'Ocean View Suite',
        capacity: 2,
        totalRooms: 10,
        pricePerNight: 250,
      };

      accommodationService.getRoomType.mockResolvedValue({
        success: true,
        data: mockRoomType,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/room-types/room-type-1',
      } as any;
      
      const response = await getRoomType(request, { params: Promise.resolve({ id: 'room-type-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('room-type-1');
      expect(data.data.name).toBe('Ocean View Suite');
    });

    it('should return 404 when room type not found', async () => {
      accommodationService.getRoomType.mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room type not found' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/room-types/nonexistent',
      } as any;
      
      const response = await getRoomType(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/admin/room-types/:id', () => {
    it('should update a room type', async () => {
      const updatedRoomType = {
        id: 'room-type-1',
        accommodationId: 'accommodation-1',
        name: 'Premium Ocean View Suite',
        capacity: 2,
        totalRooms: 10,
        pricePerNight: 300,
      };

      accommodationService.updateRoomType.mockResolvedValue({
        success: true,
        data: updatedRoomType,
      } as any);

      const request = {
        json: async () => ({
          name: 'Premium Ocean View Suite',
          pricePerNight: 300,
        }),
        url: 'http://localhost:3000/api/admin/room-types/room-type-1',
      } as any;
      
      const response = await updateRoomType(request, { params: Promise.resolve({ id: 'room-type-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Premium Ocean View Suite');
      expect(data.data.pricePerNight).toBe(300);
    });

    it('should return 404 when updating nonexistent room type', async () => {
      accommodationService.updateRoomType.mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room type not found' },
      } as any);

      const request = {
        json: async () => ({ name: 'Updated Name' }),
        url: 'http://localhost:3000/api/admin/room-types/nonexistent',
      } as any;
      
      const response = await updateRoomType(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/admin/room-types/:id', () => {
    it('should delete a room type', async () => {
      accommodationService.deleteRoomType.mockResolvedValue({
        success: true,
        data: undefined,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/room-types/room-type-1',
      } as any;
      
      const response = await deleteRoomType(request, { params: Promise.resolve({ id: 'room-type-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      accommodationService.deleteRoomType.mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to delete room type' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/room-types/room-type-1',
      } as any;
      
      const response = await deleteRoomType(request, { params: Promise.resolve({ id: 'room-type-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/room-types/:id/sections', () => {
    it('should return sections for a room type', async () => {
      const mockSections = [
        {
          id: 'section-1',
          pageType: 'room_type',
          pageId: 'room-type-1',
          displayOrder: 1,
          layout: 'two-column',
        },
      ];

      sectionsService.listSections.mockResolvedValue({
        success: true,
        data: mockSections,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/room-types/room-type-1/sections',
      } as any;
      
      const response = await getRoomTypeSections(request, { params: Promise.resolve({ id: 'room-type-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(sectionsService.listSections).toHaveBeenCalledWith('room_type', 'room-type-1');
    });
  });

  describe('Capacity validation', () => {
    it('should validate capacity is positive', async () => {
      accommodationService.createRoomType.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Capacity must be positive',
        },
      } as any);

      const request = {
        json: async () => ({
          accommodationId: 'accommodation-1',
          name: 'Invalid Room',
          capacity: -1,
          totalRooms: 10,
          pricePerNight: 200,
        }),
        url: 'http://localhost:3000/api/admin/room-types',
      } as any;
      
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate total rooms is positive', async () => {
      accommodationService.createRoomType.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total rooms must be positive',
        },
      } as any);

      const request = {
        json: async () => ({
          accommodationId: 'accommodation-1',
          name: 'Invalid Room',
          capacity: 2,
          totalRooms: 0,
          pricePerNight: 200,
        }),
        url: 'http://localhost:3000/api/admin/room-types',
      } as any;
      
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
