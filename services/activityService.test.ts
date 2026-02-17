/**
 * Test Suite: Activity Service
 * 
 * Tests for activity management service including capacity management
 * and RSVP operations integration.
 * 
 * Follows the 4-path testing pattern:
 * 1. Success path - Valid input returns success
 * 2. Validation error - Invalid input returns VALIDATION_ERROR
 * 3. Database error - DB failure returns DATABASE_ERROR
 * 4. Security - Malicious input is sanitized
 */

import * as activityService from './activityService';
import { createMockSupabaseClient, createMockBuilder } from '../__tests__/helpers/mockSupabase';
import type { MockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: (jest.fn() as any),
}));

describe('activityService', () => {
  let mockSupabase: MockSupabaseClient;
  let mockBuilder: ReturnType<typeof createMockBuilder>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockBuilder = createMockBuilder(mockSupabase);
    
    // Mock createClient to return our mock
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validActivityData = {
      name: 'Beach Volleyball',
      activityType: 'activity',
      startTime: '2025-06-15T10:00:00Z',
      capacity: 20,
      costPerPerson: 50,
      hostSubsidy: 10,
    };

    it('should return success with activity data when valid input provided', async () => {
      const expectedActivity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
        capacity: 20,
        cost_per_person: 50,
        host_subsidy: 10,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockBuilder.mockInsert('activities', expectedActivity);

      const result = await activityService.create(validActivityData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('activity-1');
        expect(result.data.name).toBe('Beach Volleyball');
        expect(result.data.activityType).toBe('activity');
        expect(result.data.capacity).toBe(20);
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should return VALIDATION_ERROR when required fields are missing', async () => {
      const invalidData = {
        name: '',
        activityType: 'activity',
        startTime: '2025-06-15T10:00:00Z',
      };

      const result = await activityService.create(invalidData as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Validation failed');
        expect(result.error.details).toBeDefined();
      }
    });

    it('should return VALIDATION_ERROR when end time is before start time', async () => {
      const invalidData = {
        ...validActivityData,
        startTime: '2025-06-15T10:00:00Z',
        endTime: '2025-06-15T09:00:00Z', // Before start time
      };

      const result = await activityService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      mockBuilder.mockDatabaseError('Connection failed');

      const result = await activityService.create(validActivityData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection failed');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validActivityData,
        name: '<script>alert("xss")</script>Beach Volleyball',
        description: '<img src=x onerror=alert(1)>Fun activity',
      };

      const sanitizedActivity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        description: 'Fun activity',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
        capacity: 20,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockBuilder.mockInsert('activities', sanitizedActivity);

      const result = await activityService.create(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.name).not.toContain('alert');
        expect(result.data.description).not.toContain('<img');
        expect(result.data.description).not.toContain('onerror');
      }
    });
  });

  describe('get', () => {
    it('should return success with activity data when activity exists', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
        capacity: 20,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockBuilder.mockSelectSingle('activities', activityData);

      const result = await activityService.get('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('activity-1');
        expect(result.data.name).toBe('Beach Volleyball');
        expect(result.data.activityType).toBe('activity');
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'activity-1');
    });

    it('should return NOT_FOUND when activity does not exist', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      mockBuilder.mockSelectSingle('activities', null, error);

      const result = await activityService.get('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Activity not found');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      const error = { message: 'Connection timeout', code: 'DATABASE_ERROR' };
      mockBuilder.mockSelectSingle('activities', null, error);

      const result = await activityService.get('activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection timeout');
      }
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Beach Volleyball',
      capacity: 25,
    };

    it('should return success with updated activity data when valid input provided', async () => {
      const updatedActivity = {
        id: 'activity-1',
        name: 'Updated Beach Volleyball',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
        capacity: 25,
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockBuilder.mockUpdate('activities', updatedActivity);

      const result = await activityService.update('activity-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Beach Volleyball');
        expect(result.data.capacity).toBe(25);
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'activity-1');
    });

    it('should return NOT_FOUND when activity does not exist', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      mockBuilder.mockUpdate('activities', null, error);

      const result = await activityService.update('nonexistent-id', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Activity not found');
      }
    });

    it('should return VALIDATION_ERROR when update data is invalid', async () => {
      const invalidData = {
        capacity: -5, // Negative capacity
      };

      const result = await activityService.update('activity-1', invalidData as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should sanitize input to prevent XSS attacks', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Updated Activity',
        description: 'javascript:alert(1)',
      };

      const sanitizedActivity = {
        id: 'activity-1',
        name: 'Updated Activity',
        description: 'javascriptalert1',
        activity_type: 'activity',
        updated_at: '2024-01-01T01:00:00Z',
      };

      mockBuilder.mockUpdate('activities', sanitizedActivity);

      const result = await activityService.update('activity-1', maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).not.toContain('<script>');
        expect(result.data.name).not.toContain('alert');
        expect(result.data.description).not.toContain('javascript:');
      }
    });
  });

  describe('deleteActivity', () => {
    it('should return success when activity is deleted successfully', async () => {
      mockBuilder.mockDelete('activities');

      const result = await activityService.deleteActivity('activity-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'activity-1');
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      mockBuilder.mockDatabaseError('Foreign key constraint violation');

      const result = await activityService.deleteActivity('activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Foreign key constraint violation');
      }
    });
  });

  describe('list', () => {
    const mockActivities = [
      {
        id: 'activity-1',
        name: 'Beach Volleyball',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
        capacity: 20,
      },
      {
        id: 'activity-2',
        name: 'Sunset Dinner',
        activity_type: 'meal',
        start_time: '2025-06-15T18:00:00Z',
        capacity: 50,
      },
    ];

    it('should return success with paginated activities when no filters provided', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValue({
        data: mockActivities,
        error: null,
        count: 2,
      });

      const result = await activityService.list();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
        expect(result.data.totalPages).toBe(1);
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
    });

    it('should return success with filtered activities when filters provided', async () => {
      const filters = {
        eventId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        activityType: 'activity',
        status: 'published' as const,
        page: 1,
        pageSize: 10,
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValue({
        data: [mockActivities[0]],
        error: null,
        count: 1,
      });

      const result = await activityService.list(filters);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(1);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
      }
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', '123e4567-e89b-12d3-a456-426614174000');
      expect(mockSupabase.eq).toHaveBeenCalledWith('activity_type', 'activity');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'published');
    });

    it('should return VALIDATION_ERROR when invalid filters provided', async () => {
      const invalidFilters = {
        page: -1, // Invalid page number
        pageSize: 200, // Exceeds maximum
      };

      const result = await activityService.list(invalidFilters);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const error = { message: 'Query timeout', code: 'DATABASE_ERROR' };
      
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValue({
        data: null,
        error,
        count: null,
      });

      const result = await activityService.list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Query timeout');
      }
    });
  });

  describe('search', () => {
    const mockSearchResults = [
      {
        id: 'activity-1',
        name: 'Beach Volleyball',
        description: 'Fun beach activity',
        activity_type: 'activity',
        start_time: '2025-06-15T10:00:00Z',
      },
    ];

    it('should return success with search results when valid query provided', async () => {
      const searchParams = {
        query: 'beach',
        page: 1,
        pageSize: 20,
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.or.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValue({
        data: mockSearchResults,
        error: null,
        count: 1,
      });

      const result = await activityService.search(searchParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activities).toHaveLength(1);
        expect(result.data.activities[0].name).toBe('Beach Volleyball');
      }
      expect(mockSupabase.or).toHaveBeenCalledWith('name.ilike.%beach%,description.ilike.%beach%');
    });

    it('should return VALIDATION_ERROR when query is empty', async () => {
      const invalidParams = {
        query: '',
      };

      const result = await activityService.search(invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should sanitize search query to prevent injection attacks', async () => {
      const maliciousParams = {
        query: '<script>alert("xss")</script>',
      };

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.or.mockReturnValue(mockSupabase);
      mockSupabase.order.mockReturnValue(mockSupabase);
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await activityService.search(maliciousParams);

      expect(result.success).toBe(true);
      // Verify the query was sanitized (no script tags in the database query)
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.not.stringContaining('<script>')
      );
    });
  });

  describe('getCapacityInfo - Capacity Management', () => {
    it('should return success with capacity information when activity exists', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 20,
      };

      // Mock activity query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activityData,
        error: null,
      });

      // Mock RSVP count query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        count: 15,
        error: null,
      });

      const result = await activityService.getCapacityInfo('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activityId).toBe('activity-1');
        expect(result.data.activityName).toBe('Beach Volleyball');
        expect(result.data.capacity).toBe(20);
        expect(result.data.currentAttendees).toBe(15);
        expect(result.data.availableSpots).toBe(5);
        expect(result.data.utilizationPercentage).toBe(75);
        expect(result.data.isNearCapacity).toBe(false);
        expect(result.data.isAtCapacity).toBe(false);
      }
    });

    it('should return capacity info with near capacity warning when utilization >= 90%', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 20,
      };

      // Mock activity query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activityData,
        error: null,
      });

      // Mock RSVP count query - 18 attendees (90% capacity)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        count: 18,
        error: null,
      });

      const result = await activityService.getCapacityInfo('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAttendees).toBe(18);
        expect(result.data.availableSpots).toBe(2);
        expect(result.data.utilizationPercentage).toBe(90);
        expect(result.data.isNearCapacity).toBe(true);
        expect(result.data.isAtCapacity).toBe(false);
      }
    });

    it('should return capacity info with at capacity alert when utilization >= 100%', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 20,
      };

      // Mock activity query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activityData,
        error: null,
      });

      // Mock RSVP count query - 20 attendees (100% capacity)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        count: 20,
        error: null,
      });

      const result = await activityService.getCapacityInfo('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAttendees).toBe(20);
        expect(result.data.availableSpots).toBe(0);
        expect(result.data.utilizationPercentage).toBe(100);
        expect(result.data.isNearCapacity).toBe(true);
        expect(result.data.isAtCapacity).toBe(true);
      }
    });

    it('should handle activities with no capacity limit', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: null, // No capacity limit
      };

      // Mock activity query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activityData,
        error: null,
      });

      // Mock RSVP count query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        count: 50,
        error: null,
      });

      const result = await activityService.getCapacityInfo('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity).toBeNull();
        expect(result.data.currentAttendees).toBe(50);
        expect(result.data.availableSpots).toBeNull();
        expect(result.data.utilizationPercentage).toBeNull();
        expect(result.data.isNearCapacity).toBe(false);
        expect(result.data.isAtCapacity).toBe(false);
      }
    });

    it('should return NOT_FOUND when activity does not exist', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error,
      });

      const result = await activityService.getCapacityInfo('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Activity not found');
      }
    });

    it('should return DATABASE_ERROR when RSVP count query fails', async () => {
      const activityData = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 20,
      };

      // Mock successful activity query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: activityData,
        error: null,
      });

      // Mock failed RSVP count query
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        count: null,
        error: { message: 'Connection timeout' },
      });

      const result = await activityService.getCapacityInfo('activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection timeout');
      }
    });
  });

  describe('calculateNetCost - Cost Management', () => {
    it('should return success with net cost when activity exists', async () => {
      const activityData = {
        cost_per_person: 100,
        host_subsidy: 25,
      };

      mockBuilder.mockSelectSingle('activities', activityData);

      const result = await activityService.calculateNetCost('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(75); // 100 - 25 = 75
      }
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.select).toHaveBeenCalledWith('cost_per_person, host_subsidy');
    });

    it('should return zero when host subsidy exceeds cost per person', async () => {
      const activityData = {
        cost_per_person: 50,
        host_subsidy: 75, // Exceeds cost
      };

      mockBuilder.mockSelectSingle('activities', activityData);

      const result = await activityService.calculateNetCost('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0); // Max(0, 50 - 75) = 0
      }
    });

    it('should handle null values correctly', async () => {
      const activityData = {
        cost_per_person: null,
        host_subsidy: null,
      };

      mockBuilder.mockSelectSingle('activities', activityData);

      const result = await activityService.calculateNetCost('activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0); // 0 - 0 = 0
      }
    });

    it('should return NOT_FOUND when activity does not exist', async () => {
      const error = { code: 'PGRST116', message: 'No rows found' };
      mockBuilder.mockSelectSingle('activities', null, error);

      const result = await activityService.calculateNetCost('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Activity not found');
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const error = { message: 'Connection failed', code: 'DATABASE_ERROR' };
      mockBuilder.mockSelectSingle('activities', null, error);

      const result = await activityService.calculateNetCost('activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Connection failed');
      }
    });
  });
});