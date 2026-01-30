/**
 * Integration Test: Locations API
 * 
 * Tests authenticated requests, validation errors, CRUD operations,
 * circular reference detection, and error responses for locations API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock location service BEFORE importing route handlers
jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteLocation: jest.fn(),
  getHierarchy: jest.fn(),
  list: jest.fn(),
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

import { GET, POST } from '@/app/api/admin/locations/route';
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/admin/locations/[id]/route';
import { POST as VALIDATE_PARENT } from '@/app/api/admin/locations/[id]/validate-parent/route';
import * as locationService from '@/services/locationService';

describe('Locations API Integration Tests', () => {
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

  describe('GET /api/admin/locations', () => {
    it('should return location hierarchy when authenticated', async () => {
      const mockHierarchy = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          parentLocationId: null,
          address: null,
          coordinates: null,
          description: null,
          createdAt: '2025-01-01T00:00:00Z',
          children: [],
        },
      ];

      (locationService.getHierarchy as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHierarchy,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockHierarchy);
    });

    it('should return 500 when service fails', async () => {
      (locationService.getHierarchy as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Database error' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/locations', () => {
    it('should create location with valid data', async () => {
      const newLocation = {
        id: 'loc-1',
        name: 'Costa Rica',
        parentLocationId: null,
        address: null,
        coordinates: null,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
      };

      (locationService.create as jest.Mock).mockResolvedValue({
        success: true,
        data: newLocation,
      } as any);

      const request = {
        json: async () => ({ name: 'Costa Rica' }),
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newLocation);
    });

    it('should return 400 for validation errors', async () => {
      const request = {
        json: async () => ({ name: '' }), // Invalid: empty name
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid parent location ID format', async () => {
      const request = {
        json: async () => ({
          name: 'New Location',
          parentLocationId: 'invalid-id', // Invalid UUID format
        }),
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for circular reference from service', async () => {
      (locationService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'This would create a circular reference',
        },
      } as any);

      const request = {
        json: async () => ({
          name: 'New Location',
          parentLocationId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        }),
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CIRCULAR_REFERENCE');
    });
  });

  describe('GET /api/admin/locations/:id', () => {
    it('should return location by ID', async () => {
      const mockLocation = {
        id: 'loc-1',
        name: 'Costa Rica',
        parentLocationId: null,
        address: null,
        coordinates: null,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
      };

      (locationService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockLocation,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockLocation);
    });

    it('should return 404 when location not found', async () => {
      (locationService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations/invalid-id',
      } as any;

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/admin/locations/:id', () => {
    it('should update location with valid data', async () => {
      const updatedLocation = {
        id: 'loc-1',
        name: 'Updated Name',
        parentLocationId: null,
        address: 'New Address',
        coordinates: null,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
      };

      (locationService.update as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedLocation,
      } as any);

      const request = {
        json: async () => ({ name: 'Updated Name', address: 'New Address' }),
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedLocation);
    });

    it('should return 404 when location not found', async () => {
      (locationService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      } as any);

      const request = {
        json: async () => ({ name: 'Updated Name' }),
        url: 'http://localhost:3000/api/admin/locations/invalid-id',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 409 for circular reference from service', async () => {
      (locationService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'This would create a circular reference',
        },
      } as any);

      const request = {
        json: async () => ({ parentLocationId: '123e4567-e89b-12d3-a456-426614174000' }), // Valid UUID
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await PUT(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CIRCULAR_REFERENCE');
    });
  });

  describe('DELETE /api/admin/locations/:id', () => {
    it('should delete location successfully', async () => {
      (locationService.deleteLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 when deletion fails', async () => {
      (locationService.deleteLocation as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to delete' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/locations/:id/validate-parent', () => {
    it('should validate parent successfully when no circular reference', async () => {
      const request = {
        json: async () => ({ parentLocationId: 'loc-3' }),
        url: 'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
      } as any;

      const response = await VALIDATE_PARENT(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
    });

    it('should return 409 when circular reference detected', async () => {
      const request = {
        json: async () => ({ parentLocationId: 'loc-1' }), // Self as parent
        url: 'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
      } as any;

      const response = await VALIDATE_PARENT(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CIRCULAR_REFERENCE');
    });

    it('should return 400 when parentLocationId missing', async () => {
      const request = {
        json: async () => ({}),
        url: 'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
      } as any;

      const response = await VALIDATE_PARENT(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Tree Structure Retrieval', () => {
    it('should return hierarchical tree structure', async () => {
      const mockHierarchy = [
        {
          id: 'loc-1',
          name: 'Costa Rica',
          parentLocationId: null,
          address: null,
          coordinates: null,
          description: null,
          createdAt: '2025-01-01T00:00:00Z',
          children: [
            {
              id: 'loc-2',
              name: 'Guanacaste',
              parentLocationId: 'loc-1',
              address: null,
              coordinates: null,
              description: null,
              createdAt: '2025-01-01T00:00:00Z',
              children: [],
            },
          ],
        },
      ];

      (locationService.getHierarchy as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHierarchy,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations',
      } as any;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].children).toBeDefined();
      expect(data.data[0].children.length).toBe(1);
    });
  });

  describe('Cascade Deletion', () => {
    it('should handle cascade deletion (children become orphans)', async () => {
      // This is handled by the database trigger, but we test the API behavior
      (locationService.deleteLocation as jest.Mock).mockResolvedValue({
        success: true,
        data: undefined,
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/locations/loc-1',
      } as any;

      const response = await DELETE(request, { params: Promise.resolve({ id: 'loc-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(locationService.deleteLocation).toHaveBeenCalledWith('loc-1');
    });
  });
});
