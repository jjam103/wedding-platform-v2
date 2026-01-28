// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill Request for Node.js environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: string | null;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      this.body = init?.body || null;
    }

    async json() {
      return this.body ? JSON.parse(this.body) : null;
    }
  } as any;
}

// Mock Next.js server module to avoid Request/Response issues
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { GET as getRoomTypes } from '@/app/api/admin/accommodations/[id]/room-types/route';
import { POST as createRoomType } from '@/app/api/admin/room-types/route';
import { GET as getRoomType, PUT as updateRoomType, DELETE as deleteRoomType } from '@/app/api/admin/room-types/[id]/route';
import { GET as getRoomTypeSections } from '@/app/api/admin/room-types/[id]/sections/route';

// Mock Supabase auth
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: {
            session: {
              user: { id: 'user-1', email: 'admin@example.com' },
              access_token: 'mock-token',
            },
          },
          error: null,
        })
      ),
    },
  })),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock accommodation service
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

import * as accommodationService from '@/services/accommodationService';
import * as sectionsService from '@/services/sectionsService';

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
  });

  describe('GET /api/admin/accommodations/:id/room-types', () => {
    it('should return 401 when not authenticated', async () => {
      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
      createRouteHandlerClient.mockReturnValueOnce({
        auth: {
          getSession: jest.fn(() =>
            Promise.resolve({
              data: { session: null },
              error: { message: 'Not authenticated' },
            })
          ),
        },
      });

      const request = new Request('http://localhost:3000/api/admin/accommodations/accommodation-1/room-types');
      const response = await getRoomTypes(request, { params: { id: 'accommodation-1' } });
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

      (accommodationService.listRoomTypes as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoomTypes,
      });

      const request = new Request('http://localhost:3000/api/admin/accommodations/accommodation-1/room-types');
      const response = await getRoomTypes(request, { params: { id: 'accommodation-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe('Ocean View Suite');
    });

    it('should handle service errors', async () => {
      (accommodationService.listRoomTypes as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
      });

      const request = new Request('http://localhost:3000/api/admin/accommodations/accommodation-1/room-types');
      const response = await getRoomTypes(request, { params: { id: 'accommodation-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/admin/room-types', () => {
    it('should return 401 when not authenticated', async () => {
      const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
      createRouteHandlerClient.mockReturnValueOnce({
        auth: {
          getSession: jest.fn(() =>
            Promise.resolve({
              data: { session: null },
              error: { message: 'Not authenticated' },
            })
          ),
        },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types', {
        method: 'POST',
        body: JSON.stringify({
          accommodationId: 'accommodation-1',
          name: 'Deluxe Suite',
          capacity: 4,
          totalRooms: 5,
          pricePerNight: 350,
        }),
      });
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

      (accommodationService.createRoomType as jest.Mock).mockResolvedValue({
        success: true,
        data: newRoomType,
      });

      const request = new Request('http://localhost:3000/api/admin/room-types', {
        method: 'POST',
        body: JSON.stringify({
          accommodationId: 'accommodation-1',
          name: 'Deluxe Suite',
          capacity: 4,
          totalRooms: 5,
          pricePerNight: 350,
          hostSubsidyPerNight: 100,
        }),
      });
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Deluxe Suite');
      expect(data.data.capacity).toBe(4);
    });

    it('should return 400 for validation errors', async () => {
      (accommodationService.createRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['name'], message: 'Name is required' }],
        },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types', {
        method: 'POST',
        body: JSON.stringify({
          accommodationId: 'accommodation-1',
          capacity: 2,
          totalRooms: 10,
          pricePerNight: 200,
        }),
      });
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

      (accommodationService.getRoomType as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRoomType,
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/room-type-1');
      const response = await getRoomType(request, { params: { id: 'room-type-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('room-type-1');
      expect(data.data.name).toBe('Ocean View Suite');
    });

    it('should return 404 when room type not found', async () => {
      (accommodationService.getRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room type not found' },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/nonexistent');
      const response = await getRoomType(request, { params: { id: 'nonexistent' } });
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

      (accommodationService.updateRoomType as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedRoomType,
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/room-type-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Premium Ocean View Suite',
          pricePerNight: 300,
        }),
      });
      const response = await updateRoomType(request, { params: { id: 'room-type-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Premium Ocean View Suite');
      expect(data.data.pricePerNight).toBe(300);
    });

    it('should return 404 when updating nonexistent room type', async () => {
      (accommodationService.updateRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room type not found' },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const response = await updateRoomType(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/admin/room-types/:id', () => {
    it('should delete a room type', async () => {
      (accommodationService.deleteRoomType as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/room-type-1', {
        method: 'DELETE',
      });
      const response = await deleteRoomType(request, { params: { id: 'room-type-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      (accommodationService.deleteRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to delete room type' },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/room-type-1', {
        method: 'DELETE',
      });
      const response = await deleteRoomType(request, { params: { id: 'room-type-1' } });
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

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSections,
      });

      const request = new Request('http://localhost:3000/api/admin/room-types/room-type-1/sections');
      const response = await getRoomTypeSections(request, { params: { id: 'room-type-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(sectionsService.listSections).toHaveBeenCalledWith('room_type', 'room-type-1');
    });
  });

  describe('Capacity validation', () => {
    it('should validate capacity is positive', async () => {
      (accommodationService.createRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Capacity must be positive',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types', {
        method: 'POST',
        body: JSON.stringify({
          accommodationId: 'accommodation-1',
          name: 'Invalid Room',
          capacity: -1,
          totalRooms: 10,
          pricePerNight: 200,
        }),
      });
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate total rooms is positive', async () => {
      (accommodationService.createRoomType as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Total rooms must be positive',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/room-types', {
        method: 'POST',
        body: JSON.stringify({
          accommodationId: 'accommodation-1',
          name: 'Invalid Room',
          capacity: 2,
          totalRooms: 0,
          pricePerNight: 200,
        }),
      });
      const response = await createRoomType(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
