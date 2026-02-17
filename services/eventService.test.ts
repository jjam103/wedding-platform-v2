import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateEventDTO, UpdateEventDTO, EventFilterDTO, EventSearchDTO, ConflictCheckDTO } from '@/schemas/eventSchemas';

// Set environment variables FIRST
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock sanitization utilities
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input.trim()),
  sanitizeRichText: jest.fn((input: string) => input.trim()),
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
const eventServiceModule = require('./eventService');
const eventService = eventServiceModule;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  describe('create', () => {
    const validData: CreateEventDTO = {
      name: 'Wedding Ceremony',
      eventType: 'ceremony',
      startDate: '2025-06-15T14:00:00Z',
      endDate: '2025-06-15T15:00:00Z',
      locationId: '123e4567-e89b-12d3-a456-426614174000',
      description: 'Beautiful ceremony by the beach',
    };

    it('should return success with event data when valid input provided', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Wedding Ceremony',
        event_type: 'ceremony',
        start_date: '2025-06-15T14:00:00Z',
        end_date: '2025-06-15T15:00:00Z',
        location_id: validData.locationId,
        description: 'Beautiful ceremony by the beach',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock conflict check (no conflicts) - first call to from()
      // Mock event creation - second call to from()
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Conflict check query
          const mockEq = (jest.fn() as any).mockResolvedValue({
            data: [],
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        } else {
          // Insert query
          const mockSingle = (jest.fn() as any).mockResolvedValue({
            data: mockEvent,
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
          const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
          return { insert: mockInsert };
        }
      });

      const result = await eventService.create(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('event-1');
        expect(result.data.name).toBe('Wedding Ceremony');
        expect(result.data.eventType).toBe('ceremony');
        expect(result.data.locationId).toBe(validData.locationId);
      }
    });

    it('should return VALIDATION_ERROR when name is missing', async () => {
      const invalidData = { ...validData, name: '' };
      const result = await eventService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when eventType is invalid', async () => {
      const invalidData = { ...validData, eventType: 'invalid-type' as any };
      const result = await eventService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return SCHEDULING_CONFLICT when event conflicts with existing events', async () => {
      const conflictingEvent = {
        id: 'existing-event',
        name: 'Existing Event',
        start_date: '2025-06-15T13:30:00Z',
        end_date: '2025-06-15T14:30:00Z',
      };

      // Mock conflict check (conflict found)
      const mockEq = (jest.fn() as any).mockResolvedValue({
        data: [conflictingEvent],
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCHEDULING_CONFLICT');
        expect(result.error.details).toHaveLength(1);
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      // Mock conflict check (no conflicts) - first call
      // Mock database error - second call
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Conflict check query
          const mockEq = (jest.fn() as any).mockResolvedValue({
            data: [],
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        } else {
          // Insert query with error
          const mockSingle = (jest.fn() as any).mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' },
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
          const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
          return { insert: mockInsert };
        }
      });

      const result = await eventService.create(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        name: '<script>alert("xss")</script>Wedding',
        description: '<img src=x onerror=alert(1)>Description',
      };

      // Mock conflict check (no conflicts) - first call
      // Mock successful creation - second call
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Conflict check query
          const mockEq = (jest.fn() as any).mockResolvedValue({
            data: [],
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        } else {
          // Insert query
          const mockSingle = (jest.fn() as any).mockResolvedValue({
            data: {
              id: 'event-1',
              name: 'Wedding',
              description: 'Description',
            },
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
          const mockInsert = (jest.fn() as any).mockReturnValue({ select: mockSelect });
          return { insert: mockInsert };
        }
      });

      const result = await eventService.create(maliciousData);

      expect(result.success).toBe(true);
      
      // Verify sanitization was called
      const { sanitizeInput, sanitizeRichText } = require('../utils/sanitization');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousData.name);
      expect(sanitizeRichText).toHaveBeenCalledWith(maliciousData.description);
    });
  });

  describe('get', () => {
    it('should return success with event data when event exists', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Wedding Ceremony',
        event_type: 'ceremony',
        start_date: '2025-06-15T14:00:00Z',
        end_date: '2025-06-15T15:00:00Z',
        location_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Beautiful ceremony',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockEvent,
        error: null,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.get('event-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('event-1');
        expect(result.data.name).toBe('Wedding Ceremony');
        expect(result.data.eventType).toBe('ceremony');
      }
    });

    it('should return NOT_FOUND when event does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.get('nonexistent-id');

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

      const result = await eventService.get('event-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('update', () => {
    const updateData: UpdateEventDTO = {
      name: 'Updated Ceremony',
      description: 'Updated description',
    };

    it('should return success with updated event data when valid input provided', async () => {
      const mockUpdatedEvent = {
        id: 'event-1',
        name: 'Updated Ceremony',
        event_type: 'ceremony',
        start_date: '2025-06-15T14:00:00Z',
        end_date: '2025-06-15T15:00:00Z',
        location_id: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Updated description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: mockUpdatedEvent,
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await eventService.update('event-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Ceremony');
        expect(result.data.description).toBe('Updated description');
      }
    });

    it('should check for scheduling conflicts when location or dates are updated', async () => {
      const eventId = '123e4567-e89b-12d3-a456-426614174001'; // Valid UUID
      const updateWithLocation = {
        locationId: '223e4567-e89b-12d3-a456-426614174000', // Valid UUID
        startDate: '2025-06-15T16:00:00Z',
      };

      // Three separate calls to from():
      // 1. get() - fetch current event
      // 2. checkSchedulingConflicts() - check for conflicts
      // 3. update() - perform the update
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get current event: .from('events').select('*').eq('id', id).single()
          const mockSingle = (jest.fn() as any).mockResolvedValue({
            data: {
              id: eventId,
              name: 'Wedding Ceremony',
              event_type: 'ceremony',
              start_date: '2025-06-15T14:00:00Z',
              end_date: '2025-06-15T15:00:00Z',
              location_id: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Beautiful ceremony',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          });
          const mockEq = (jest.fn() as any).mockReturnValue({ single: mockSingle });
          const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        } else if (callCount === 2) {
          // Conflict check: .from('events').select(...).eq('location_id', ...).neq('id', ...)
          const mockNeq = (jest.fn() as any).mockResolvedValue({
            data: [],
            error: null,
          });
          const mockEq = (jest.fn() as any).mockReturnValue({ neq: mockNeq });
          const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { select: mockSelect };
        } else {
          // Update operation: .from('events').update(...).eq('id', ...).select().single()
          const mockSingle = (jest.fn() as any).mockResolvedValue({
            data: {
              id: eventId,
              name: 'Wedding Ceremony',
              location_id: '223e4567-e89b-12d3-a456-426614174000',
              start_date: '2025-06-15T16:00:00Z',
            },
            error: null,
          });
          const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
          const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
          const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
          return { update: mockUpdate };
        }
      });

      const result = await eventService.update(eventId, updateWithLocation);

      expect(result.success).toBe(true);
    });

    it('should return NOT_FOUND when event to update does not exist', async () => {
      const mockSingle = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ single: mockSingle });
      const mockEq = (jest.fn() as any).mockReturnValue({ select: mockSelect });
      const mockUpdate = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await eventService.update('nonexistent-id', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('deleteEvent', () => {
    it('should return success when event is deleted successfully', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: null,
      });
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await eventService.deleteEvent('event-1');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        error: { message: 'Foreign key constraint violation' },
      });
      const mockDelete = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ delete: mockDelete });

      const result = await eventService.deleteEvent('event-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('list', () => {
    it('should return success with paginated events when valid filters provided', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          name: 'Ceremony',
          event_type: 'ceremony',
          start_date: '2025-06-15T14:00:00Z',
          end_date: '2025-06-15T15:00:00Z',
          location_id: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'event-2',
          name: 'Reception',
          event_type: 'reception',
          start_date: '2025-06-15T18:00:00Z',
          end_date: '2025-06-15T23:00:00Z',
          location_id: null,
          description: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: mockEvents,
        error: null,
        count: 2,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockSelect = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: EventFilterDTO = { page: 1, pageSize: 10 };
      const result = await eventService.list(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it('should filter by event type when provided', async () => {
      const filters: EventFilterDTO = {
        eventType: 'ceremony',
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

      const result = await eventService.list(filters);

      expect(result.success).toBe(true);
    });

    it('should filter by date range when provided', async () => {
      const filters: EventFilterDTO = {
        startDateFrom: '2025-06-01T00:00:00Z',
        startDateTo: '2025-06-30T23:59:59Z',
        page: 1,
        pageSize: 10,
      };

      const mockRange = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });
      const mockOrder = (jest.fn() as any).mockReturnValue({ range: mockRange });
      const mockLte = (jest.fn() as any).mockReturnValue({ order: mockOrder });
      const mockGte = (jest.fn() as any).mockReturnValue({ lte: mockLte });
      const mockSelect = (jest.fn() as any).mockReturnValue({ gte: mockGte });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.list(filters);

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

      const result = await eventService.list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('search', () => {
    const searchParams: EventSearchDTO = {
      query: 'ceremony',
      page: 1,
      pageSize: 10,
    };

    it('should return success with search results when valid query provided', async () => {
      const mockResults = [
        {
          id: 'event-1',
          name: 'Wedding Ceremony',
          event_type: 'ceremony',
          start_date: '2025-06-15T14:00:00Z',
          end_date: '2025-06-15T15:00:00Z',
          location_id: null,
          description: 'Beautiful ceremony by the beach',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
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

      const result = await eventService.search(searchParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.events).toHaveLength(1);
        expect(result.data.events[0].name).toBe('Wedding Ceremony');
      }
    });

    it('should sanitize search query to prevent injection attacks', async () => {
      const maliciousSearch = {
        query: '<script>alert("xss")</script>ceremony',
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

      const result = await eventService.search(maliciousSearch);

      // Verify sanitization was called
      const { sanitizeInput } = require('../utils/sanitization');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousSearch.query);
      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when query is empty', async () => {
      const invalidSearch = { ...searchParams, query: '' };
      const result = await eventService.search(invalidSearch);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('checkSchedulingConflicts', () => {
    const conflictParams: ConflictCheckDTO = {
      locationId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: '2025-06-15T14:00:00Z',
      endDate: '2025-06-15T15:00:00Z',
    };

    it('should return success with no conflicts when no overlapping events exist', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.checkSchedulingConflicts(conflictParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasConflict).toBe(false);
        expect(result.data.conflictingEvents).toHaveLength(0);
      }
    });

    it('should return success with conflicts when overlapping events exist', async () => {
      const overlappingEvent = {
        id: 'existing-event',
        name: 'Existing Event',
        start_date: '2025-06-15T13:30:00Z',
        end_date: '2025-06-15T14:30:00Z',
      };

      const mockEq = (jest.fn() as any).mockResolvedValue({
        data: [overlappingEvent],
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.checkSchedulingConflicts(conflictParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasConflict).toBe(true);
        expect(result.data.conflictingEvents).toHaveLength(1);
        expect(result.data.conflictingEvents[0].id).toBe('existing-event');
        expect(result.data.conflictingEvents[0].name).toBe('Existing Event');
      }
    });

    it('should exclude specified event ID from conflict check', async () => {
      const paramsWithExclusion = {
        ...conflictParams,
        excludeEventId: '223e4567-e89b-12d3-a456-426614174001', // Valid UUID
      };

      const mockNeq = (jest.fn() as any).mockResolvedValue({
        data: [],
        error: null,
      });
      const mockEq = (jest.fn() as any).mockReturnValue({ neq: mockNeq });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.checkSchedulingConflicts(paramsWithExclusion);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasConflict).toBe(false);
      }
    });

    it('should handle events without end dates correctly', async () => {
      const eventWithoutEndDate = {
        id: 'point-event',
        name: 'Point Event',
        start_date: '2025-06-15T14:30:00Z',
        end_date: null,
      };

      const mockEq = (jest.fn() as any).mockResolvedValue({
        data: [eventWithoutEndDate],
        error: null,
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.checkSchedulingConflicts(conflictParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasConflict).toBe(true); // Should still detect overlap
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockEq = (jest.fn() as any).mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });
      const mockSelect = (jest.fn() as any).mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await eventService.checkSchedulingConflicts(conflictParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when locationId is invalid', async () => {
      const invalidParams = { ...conflictParams, locationId: 'invalid-uuid' };
      
      const result = await eventService.checkSchedulingConflicts(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});