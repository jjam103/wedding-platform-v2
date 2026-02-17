import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateLocationDTO, UpdateLocationDTO, LocationFilterDTO, LocationSearchDTO } from '@/schemas/locationSchemas';

// Set environment variables FIRST
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase with shared client instance (Pattern A)
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = (jest.fn() as any);
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
  };
});

// Mock sanitization utilities
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input.trim()),
  sanitizeRichText: jest.fn((input: string) => input.trim()),
}));

// Import service using require() AFTER mocking (Pattern A requirement)
const locationServiceModule = require('./locationService');
const { create, get, update, deleteLocation, list, search, getHierarchy, getWithChildren } = locationServiceModule;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('create', () => {
    const validData: CreateLocationDTO = {
      name: 'Tamarindo Beach',
      parentLocationId: '123e4567-e89b-12d3-a456-426614174000',
      address: 'Tamarindo, Guanacaste, Costa Rica',
      description: 'Beautiful beach location',
    };

    it('should return success with location data when valid input provided', async () => {
      const mockLocation = {
        id: 'location-1',
        name: 'Tamarindo Beach',
        parent_location_id: validData.parentLocationId,
        address: validData.address,
        description: validData.description,
        coordinates: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      // Mock parent location exists check (first call)
      // Service calls: supabase.from('locations').select('*').eq('id', parentId).single()
      const mockSingle1 = (jest.fn() as any).mockResolvedValue({
        data: { id: validData.parentLocationId },
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockReturnValue({ single: mockSingle1 });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });

      // Mock location creation (second call)
      // Service calls: supabase.from('locations').insert(data).select().single()
      const mockSingle2 = (jest.fn() as any).mockResolvedValue({
        data: mockLocation,
        error: null,
      });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ single: mockSingle2 });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect2 });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'locations') {
          callCount++;
          if (callCount === 1) {
            // First call - check parent exists
            return { select: mockSelect1 };
          } else {
            // Second call - insert new location
            return { insert: mockInsert };
          }
        }
        return {};
      });

      const result = await create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('location-1');
        expect(result.data.name).toBe('Tamarindo Beach');
        expect(result.data.parentLocationId).toBe(validData.parentLocationId);
      }
    });

    it('should return VALIDATION_ERROR when name is missing', async () => {
      const invalidData = { ...validData, name: '' };
      const result = await create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when name is too long', async () => {
      const invalidData = { ...validData, name: 'a'.repeat(201) };
      const result = await create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return INVALID_PARENT when parent location does not exist', async () => {
      // Mock parent location not found
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARENT');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      // Mock parent location exists
      const mockSingle1 = (jest.fn() as any).mockResolvedValue({
        data: { id: validData.parentLocationId },
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockReturnValue({ single: mockSingle1 });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });

      // Mock database error on insert
      const mockSingle2 = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ single: mockSingle2 });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect2 });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'locations') {
          callCount++;
          if (callCount === 1) {
            return { select: mockSelect1 };
          } else {
            return { insert: mockInsert };
          }
        }
        return {};
      });

      const result = await create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        name: '<script>alert("xss")</script>Tamarindo',
        address: '<img src=x onerror=alert(1)>Address',
        description: '<svg onload=alert(1)>Description',
      };

      // Mock parent location exists
      const mockSingle1 = (jest.fn() as any).mockResolvedValue({
        data: { id: validData.parentLocationId },
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockReturnValue({ single: mockSingle1 });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });

      // Mock successful creation
      const mockSingle2 = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'location-1',
          name: 'Tamarindo',
          address: 'Address',
          description: 'Description',
        },
        error: null,
      });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ single: mockSingle2 });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect2 });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'locations') {
          callCount++;
          if (callCount === 1) {
            return { select: mockSelect1 };
          } else {
            return { insert: mockInsert };
          }
        }
        return {};
      });

      const result = await create(maliciousData);

      expect(result.success).toBe(true);
      // Verify sanitization was called
      const { sanitizeInput, sanitizeRichText } = require('../utils/sanitization');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.name);
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.address);
      expect(sanitizeRichText).toHaveBeenCalledWith(maliciousData.description);
    });
  });

  describe('get', () => {
    it('should return success with location data when location exists', async () => {
      const mockLocation = {
        id: 'location-1',
        name: 'Tamarindo Beach',
        parent_location_id: null,
        address: 'Tamarindo, Costa Rica',
        coordinates: null,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockLocation,
        error: null,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await get('location-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('location-1');
        expect(result.data.name).toBe('Tamarindo Beach');
      }
    });

    it('should return NOT_FOUND when location does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await get('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await get('location-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('update', () => {
    const updateData: UpdateLocationDTO = {
      name: 'Updated Beach',
      address: 'Updated Address',
    };

    it('should return success with updated location data when valid input provided', async () => {
      const mockUpdatedLocation = {
        id: 'location-1',
        name: 'Updated Beach',
        address: 'Updated Address',
        parent_location_id: null,
        coordinates: null,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockUpdatedLocation,
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await update('location-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Beach');
        expect(result.data.address).toBe('Updated Address');
      }
    });

    it('should return CIRCULAR_REFERENCE when trying to set self as parent', async () => {
      const locationId = '123e4567-e89b-12d3-a456-426614174000';
      const circularData = { parentLocationId: locationId };
      
      // Service checks if parentLocationId === id before any DB calls
      const result = await update(locationId, circularData);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Service returns CIRCULAR_REFERENCE for self-reference
        expect(result.error.code).toBe('CIRCULAR_REFERENCE');
        expect(result.error.message).toContain('cannot be its own parent');
      }
    });

    it('should return INVALID_PARENT when parent location does not exist', async () => {
      const invalidParentData = { parentLocationId: '123e4567-e89b-12d3-a456-426614174000' };

      // Mock parent location not found (get() call)
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await update('location-1', invalidParentData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PARENT');
      }
    });

    it('should return NOT_FOUND when location to update does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await update('nonexistent-id', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('deleteLocation', () => {
    it('should return success when location is deleted successfully', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: null,
      });
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteLocation('location-1');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: { message: 'Foreign key constraint violation' },
      });
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await deleteLocation('location-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should return success with paginated locations when valid filters provided', async () => {
      const mockLocations = [
        {
          id: 'location-1',
          name: 'Beach A',
          parent_location_id: null,
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'location-2',
          name: 'Beach B',
          parent_location_id: null,
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: mockLocations,
        error: null,
        count: 2,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockSelect = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: LocationFilterDTO = { page: 1, pageSize: 10 };
      const result = await list(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locations).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('should filter by parent location ID when provided', async () => {
      const filters: LocationFilterDTO = {
        parentLocationId: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        pageSize: 10,
      };

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockEq = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await list(filters);

      // Just verify the result is successful - the mock was called correctly
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locations).toEqual([]);
        expect(result.data.total).toBe(0);
      }
    });

    it('should filter for root locations when parentLocationId is null', async () => {
      const filters: LocationFilterDTO = {
        parentLocationId: null,
        page: 1,
        pageSize: 10,
      };

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockIs = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ is: mockIs });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await list(filters);

      expect(mockIs).toHaveBeenCalledWith('parent_location_id', null);
      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockSelect = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('search', () => {
    const searchParams: LocationSearchDTO = {
      query: 'beach',
      page: 1,
      pageSize: 10,
    };

    it('should return success with search results when valid query provided', async () => {
      const mockResults = [
        {
          id: 'location-1',
          name: 'Tamarindo Beach',
          parent_location_id: null,
          address: 'Beach address',
          coordinates: null,
          description: 'Beach description',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: mockResults,
        error: null,
        count: 1,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockOr = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ or: mockOr });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await search(searchParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locations).toHaveLength(1);
        expect(result.data.locations[0].name).toBe('Tamarindo Beach');
      }
    });

    it('should sanitize search query to prevent injection attacks', async () => {
      const maliciousSearch = {
        query: '<script>alert("xss")</script>beach',
        page: 1,
        pageSize: 10,
      };

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockOr = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ or: mockOr });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await search(maliciousSearch);

      // Verify sanitization was called
      const { sanitizeInput } = require('../utils/sanitization');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousSearch.query);
      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when query is empty', async () => {
      const invalidSearch = { ...searchParams, query: '' };
      const result = await search(invalidSearch);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('getHierarchy', () => {
    it('should return success with hierarchical location tree', async () => {
      const mockLocations = [
        {
          id: 'country-1',
          name: 'Costa Rica',
          parent_location_id: null,
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'province-1',
          name: 'Guanacaste',
          parent_location_id: 'country-1',
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'city-1',
          name: 'Tamarindo',
          parent_location_id: 'province-1',
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: mockLocations,
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getHierarchy();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1); // One root location
        expect(result.data[0].name).toBe('Costa Rica');
        expect(result.data[0].children).toHaveLength(1);
        expect(result.data[0].children[0].name).toBe('Guanacaste');
        expect(result.data[0].children[0].children).toHaveLength(1);
        expect(result.data[0].children[0].children[0].name).toBe('Tamarindo');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getHierarchy();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('getWithChildren', () => {
    it('should return success with location and its children', async () => {
      const parentId = 'country-1';
      
      // Mock get parent location (first call)
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'country-1',
          name: 'Costa Rica',
          parent_location_id: null,
          address: null,
          coordinates: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq });

      // Mock get all locations for hierarchy building (second call)
      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: [
          {
            id: 'country-1',
            name: 'Costa Rica',
            parent_location_id: null,
            address: null,
            coordinates: null,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'province-1',
            name: 'Guanacaste',
            parent_location_id: 'country-1',
            address: null,
            coordinates: null,
            description: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ order: mockOrder });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'locations') {
          callCount++;
          if (callCount === 1) {
            return { select: mockSelect1 };
          } else {
            return { select: mockSelect2 };
          }
        }
        return {};
      });

      const result = await getWithChildren(parentId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Costa Rica');
        expect(result.data.children).toHaveLength(1);
        expect(result.data.children[0].name).toBe('Guanacaste');
      }
    });

    it('should return NOT_FOUND when parent location does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await getWithChildren('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
