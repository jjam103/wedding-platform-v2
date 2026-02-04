/**
 * Query Optimization Utilities Tests
 * 
 * Tests for database query optimization functions
 */

import {
  getPaginationRange,
  PAGINATION_DEFAULTS,
  fetchGuestsWithRSVPs,
  fetchEventsWithActivities,
  fetchActivitiesWithRSVPs,
  batchFetchByIds,
} from './queryOptimization';

describe('Query Optimization Utilities', () => {
  describe('getPaginationRange', () => {
    it('should calculate correct range for first page', () => {
      const result = getPaginationRange(1, 50);
      expect(result).toEqual({ from: 0, to: 49 });
    });

    it('should calculate correct range for second page', () => {
      const result = getPaginationRange(2, 50);
      expect(result).toEqual({ from: 50, to: 99 });
    });

    it('should calculate correct range for custom page size', () => {
      const result = getPaginationRange(3, 25);
      expect(result).toEqual({ from: 50, to: 74 });
    });

    it('should handle page 1 with different page sizes', () => {
      expect(getPaginationRange(1, 10)).toEqual({ from: 0, to: 9 });
      expect(getPaginationRange(1, 100)).toEqual({ from: 0, to: 99 });
    });
  });

  describe('PAGINATION_DEFAULTS', () => {
    it('should have correct default values', () => {
      expect(PAGINATION_DEFAULTS.GUESTS_PER_PAGE).toBe(50);
      expect(PAGINATION_DEFAULTS.ACTIVITIES_PER_PAGE).toBe(50);
      expect(PAGINATION_DEFAULTS.EVENTS_PER_PAGE).toBe(50);
      expect(PAGINATION_DEFAULTS.PHOTOS_PER_PAGE).toBe(50);
      expect(PAGINATION_DEFAULTS.EMAIL_HISTORY_PER_PAGE).toBe(50);
      expect(PAGINATION_DEFAULTS.AUDIT_LOGS_PER_PAGE).toBe(100);
    });
  });

  describe('fetchGuestsWithRSVPs', () => {
    it('should build query with default pagination', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchGuestsWithRSVPs(mockSupabase as any);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('guests');
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('rsvps'),
        { count: 'exact' }
      );
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
      expect(mockSupabase.order).toHaveBeenCalledWith('last_name', { ascending: true });
    });

    it('should filter by group ID when provided', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchGuestsWithRSVPs(mockSupabase as any, { groupId: 'group-123' });
      
      expect(mockSupabase.eq).toHaveBeenCalledWith('group_id', 'group-123');
    });

    it('should use custom pagination', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchGuestsWithRSVPs(mockSupabase as any, { page: 2, pageSize: 25 });
      
      expect(mockSupabase.range).toHaveBeenCalledWith(25, 49);
    });
  });

  describe('fetchEventsWithActivities', () => {
    it('should build query with default pagination', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchEventsWithActivities(mockSupabase as any);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('events');
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('activities'),
        { count: 'exact' }
      );
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
      expect(mockSupabase.order).toHaveBeenCalledWith('event_date', { ascending: true });
    });

    it('should filter active events by default', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchEventsWithActivities(mockSupabase as any);
      
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should include inactive events when requested', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchEventsWithActivities(mockSupabase as any, { includeInactive: true });
      
      expect(mockSupabase.eq).not.toHaveBeenCalled();
    });
  });

  describe('fetchActivitiesWithRSVPs', () => {
    it('should build query with default pagination', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchActivitiesWithRSVPs(mockSupabase as any);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('rsvps'),
        { count: 'exact' }
      );
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
      expect(mockSupabase.order).toHaveBeenCalledWith('activity_date', { ascending: true });
    });

    it('should filter by event ID when provided', () => {
      const mockSupabase = createMockSupabaseClient();
      
      fetchActivitiesWithRSVPs(mockSupabase as any, { eventId: 'event-123' });
      
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', 'event-123');
    });
  });

  describe('batchFetchByIds', () => {
    it('should return empty array for empty IDs', async () => {
      const mockSupabase = createMockSupabaseClient();
      
      const result = await batchFetchByIds(mockSupabase as any, 'guests', []);
      
      expect(result).toEqual({ data: [], error: null });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should fetch multiple entities by IDs', async () => {
      const mockSupabase = createMockSupabaseClient();
      const ids = ['id-1', 'id-2', 'id-3'];
      
      await batchFetchByIds(mockSupabase as any, 'guests', ids);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('guests');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.in).toHaveBeenCalledWith('id', ids);
    });

    it('should use custom select fields', async () => {
      const mockSupabase = createMockSupabaseClient();
      const ids = ['id-1', 'id-2'];
      
      await batchFetchByIds(mockSupabase as any, 'guests', ids, 'id, first_name, last_name');
      
      expect(mockSupabase.select).toHaveBeenCalledWith('id, first_name, last_name');
    });
  });
});

// Mock Supabase client for testing
function createMockSupabaseClient() {
  const mockChain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return mockChain;
}
