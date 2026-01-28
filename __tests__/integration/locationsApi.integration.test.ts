import { GET, POST } from '@/app/api/admin/locations/route';
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/admin/locations/[id]/route';
import { POST as VALIDATE_PARENT } from '@/app/api/admin/locations/[id]/validate-parent/route';

// Mock Supabase auth
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'admin@example.com' },
          },
        },
        error: null,
      }),
    },
  })),
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock location service
jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  deleteLocation: jest.fn(),
  getHierarchy: jest.fn(),
  list: jest.fn(),
}));

import * as locationService from '@/services/locationService';

describe('Locations API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations');
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations');
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({ name: 'Costa Rica' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(newLocation);
    });

    it('should return 400 for validation errors', async () => {
      const request = new Request('http://localhost:3000/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Invalid: empty name
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid parent', async () => {
      (locationService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'INVALID_PARENT', message: 'Parent location does not exist' },
      });

      const request = new Request('http://localhost:3000/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Location',
          parentLocationId: 'invalid-id',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARENT');
    });

    it('should return 409 for circular reference', async () => {
      (locationService.create as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'This would create a circular reference',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/locations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Location',
          parentLocationId: 'loc-1',
        }),
      });

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
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1');
      const response = await GET_BY_ID(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockLocation);
    });

    it('should return 404 when location not found', async () => {
      (locationService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });

      const request = new Request('http://localhost:3000/api/admin/locations/invalid-id');
      const response = await GET_BY_ID(request, { params: { id: 'invalid-id' } });
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name', address: 'New Address' }),
      });

      const response = await PUT(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedLocation);
    });

    it('should return 404 when location not found', async () => {
      (locationService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      });

      const request = new Request('http://localhost:3000/api/admin/locations/invalid-id', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      const response = await PUT(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 409 for circular reference', async () => {
      (locationService.update as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'CIRCULAR_REFERENCE',
          message: 'This would create a circular reference',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1', {
        method: 'PUT',
        body: JSON.stringify({ parentLocationId: 'loc-2' }),
      });

      const response = await PUT(request, { params: { id: 'loc-1' } });
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 when deletion fails', async () => {
      (locationService.deleteLocation as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to delete' },
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/admin/locations/:id/validate-parent', () => {
    it('should validate parent successfully when no circular reference', async () => {
      // Mock Supabase client for circular reference check
      jest.mock('@supabase/supabase-js', () => ({
        createClient: jest.fn(() => ({
          from: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
              data: [
                { id: 'loc-1', parent_location_id: null },
                { id: 'loc-2', parent_location_id: 'loc-1' },
              ],
              error: null,
            }),
          })),
        })),
      }));

      const request = new Request(
        'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
        {
          method: 'POST',
          body: JSON.stringify({ parentLocationId: 'loc-3' }),
        }
      );

      const response = await VALIDATE_PARENT(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
    });

    it('should return 409 when circular reference detected', async () => {
      const request = new Request(
        'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
        {
          method: 'POST',
          body: JSON.stringify({ parentLocationId: 'loc-1' }), // Self as parent
        }
      );

      const response = await VALIDATE_PARENT(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CIRCULAR_REFERENCE');
    });

    it('should return 400 when parentLocationId missing', async () => {
      const request = new Request(
        'http://localhost:3000/api/admin/locations/loc-1/validate-parent',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await VALIDATE_PARENT(request, { params: { id: 'loc-1' } });
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations');
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
      });

      const request = new Request('http://localhost:3000/api/admin/locations/loc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'loc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(locationService.deleteLocation).toHaveBeenCalledWith('loc-1');
    });
  });
});
