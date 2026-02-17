import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateRSVPDTO, UpdateRSVPDTO, ListRSVPsDTO } from '@/schemas/rsvpSchemas';

// Set environment variables FIRST
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock sanitization utilities
jest.mock('@/utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input.trim()),
}));

// Mock types and error codes
jest.mock('@/types', () => ({
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  },
}));

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

// Import service using require() AFTER mocking (Pattern A requirement)
const rsvpServiceModule = require('./rsvpService');
const rsvpService = rsvpServiceModule;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('rsvpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('create', () => {
    const validData: CreateRSVPDTO = {
      guest_id: '123e4567-e89b-12d3-a456-426614174000',
      event_id: '123e4567-e89b-12d3-a456-426614174001',
      status: 'attending',
      guest_count: 2,
      dietary_notes: 'Vegetarian',
      special_requirements: 'Wheelchair accessible',
      notes: 'Looking forward to it!',
    };

    it('should return success with RSVP data when valid input provided', async () => {
      const mockRSVP = {
        id: 'rsvp-1',
        guest_id: validData.guest_id,
        event_id: validData.event_id,
        activity_id: null,
        status: 'attending',
        guest_count: 2,
        dietary_notes: 'Vegetarian',
        special_requirements: 'Wheelchair accessible',
        notes: 'Looking forward to it!',
        responded_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockRSVP,
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('rsvp-1');
        expect(result.data.guest_id).toBe(validData.guest_id);
        expect(result.data.status).toBe('attending');
        expect(result.data.guest_count).toBe(2);
      }
    });

    it('should return VALIDATION_ERROR when guest_id is missing', async () => {
      const invalidData = { ...validData, guest_id: '' };
      const result = await rsvpService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when both event_id and activity_id are provided', async () => {
      const invalidData = { 
        ...validData, 
        activity_id: '123e4567-e89b-12d3-a456-426614174002' 
      };
      const result = await rsvpService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when neither event_id nor activity_id are provided', async () => {
      const invalidData = { ...validData };
      delete invalidData.event_id;
      const result = await rsvpService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DUPLICATE_ENTRY when RSVP already exists', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DUPLICATE_ENTRY');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        dietary_notes: '<script>alert("xss")</script>Vegetarian',
        special_requirements: '<img src=x onerror=alert(1)>Wheelchair',
        notes: '<svg onload=alert(1)>Notes',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'rsvp-1',
          dietary_notes: 'Vegetarian',
          special_requirements: 'Wheelchair',
          notes: 'Notes',
        },
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(maliciousData);

      expect(result.success).toBe(true);
      
      // Verify sanitization was called
      const { sanitizeInput } = require('@/utils/sanitization');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.dietary_notes);
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.special_requirements);
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.notes);
    });

    it('should set responded_at when status is not pending', async () => {
      const attendingData = { ...validData, status: 'attending' as const };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'rsvp-1',
          status: 'attending',
          responded_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(attendingData);

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'attending',
          responded_at: expect.any(String),
        })
      );
    });

    it('should not set responded_at when status is pending', async () => {
      const pendingData = { ...validData, status: 'pending' as const };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'rsvp-1',
          status: 'pending',
          responded_at: null,
        },
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      (mockFrom as any).mockReturnValue({ insert: mockInsert });

      const result = await rsvpService.create(pendingData);

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          responded_at: undefined,
        })
      );
    });
  });

  describe('get', () => {
    it('should return success with RSVP data when RSVP exists', async () => {
      const mockRSVP = {
        id: 'rsvp-1',
        guest_id: '123e4567-e89b-12d3-a456-426614174000',
        event_id: '123e4567-e89b-12d3-a456-426614174001',
        activity_id: null,
        status: 'attending',
        guest_count: 1,
        dietary_notes: null,
        special_requirements: null,
        notes: null,
        responded_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockRSVP,
        error: null,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.get('rsvp-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('rsvp-1');
        expect(result.data.status).toBe('attending');
      }
    });

    it('should return NOT_FOUND when RSVP does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      } as any);
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.get('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      } as any);
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.get('rsvp-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('update', () => {
    const updateData: UpdateRSVPDTO = {
      status: 'declined',
      dietary_notes: 'No dietary restrictions',
      notes: 'Cannot attend due to conflict',
    };

    it('should return success with updated RSVP data when valid input provided', async () => {
      const mockUpdatedRSVP = {
        id: 'rsvp-1',
        guest_id: '123e4567-e89b-12d3-a456-426614174000',
        event_id: '123e4567-e89b-12d3-a456-426614174001',
        activity_id: null,
        status: 'declined',
        guest_count: 1,
        dietary_notes: 'No dietary restrictions',
        special_requirements: null,
        notes: 'Cannot attend due to conflict',
        responded_at: '2024-01-02T12:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockUpdatedRSVP,
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.update('rsvp-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('declined');
        expect(result.data.dietary_notes).toBe('No dietary restrictions');
        expect(result.data.notes).toBe('Cannot attend due to conflict');
      }
    });

    it('should set responded_at when status changes from pending', async () => {
      const statusUpdate = { status: 'attending' as const };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: {
          id: 'rsvp-1',
          status: 'attending',
          responded_at: '2024-01-02T12:00:00Z',
        },
        error: null,
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.update('rsvp-1', statusUpdate);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'attending',
          responded_at: expect.any(String),
        })
      );
    });

    it('should return NOT_FOUND when RSVP to update does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.update('nonexistent-id', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      } as any);
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ update: mockUpdate });

      const result = await rsvpService.update('rsvp-1', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('deleteRSVP', () => {
    it('should return success when RSVP is deleted successfully', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: null,
      });
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ delete: mockDelete });

      const result = await rsvpService.deleteRSVP('rsvp-1');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: { message: 'Delete failed' },
      } as any);
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ delete: mockDelete });

      const result = await rsvpService.deleteRSVP('rsvp-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should return success with paginated RSVPs when valid filters provided', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guest_id: '123e4567-e89b-12d3-a456-426614174000',
          event_id: '123e4567-e89b-12d3-a456-426614174001',
          activity_id: null,
          status: 'attending',
          guest_count: 1,
          dietary_notes: null,
          special_requirements: null,
          notes: null,
          responded_at: '2024-01-01T12:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'rsvp-2',
          guest_id: '123e4567-e89b-12d3-a456-426614174002',
          event_id: '123e4567-e89b-12d3-a456-426614174001',
          activity_id: null,
          status: 'declined',
          guest_count: 1,
          dietary_notes: null,
          special_requirements: null,
          notes: 'Cannot attend',
          responded_at: '2024-01-02T12:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
        count: 2,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ range: mockRange });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const filters: Partial<ListRSVPsDTO> = { page: 1, page_size: 10 };
      const result = await rsvpService.list(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rsvps).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }
    });

    it('should filter by guest_id when provided', async () => {
      const filters: Partial<ListRSVPsDTO> = {
        guest_id: '123e4567-e89b-12d3-a456-426614174000',
        page: 1,
        page_size: 10,
      };

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockEq = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.list(filters);

      expect(mockEq).toHaveBeenCalledWith('guest_id', '123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
    });

    it('should filter by status when provided', async () => {
      const filters: Partial<ListRSVPsDTO> = {
        status: 'attending',
        page: 1,
        page_size: 10,
      };

      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockRange = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockEq = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.list(filters);

      expect(mockEq).toHaveBeenCalledWith('status', 'attending');
      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockOrder = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      } as any);
      const mockRange = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockSelect = (jest.fn() as any).mockReturnValue({ range: mockRange });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('calculateActivityCapacity', () => {
    it('should return success with capacity information when activity exists', async () => {
      const mockActivity = {
        capacity: 50,
        name: 'Beach Volleyball',
      };

      const mockRSVPs = [
        { guest_count: 2 },
        { guest_count: 3 },
        { guest_count: 1 },
      ];

      // Mock activity query (first call)
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });

      // Mock RSVPs query (second call)
      const mockEq3 = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEq2 = (jest.fn() as any).mockReturnValue({ eq: mockEq3 });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ eq: mockEq2 });

      let callCount = 0;
      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelect1 };
        } else if (table === 'rsvps') {
          return { select: mockSelect2 };
        }
        return {};
      });

      const result = await rsvpService.calculateActivityCapacity('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBe(50);
        expect(result.data.attending_count).toBe(6); // 2 + 3 + 1
        expect(result.data.available).toBe(44); // 50 - 6
      }
    });

    it('should handle activities with no capacity limit', async () => {
      const mockActivity = {
        capacity: null,
        name: 'Open Activity',
      };

      const mockRSVPs = [
        { guest_count: 5 },
        { guest_count: 3 },
      ];

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });

      // Mock RSVPs query
      const mockEq3 = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEq2 = (jest.fn() as any).mockReturnValue({ eq: mockEq3 });
      const mockSelect2 = (jest.fn() as any).mockReturnValue({ eq: mockEq2 });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelect1 };
        } else if (table === 'rsvps') {
          return { select: mockSelect2 };
        }
        return {};
      });

      const result = await rsvpService.calculateActivityCapacity('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBeNull();
        expect(result.data.attending_count).toBe(8); // 5 + 3
        expect(result.data.available).toBeNull();
      }
    });

    it('should return DATABASE_ERROR when activity query fails', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Activity not found' },
      } as any);
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      (mockFrom as any).mockReturnValue({ select: mockSelect });

      const result = await rsvpService.calculateActivityCapacity('nonexistent-activity');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('generateCapacityAlerts', () => {
    it('should return success with alerts for activities approaching capacity', async () => {
      const mockActivities = [
        { id: 'activity-1', name: 'Beach Volleyball', capacity: 10 },
        { id: 'activity-2', name: 'Snorkeling', capacity: 20 },
      ];

      // Mock activities query (first call)
      // Query: await supabase.from('activities').select('id, name, capacity').not('capacity', 'is', null).eq('status', 'published')
      // The final .eq() must return a Promise that resolves to { data, error }
      const mockEq2 = (jest.fn() as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockImplementation(() => mockEq2()); // Call mockEq2 to get the promise
      const mockNot = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ not: mockNot });

      // For calculateActivityCapacity calls, we need to mock multiple sequences
      // Activity 1: 9/10 (90% - warning)
      const mockSingle1 = (jest.fn() as any).mockResolvedValue({
        data: { capacity: 10, name: 'Beach Volleyball' },
        error: null,
      } as any);
      const mockEqA1 = (jest.fn() as any).mockReturnValue({ single: mockSingle1 });
      const mockSelectA1 = (jest.fn() as any).mockReturnValue({ eq: mockEqA1 });

      const mockEqR1b = (jest.fn() as any).mockResolvedValue({
        data: [{ guest_count: 4 }, { guest_count: 3 }, { guest_count: 2 }],
        error: null,
      } as any);
      const mockEqR1a = (jest.fn() as any).mockReturnValue({ eq: mockEqR1b });
      const mockSelectR1 = (jest.fn() as any).mockReturnValue({ eq: mockEqR1a });

      // Activity 2: 20/20 (100% - full)
      const mockSingle2 = (jest.fn() as any).mockResolvedValue({
        data: { capacity: 20, name: 'Snorkeling' },
        error: null,
      } as any);
      const mockEqA2 = (jest.fn() as any).mockReturnValue({ single: mockSingle2 });
      const mockSelectA2 = (jest.fn() as any).mockReturnValue({ eq: mockEqA2 });

      const mockEqR2b = (jest.fn() as any).mockResolvedValue({
        data: Array(20).fill({ guest_count: 1 }),
        error: null,
      });
      const mockEqR2a = (jest.fn() as any).mockReturnValue({ eq: mockEqR2b });
      const mockSelectR2 = (jest.fn() as any).mockReturnValue({ eq: mockEqR2a });

      let callCount = 0;
      (mockFrom as any).mockImplementation((table: string) => {
        callCount++;
        if (table === 'activities' && callCount === 1) {
          return { select: mockSelect1 };
        } else if (table === 'activities' && callCount === 2) {
          return { select: mockSelectA1 };
        } else if (table === 'rsvps' && callCount === 3) {
          return { select: mockSelectR1 };
        } else if (table === 'activities' && callCount === 4) {
          return { select: mockSelectA2 };
        } else if (table === 'rsvps' && callCount === 5) {
          return { select: mockSelectR2 };
        }
        return {};
      });

      const result = await rsvpService.generateCapacityAlerts(0.9);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        
        const warningAlert = result.data.find((alert: any) => alert.alert_level === 'warning');
        expect(warningAlert).toBeDefined();
        expect(warningAlert?.activity_name).toBe('Beach Volleyball');
        expect(warningAlert?.utilization_percentage).toBe(90);

        const fullAlert = result.data.find((alert: any) => alert.alert_level === 'full');
        expect(fullAlert).toBeDefined();
        expect(fullAlert?.activity_name).toBe('Snorkeling');
        expect(fullAlert?.utilization_percentage).toBe(100);
      }
    });

    it('should return empty array when no activities exceed threshold', async () => {
      const mockActivities = [
        { id: 'activity-1', name: 'Beach Volleyball', capacity: 10 },
      ];

      // Mock activities query
      const mockEq2 = (jest.fn() as any).mockResolvedValue({
        data: mockActivities,
        error: null,
      });
      const mockEq1 = (jest.fn() as any).mockImplementation(() => mockEq2()); // Call mockEq2 to get the promise
      const mockNot = (jest.fn() as any).mockReturnValue({ eq: mockEq1 });
      const mockSelect1 = (jest.fn() as any).mockReturnValue({ not: mockNot });

      // Mock capacity calculation - only 5/10 (50%)
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: { capacity: 10, name: 'Beach Volleyball' },
        error: null,
      } as any);
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: [{ guest_count: 5 }],
        error: null,
      } as any);
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      let callCount = 0;
      (mockFrom as any).mockImplementation((table: string) => {
        callCount++;
        if (table === 'activities' && callCount === 1) {
          return { select: mockSelect1 };
        } else if (table === 'activities' && callCount === 2) {
          return { select: mockSelectA };
        } else if (table === 'rsvps' && callCount === 3) {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.generateCapacityAlerts(0.9);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe('checkCapacityAvailable', () => {
    it('should return available true when capacity is sufficient', async () => {
      const mockActivity = { capacity: 10, name: 'Activity' };
      const mockRSVPs = [{ guest_count: 5 }]; // 5 attending, 5 available

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.checkCapacityAvailable('activity-1', 3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
        expect(result.data.message).toContain('5 spots remaining');
      }
    });

    it('should return available false when capacity would be exceeded', async () => {
      const mockActivity = { capacity: 10, name: 'Activity' };
      const mockRSVPs = [{ guest_count: 8 }]; // 8 attending, 2 available

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.checkCapacityAvailable('activity-1', 5);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(false);
        expect(result.data.message).toContain('cannot add 5 more guest(s)');
      }
    });

    it('should return available true when no capacity limit is set', async () => {
      const mockActivity = { capacity: null, name: 'Open Activity' };
      const mockRSVPs = [{ guest_count: 100 }];

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.checkCapacityAvailable('activity-1', 50);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toBe(true);
        expect(result.data.message).toContain('No capacity limit');
      }
    });
  });

  describe('enforceCapacityLimit', () => {
    it('should return success when capacity limit is not exceeded', async () => {
      const mockActivity = { capacity: 10, name: 'Activity' };
      const mockRSVPs = [{ guest_count: 5 }]; // 5 attending

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.enforceCapacityLimit('activity-1', 3);

      expect(result.success).toBe(true);
    });

    it('should return CAPACITY_EXCEEDED when limit would be exceeded', async () => {
      const mockActivity = { capacity: 10, name: 'Activity' };
      const mockRSVPs = [{ guest_count: 8 }]; // 8 attending

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.enforceCapacityLimit('activity-1', 5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAPACITY_EXCEEDED');
        expect(result.error.message).toContain('13/10');
      }
    });

    it('should account for existing RSVP when updating', async () => {
      const mockActivity = { capacity: 10, name: 'Activity' };
      const mockRSVPs = [{ guest_count: 8 }]; // 8 attending
      const mockExistingRSVP = { guest_count: 3, status: 'attending' };

      // Mock activity query (first call)
      const mockSingle1 = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle1 });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query (second call)
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      // Mock existing RSVP query (third call)
      const mockSingle2 = (jest.fn() as any).mockResolvedValue({
        data: mockExistingRSVP,
        error: null,
      });
      const mockEqE = (jest.fn() as any).mockReturnValue({ single: mockSingle2 });
      const mockSelectE = (jest.fn() as any).mockReturnValue({ eq: mockEqE });

      let callCount = 0;
      (mockFrom as any).mockImplementation((table: string) => {
        callCount++;
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps' && callCount === 2) {
          return { select: mockSelectR };
        } else if (table === 'rsvps' && callCount === 3) {
          return { select: mockSelectE };
        }
        return {};
      });

      // New total: 8 - 3 + 4 = 9 (within limit)
      const result = await rsvpService.enforceCapacityLimit('activity-1', 4, 'existing-rsvp-id');

      expect(result.success).toBe(true);
    });

    it('should return success when no capacity limit is set', async () => {
      const mockActivity = { capacity: null, name: 'Open Activity' };
      const mockRSVPs = [{ guest_count: 100 }];

      // Mock activity query
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockActivity,
        error: null,
      });
      const mockEqA = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelectA = (jest.fn() as any).mockReturnValue({ eq: mockEqA });

      // Mock RSVPs query
      const mockEqRb = (jest.fn() as any).mockResolvedValue({
        data: mockRSVPs,
        error: null,
      });
      const mockEqRa = (jest.fn() as any).mockReturnValue({ eq: mockEqRb });
      const mockSelectR = (jest.fn() as any).mockReturnValue({ eq: mockEqRa });

      (mockFrom as any).mockImplementation((table: string) => {
        if (table === 'activities') {
          return { select: mockSelectA };
        } else if (table === 'rsvps') {
          return { select: mockSelectR };
        }
        return {};
      });

      const result = await rsvpService.enforceCapacityLimit('activity-1', 50);

      expect(result.success).toBe(true);
    });
  });
});