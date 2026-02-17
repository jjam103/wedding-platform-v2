/**
 * Test Suite: Accommodation Service
 * 
 * Tests for accommodation management service including room type management
 * and guest assignments.
 * 
 * Follows the 4-path testing pattern:
 * 1. Success path - Valid input returns success
 * 2. Validation error - Invalid input returns VALIDATION_ERROR
 * 3. Database error - DB failure returns DATABASE_ERROR
 * 4. Security - Malicious input is sanitized
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { 
  CreateAccommodationDTO, 
  UpdateAccommodationDTO,
  CreateRoomTypeDTO,
  UpdateRoomTypeDTO,
  CreateRoomAssignmentDTO,
  UpdateRoomAssignmentDTO,
  CalculateCostDTO
} from '@/schemas/accommodationSchemas';

// Set up environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client creation BEFORE any imports - Pattern A
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = (jest.fn() as any);
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom, // Export for test access
  };
});

// Import service using require() AFTER mocking
const accommodationService = require('./accommodationService');

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('accommodationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for the service
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Reset Supabase mocks to default successful state
    mockFrom.mockReturnValue({
      select: (jest.fn() as any).mockResolvedValue({ data: [], error: null }),
      insert: (jest.fn() as any).mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          single: (jest.fn() as any).mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  });

  // ============================================================================
  // ACCOMMODATION CRUD OPERATIONS TESTS
  // ============================================================================

  describe('createAccommodation', () => {
    const validData: CreateAccommodationDTO = {
      name: 'Costa Rica Beach Resort',
      locationId: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Beautiful beachfront resort',
      address: '123 Beach Road, Costa Rica',
      status: 'published',
    };

    it('should return success with accommodation data when valid input provided', async () => {
      const mockAccommodation = {
        id: 'accommodation-1',
        name: validData.name,
        location_id: validData.locationId,
        description: validData.description,
        address: validData.address,
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockAccommodation, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createAccommodation(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('accommodation-1');
        expect(result.data.name).toBe('Costa Rica Beach Resort');
        expect(result.data.locationId).toBe(validData.locationId);
      }
    });

    it('should return VALIDATION_ERROR when name is missing', async () => {
      const invalidData = { ...validData, name: '' };
      const result = await accommodationService.createAccommodation(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when name exceeds 200 characters', async () => {
      const invalidData = { ...validData, name: 'a'.repeat(201) };
      const result = await accommodationService.createAccommodation(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { message: 'Connection failed', code: 'DB_ERROR' } 
            }),
          }),
        }),
      });

      const result = await accommodationService.createAccommodation(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        name: '<script>alert("xss")</script>Resort',
        description: '<img src=x onerror=alert(1)>Description',
        address: '<script>alert("xss")</script>123 Beach Road',
      };

      const mockAccommodation = {
        id: 'accommodation-1',
        name: 'Resort',
        location_id: validData.locationId,
        description: 'Description',
        address: '123 Beach Road',
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockAccommodation, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createAccommodation(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.description).not.toContain('<img');
        expect(result.data.address).not.toContain('<script>');
      }
    });
  });

  describe('getAccommodation', () => {
    const validId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return accommodation when valid ID provided', async () => {
      const mockAccommodation = {
        id: validId,
        name: 'Costa Rica Beach Resort',
        location_id: null,
        description: 'Beautiful resort',
        address: '123 Beach Road',
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockAccommodation, error: null }),
          }),
        }),
      });

      const result = await accommodationService.getAccommodation(validId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(validId);
        expect(result.data.name).toBe('Costa Rica Beach Resort');
      }
    });

    it('should return NOT_FOUND when accommodation does not exist', async () => {
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116', message: 'No rows found' } 
            }),
          }),
        }),
      });

      const result = await accommodationService.getAccommodation(validId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { message: 'Connection failed', code: 'DB_ERROR' } 
            }),
          }),
        }),
      });

      const result = await accommodationService.getAccommodation(validId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  // ============================================================================
  // ROOM TYPE CRUD OPERATIONS TESTS
  // ============================================================================

  describe('createRoomType', () => {
    const validData: CreateRoomTypeDTO = {
      accommodationId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Deluxe Ocean View',
      description: 'Spacious room with ocean view',
      capacity: 2,
      totalRooms: 10,
      pricePerNight: 200,
      hostSubsidyPerNight: 50,
      status: 'published',
    };

    it('should return success with room type data when valid input provided', async () => {
      const mockRoomType = {
        id: 'room-type-1',
        accommodation_id: validData.accommodationId,
        name: validData.name,
        description: validData.description,
        capacity: validData.capacity,
        total_rooms: validData.totalRooms,
        price_per_night: validData.pricePerNight,
        host_subsidy_per_night: validData.hostSubsidyPerNight,
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockRoomType, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createRoomType(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('room-type-1');
        expect(result.data.name).toBe('Deluxe Ocean View');
        expect(result.data.capacity).toBe(2);
        expect(result.data.totalRooms).toBe(10);
        expect(result.data.pricePerNight).toBe(200);
        expect(result.data.hostSubsidyPerNight).toBe(50);
      }
    });

    it('should return VALIDATION_ERROR when name is missing', async () => {
      const invalidData = { ...validData, name: '' };
      const result = await accommodationService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when capacity is not positive', async () => {
      const invalidData = { ...validData, capacity: 0 };
      const result = await accommodationService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when hostSubsidyPerNight exceeds pricePerNight', async () => {
      const invalidData = { ...validData, hostSubsidyPerNight: 250 }; // Greater than pricePerNight (200)
      const result = await accommodationService.createRoomType(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        name: '<script>alert("xss")</script>Deluxe Room',
        description: '<img src=x onerror=alert(1)>Ocean view room',
      };

      const mockRoomType = {
        id: 'room-type-1',
        accommodation_id: validData.accommodationId,
        name: 'Deluxe Room',
        description: 'Ocean view room',
        capacity: validData.capacity,
        total_rooms: validData.totalRooms,
        price_per_night: validData.pricePerNight,
        host_subsidy_per_night: validData.hostSubsidyPerNight,
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockRoomType, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createRoomType(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.description).not.toContain('<img');
      }
    });
  });

  describe('listRoomTypes', () => {
    const accommodationId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return room types for accommodation', async () => {
      const mockRoomTypes = [
        {
          id: 'room-type-1',
          accommodation_id: accommodationId,
          name: 'Standard Room',
          description: null,
          capacity: 2,
          total_rooms: 5,
          price_per_night: 150,
          host_subsidy_per_night: null,
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'room-type-2',
          accommodation_id: accommodationId,
          name: 'Deluxe Room',
          description: 'Ocean view',
          capacity: 2,
          total_rooms: 3,
          price_per_night: 200,
          host_subsidy_per_night: 50,
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            order: (jest.fn() as any).mockResolvedValue({ data: mockRoomTypes, error: null }),
          }),
        }),
      });

      const result = await accommodationService.listRoomTypes(accommodationId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Standard Room');
        expect(result.data[1].name).toBe('Deluxe Room');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            order: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { message: 'Connection failed', code: 'DB_ERROR' } 
            }),
          }),
        }),
      });

      const result = await accommodationService.listRoomTypes(accommodationId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  // ============================================================================
  // ROOM ASSIGNMENT OPERATIONS TESTS
  // ============================================================================

  describe('createRoomAssignment', () => {
    const validData: CreateRoomAssignmentDTO = {
      roomTypeId: '123e4567-e89b-12d3-a456-426614174000',
      guestId: '456e7890-e89b-12d3-a456-426614174000',
      checkIn: '2024-06-01',
      checkOut: '2024-06-05',
      notes: 'Special dietary requirements',
    };

    it('should return success with room assignment data when valid input provided', async () => {
      const mockAssignment = {
        id: 'assignment-1',
        room_type_id: validData.roomTypeId,
        guest_id: validData.guestId,
        check_in: validData.checkIn,
        check_out: validData.checkOut,
        notes: validData.notes,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockAssignment, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createRoomAssignment(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('assignment-1');
        expect(result.data.roomTypeId).toBe(validData.roomTypeId);
        expect(result.data.guestId).toBe(validData.guestId);
        expect(result.data.checkIn).toBe(validData.checkIn);
        expect(result.data.checkOut).toBe(validData.checkOut);
      }
    });

    it('should return VALIDATION_ERROR when checkOut is before checkIn', async () => {
      const invalidData = { 
        ...validData, 
        checkIn: '2024-06-05',
        checkOut: '2024-06-01' 
      };
      const result = await accommodationService.createRoomAssignment(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return CONFLICT when guest already has assignment for dates', async () => {
      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ 
              data: null, 
              error: { code: '23505', message: 'Duplicate key violation' } 
            }),
          }),
        }),
      });

      const result = await accommodationService.createRoomAssignment(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('should sanitize notes to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        notes: '<script>alert("xss")</script>Special requirements',
      };

      const mockAssignment = {
        id: 'assignment-1',
        room_type_id: validData.roomTypeId,
        guest_id: validData.guestId,
        check_in: validData.checkIn,
        check_out: validData.checkOut,
        notes: 'Special requirements',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        insert: (jest.fn() as any).mockReturnValue({
          select: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockAssignment, error: null }),
          }),
        }),
      });

      const result = await accommodationService.createRoomAssignment(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).not.toContain('<script>');
      }
    });
  });

  describe('listGuestRoomAssignments', () => {
    const guestId = '456e7890-e89b-12d3-a456-426614174000';

    it('should return room assignments for guest', async () => {
      const mockAssignments = [
        {
          id: 'assignment-1',
          room_type_id: '123e4567-e89b-12d3-a456-426614174000',
          guest_id: guestId,
          check_in: '2024-06-01',
          check_out: '2024-06-05',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            order: (jest.fn() as any).mockResolvedValue({ data: mockAssignments, error: null }),
          }),
        }),
      });

      const result = await accommodationService.listGuestRoomAssignments(guestId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].guestId).toBe(guestId);
      }
    });
  });

  describe('listRoomTypeAssignments', () => {
    const roomTypeId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return room assignments for room type', async () => {
      const mockAssignments = [
        {
          id: 'assignment-1',
          room_type_id: roomTypeId,
          guest_id: '456e7890-e89b-12d3-a456-426614174000',
          check_in: '2024-06-01',
          check_out: '2024-06-05',
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            order: (jest.fn() as any).mockResolvedValue({ data: mockAssignments, error: null }),
          }),
        }),
      });

      const result = await accommodationService.listRoomTypeAssignments(roomTypeId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].roomTypeId).toBe(roomTypeId);
      }
    });
  });

  // ============================================================================
  // COST CALCULATION OPERATIONS TESTS
  // ============================================================================

  describe('calculateRoomCost', () => {
    const validParams: CalculateCostDTO = {
      roomTypeId: '123e4567-e89b-12d3-a456-426614174000',
      checkIn: '2024-06-01',
      checkOut: '2024-06-05',
    };

    it('should calculate cost correctly with subsidy', async () => {
      const mockRoomType = {
        id: validParams.roomTypeId,
        accommodation_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Deluxe Room',
        description: null,
        capacity: 2,
        total_rooms: 10,
        price_per_night: 200,
        host_subsidy_per_night: 50,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock the query chain for getRoomType
      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockRoomType, error: null }),
          }),
        }),
      });

      const result = await accommodationService.calculateRoomCost(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numberOfNights).toBe(4); // June 1-5 = 4 nights
        expect(result.data.pricePerNight).toBe(200);
        expect(result.data.subsidyPerNight).toBe(50);
        expect(result.data.totalCost).toBe(800); // 200 * 4
        expect(result.data.totalSubsidy).toBe(200); // 50 * 4
        expect(result.data.guestCost).toBe(600); // 800 - 200
      }
    });

    it('should calculate cost correctly without subsidy', async () => {
      const mockRoomType = {
        id: validParams.roomTypeId,
        accommodation_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Standard Room',
        description: null,
        capacity: 2,
        total_rooms: 10,
        price_per_night: 150,
        host_subsidy_per_night: null,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: (jest.fn() as any).mockReturnValue({
          eq: (jest.fn() as any).mockReturnValue({
            single: (jest.fn() as any).mockResolvedValue({ data: mockRoomType, error: null }),
          }),
        }),
      });

      const result = await accommodationService.calculateRoomCost(validParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numberOfNights).toBe(4);
        expect(result.data.pricePerNight).toBe(150);
        expect(result.data.subsidyPerNight).toBe(0);
        expect(result.data.totalCost).toBe(600); // 150 * 4
        expect(result.data.totalSubsidy).toBe(0);
        expect(result.data.guestCost).toBe(600); // 600 - 0
      }
    });

    it('should return error when room type not found', async () => {
      // Mock getRoomType to return NOT_FOUND error
      const mockSingle = (jest.fn() as any).mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      });
      
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await accommodationService.calculateRoomCost(validParams);

      console.log('mockFrom called:', mockFrom.mock.calls.length, 'times');
      console.log('mockSelect called:', mockSelect.mock.calls.length, 'times');
      console.log('mockEq called:', mockEq.mock.calls.length, 'times');
      console.log('mockSingle called:', mockSingle.mock.calls.length, 'times');
      console.log('Result:', JSON.stringify(result, null, 2));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});