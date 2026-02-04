import { createMockSupabaseClient, resetMockSupabaseClient } from '@/__tests__/helpers/mockSupabase';
import * as rsvpManagementService from './rsvpManagementService';
import type { RSVPFilters, PaginationParams } from './rsvpManagementService';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('rsvpManagementService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockSupabase = createMockSupabaseClient();
    resetMockSupabaseClient(mockSupabase);
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listRSVPs', () => {
    const mockRSVPData = [
      {
        id: 'rsvp-1',
        guest_id: 'guest-1',
        event_id: 'event-1',
        activity_id: null,
        status: 'attending',
        guest_count: 2,
        dietary_notes: 'Vegetarian',
        special_requirements: null,
        notes: null,
        responded_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        guests: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        events: {
          name: 'Wedding Ceremony',
        },
        activities: null,
      },
      {
        id: 'rsvp-2',
        guest_id: 'guest-2',
        event_id: null,
        activity_id: 'activity-1',
        status: 'pending',
        guest_count: 1,
        dietary_notes: null,
        special_requirements: null,
        notes: null,
        responded_at: null,
        created_at: '2024-01-12T10:00:00Z',
        updated_at: '2024-01-12T10:00:00Z',
        guests: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
        events: null,
        activities: {
          name: 'Beach Activity',
        },
      },
    ];

    it('should return success with RSVPs when valid filters and pagination', async () => {
      // Mock the query chain for listRSVPs
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockRSVPData,
        error: null,
        count: 2,
      });

      const filters: RSVPFilters = { eventId: 'event-1' };
      const pagination: PaginationParams = { page: 1, limit: 50 };

      const result = await rsvpManagementService.listRSVPs(filters, pagination);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.data[0].guestFirstName).toBe('John');
        expect(result.data.data[0].eventName).toBe('Wedding Ceremony');
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.limit).toBe(50);
        expect(result.data.pagination.total).toBe(2);
        expect(result.data.pagination.totalPages).toBe(1);
        // Statistics should be calculated
        expect(result.data.statistics.totalRSVPs).toBeGreaterThanOrEqual(0);
        expect(result.data.statistics.byStatus).toBeDefined();
      }
    });

    it('should filter by event ID', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[0]],
        error: null,
        count: 1,
      });

      const result = await rsvpManagementService.listRSVPs(
        { eventId: 'event-1' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
        expect(result.data.data[0].eventId).toBe('event-1');
      }
      
      // Verify eq was called with event_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', 'event-1');
    });

    it('should filter by activity ID', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[1]],
        error: null,
        count: 1,
      });

      const result = await rsvpManagementService.listRSVPs(
        { activityId: 'activity-1' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
        expect(result.data.data[0].activityId).toBe('activity-1');
      }
      
      // Verify eq was called with activity_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('activity_id', 'activity-1');
    });

    it('should filter by status', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[0]],
        error: null,
        count: 1,
      });

      const result = await rsvpManagementService.listRSVPs(
        { status: 'attending' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
        expect(result.data.data[0].status).toBe('attending');
      }
      
      // Verify eq was called with status
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'attending');
    });

    it('should filter by guest ID', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[0]],
        error: null,
        count: 1,
      });

      // Mock getRSVPStatistics
      jest.spyOn(rsvpManagementService, 'getRSVPStatistics').mockResolvedValue({
        success: true,
        data: {
          totalRSVPs: 1,
          byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 2,
        },
      });

      const result = await rsvpManagementService.listRSVPs(
        { guestId: 'guest-1' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(1);
        expect(result.data.data[0].guestId).toBe('guest-1');
      }
      
      // Verify eq was called with guest_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('guest_id', 'guest-1');
    });

    it('should apply pagination correctly', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockRSVPData,
        error: null,
        count: 100,
      });

      // Mock getRSVPStatistics
      jest.spyOn(rsvpManagementService, 'getRSVPStatistics').mockResolvedValue({
        success: true,
        data: {
          totalRSVPs: 100,
          byStatus: { attending: 50, declined: 25, maybe: 15, pending: 10 },
          totalGuestCount: 50,
        },
      });

      const result = await rsvpManagementService.listRSVPs(
        {},
        { page: 2, limit: 25 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(2);
        expect(result.data.pagination.limit).toBe(25);
        expect(result.data.pagination.total).toBe(100);
        expect(result.data.pagination.totalPages).toBe(4);
      }
      
      // Verify range was called with correct values (page 2, limit 25 = from 25 to 49)
      expect(mockSupabase.range).toHaveBeenCalledWith(25, 49);
    });

    it('should return VALIDATION_ERROR when invalid filter parameters', async () => {
      const result = await rsvpManagementService.listRSVPs(
        { eventId: 'invalid-uuid' } as any,
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when invalid pagination parameters', async () => {
      const result = await rsvpManagementService.listRSVPs(
        {},
        { page: -1, limit: 50 } as any
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      const result = await rsvpManagementService.listRSVPs({}, { page: 1, limit: 50 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should apply multiple filters together', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[0]],
        error: null,
        count: 1,
      });

      // Mock getRSVPStatistics
      jest.spyOn(rsvpManagementService, 'getRSVPStatistics').mockResolvedValue({
        success: true,
        data: {
          totalRSVPs: 1,
          byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 2,
        },
      });

      const result = await rsvpManagementService.listRSVPs(
        { eventId: 'event-1', status: 'attending', guestId: 'guest-1' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      
      // Verify all filters were applied
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'attending');
      expect(mockSupabase.eq).toHaveBeenCalledWith('guest_id', 'guest-1');
    });

    it('should handle search query filter', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.or.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: [mockRSVPData[0]],
        error: null,
        count: 1,
      });

      // Mock getRSVPStatistics
      jest.spyOn(rsvpManagementService, 'getRSVPStatistics').mockResolvedValue({
        success: true,
        data: {
          totalRSVPs: 1,
          byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 2,
        },
      });

      const result = await rsvpManagementService.listRSVPs(
        { searchQuery: 'John' },
        { page: 1, limit: 50 }
      );

      expect(result.success).toBe(true);
      
      // Verify or was called for search
      expect(mockSupabase.or).toHaveBeenCalled();
    });

    it('should default to page 1 and limit 50 when not specified', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.range.mockReturnValue(mockSupabase);
      mockSupabase.order.mockResolvedValue({
        data: mockRSVPData,
        error: null,
        count: 2,
      });

      // Mock getRSVPStatistics
      jest.spyOn(rsvpManagementService, 'getRSVPStatistics').mockResolvedValue({
        success: true,
        data: {
          totalRSVPs: 2,
          byStatus: { attending: 1, declined: 0, maybe: 0, pending: 1 },
          totalGuestCount: 2,
        },
      });

      const result = await rsvpManagementService.listRSVPs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pagination.page).toBe(1);
        expect(result.data.pagination.limit).toBe(50);
      }
      
      // Verify range was called with default values (page 1, limit 50 = from 0 to 49)
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 49);
    });
  });

  describe('getRSVPStatistics', () => {
    const mockStatisticsData = [
      { status: 'attending', guest_count: 2 },
      { status: 'attending', guest_count: 1 },
      { status: 'declined', guest_count: 1 },
      { status: 'maybe', guest_count: null },
      { status: 'pending', guest_count: 1 },
    ];

    it('should return success with accurate statistics', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: mockStatisticsData,
        error: null,
      });

      const result = await rsvpManagementService.getRSVPStatistics({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRSVPs).toBe(5);
        expect(result.data.byStatus.attending).toBe(2);
        expect(result.data.byStatus.declined).toBe(1);
        expect(result.data.byStatus.maybe).toBe(1);
        expect(result.data.byStatus.pending).toBe(1);
        expect(result.data.totalGuestCount).toBe(3); // 2 + 1 from attending
      }
    });

    it('should filter statistics by event ID', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: [mockStatisticsData[0], mockStatisticsData[1]],
        error: null,
      });

      const result = await rsvpManagementService.getRSVPStatistics({
        eventId: 'event-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRSVPs).toBe(2);
        expect(result.data.byStatus.attending).toBe(2);
      }
      
      // Verify eq was called with event_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', 'event-1');
    });

    it('should handle empty results', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await rsvpManagementService.getRSVPStatistics({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRSVPs).toBe(0);
        expect(result.data.byStatus.attending).toBe(0);
        expect(result.data.totalGuestCount).toBe(0);
      }
    });

    it('should return VALIDATION_ERROR when invalid filter parameters', async () => {
      const result = await rsvpManagementService.getRSVPStatistics({
        eventId: 'invalid-uuid',
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when database query fails', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await rsvpManagementService.getRSVPStatistics({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should filter statistics by multiple criteria', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: [mockStatisticsData[0]],
        error: null,
      });

      const result = await rsvpManagementService.getRSVPStatistics({
        eventId: 'event-1',
        status: 'attending',
      });

      expect(result.success).toBe(true);
      
      // Verify both filters were applied
      expect(mockSupabase.eq).toHaveBeenCalledWith('event_id', 'event-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'attending');
    });

    it('should default guest_count to 1 when null for attending RSVPs', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [
          { status: 'attending', guest_count: null },
          { status: 'attending', guest_count: 2 },
        ],
        error: null,
      });

      const result = await rsvpManagementService.getRSVPStatistics({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalGuestCount).toBe(3); // 1 (default) + 2
      }
    });
  });

  describe('bulkUpdateRSVPs', () => {
    it('should return success with updated count when valid input', async () => {
      const rsvpIds = ['rsvp-1', 'rsvp-2', 'rsvp-3'];
      
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'rsvp-1' }, { id: 'rsvp-2' }, { id: 'rsvp-3' }],
        error: null,
      });

      const result = await rsvpManagementService.bulkUpdateRSVPs(
        rsvpIds,
        'attending',
        'Bulk approved'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(3);
      }
      
      // Verify update was called with correct data
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'attending',
          notes: 'Bulk approved',
          responded_at: expect.any(String),
          updated_at: expect.any(String),
        })
      );
      
      // Verify in was called with correct IDs
      expect(mockSupabase.in).toHaveBeenCalledWith('id', rsvpIds);
    });

    it('should update status and set responded_at for non-pending status', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'rsvp-1' }],
        error: null,
      });

      await rsvpManagementService.bulkUpdateRSVPs(['rsvp-1'], 'attending');

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'attending',
          responded_at: expect.any(String),
        })
      );
    });

    it('should include notes when provided', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'rsvp-1' }],
        error: null,
      });

      await rsvpManagementService.bulkUpdateRSVPs(
        ['rsvp-1'],
        'attending',
        'Admin approved'
      );

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Admin approved',
        })
      );
    });

    it('should handle partial updates when some RSVPs not found', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'rsvp-1' }, { id: 'rsvp-2' }],
        error: null,
      });

      const result = await rsvpManagementService.bulkUpdateRSVPs(
        ['rsvp-1', 'rsvp-2', 'rsvp-3'],
        'attending'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updatedCount).toBe(2);
      }
    });

    it('should return VALIDATION_ERROR when empty rsvpIds array', async () => {
      const result = await rsvpManagementService.bulkUpdateRSVPs(
        [],
        'attending'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when too many rsvpIds (>100)', async () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => `rsvp-${i}`);
      
      const result = await rsvpManagementService.bulkUpdateRSVPs(
        tooManyIds,
        'attending'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when invalid status', async () => {
      const result = await rsvpManagementService.bulkUpdateRSVPs(
        ['rsvp-1'],
        'invalid-status' as any
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when database update fails', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await rsvpManagementService.bulkUpdateRSVPs(
        ['rsvp-1'],
        'attending'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should not set responded_at when status is pending', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.update.mockReturnValue(mockSupabase);
      mockSupabase.in.mockReturnValue(mockSupabase);
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'rsvp-1' }],
        error: null,
      });

      await rsvpManagementService.bulkUpdateRSVPs(['rsvp-1'], 'pending');

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
        })
      );
      
      // Verify responded_at is NOT in the update data
      const updateCall = mockSupabase.update.mock.calls[0][0];
      expect(updateCall.responded_at).toBeUndefined();
    });

    it('should handle all valid status values', async () => {
      const statuses: Array<'pending' | 'attending' | 'declined' | 'maybe'> = [
        'pending',
        'attending',
        'declined',
        'maybe',
      ];

      for (const status of statuses) {
        // Reset mocks for each iteration
        jest.clearAllMocks();
        resetMockSupabaseClient(mockSupabase);
        
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.update.mockReturnValue(mockSupabase);
        mockSupabase.in.mockReturnValue(mockSupabase);
        mockSupabase.select.mockResolvedValue({
          data: [{ id: 'rsvp-1' }],
          error: null,
        });

        const result = await rsvpManagementService.bulkUpdateRSVPs(['rsvp-1'], status);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.updatedCount).toBe(1);
        }
        expect(mockSupabase.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status,
          })
        );
      }
    });
  });

  describe('exportRSVPsToCSV', () => {
    it('should return success with CSV string when valid filters', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john@example.com',
          eventName: 'Wedding Ceremony',
          activityName: null,
          status: 'attending' as const,
          guestCount: 2,
          dietaryNotes: 'Vegetarian',
          specialRequirements: null,
          notes: null,
          respondedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          guestId: 'guest-1',
          eventId: 'event-1',
          activityId: null,
        },
      ];

      // Mock listRSVPs to return test data
      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: mockRSVPs,
          pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 2,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('RSVP ID,Guest First Name,Guest Last Name');
        expect(result.data).toContain('rsvp-1,John,Doe');
        expect(result.data).toContain('Wedding Ceremony');
        expect(result.data).toContain('attending');
        expect(result.data).toContain('Vegetarian');
      }
      
      // Verify listRSVPs was called with correct parameters
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith({}, { page: 1, limit: 10000 });
    });

    it('should escape CSV values with commas', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guestFirstName: 'John',
          guestLastName: 'Doe, Jr.',
          guestEmail: 'john@example.com',
          eventName: 'Wedding Ceremony',
          activityName: null,
          status: 'attending' as const,
          guestCount: 1,
          dietaryNotes: 'No nuts, no dairy',
          specialRequirements: null,
          notes: null,
          respondedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          guestId: 'guest-1',
          eventId: 'event-1',
          activityId: null,
        },
      ];

      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: mockRSVPs,
          pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 1,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('"Doe, Jr."');
        expect(result.data).toContain('"No nuts, no dairy"');
      }
    });

    it('should escape CSV values with quotes', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john@example.com',
          eventName: 'Wedding Ceremony',
          activityName: null,
          status: 'attending' as const,
          guestCount: 1,
          dietaryNotes: null,
          specialRequirements: null,
          notes: 'Guest said "excited to attend"',
          respondedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          guestId: 'guest-1',
          eventId: 'event-1',
          activityId: null,
        },
      ];

      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: mockRSVPs,
          pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 1,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('""excited to attend""');
      }
    });

    it('should handle empty results', async () => {
      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
          statistics: {
            totalRSVPs: 0,
            byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 0,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only have header row
        const lines = result.data.split('\n');
        expect(lines.length).toBe(1);
        expect(lines[0]).toContain('RSVP ID,Guest First Name');
      }
    });

    it('should return VALIDATION_ERROR when invalid filter parameters', async () => {
      const result = await rsvpManagementService.exportRSVPsToCSV({
        eventId: 'invalid-uuid',
      } as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should propagate errors from listRSVPs', async () => {
      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should apply filters when exporting', async () => {
      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 10000, total: 0, totalPages: 0 },
          statistics: {
            totalRSVPs: 0,
            byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 0,
          },
        },
      });

      const filters: RSVPFilters = { eventId: 'event-1', status: 'attending' };
      await rsvpManagementService.exportRSVPsToCSV(filters);

      // Verify listRSVPs was called with the filters
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith(filters, { page: 1, limit: 10000 });
    });

    it('should handle newlines in CSV values', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john@example.com',
          eventName: 'Wedding Ceremony',
          activityName: null,
          status: 'attending' as const,
          guestCount: 1,
          dietaryNotes: null,
          specialRequirements: null,
          notes: 'Line 1\nLine 2',
          respondedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          guestId: 'guest-1',
          eventId: 'event-1',
          activityId: null,
        },
      ];

      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: mockRSVPs,
          pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 1,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        // Newlines should be wrapped in quotes
        expect(result.data).toContain('"Line 1\nLine 2"');
      }
    });

    it('should handle null values in CSV', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: null,
          eventName: null,
          activityName: null,
          status: 'pending' as const,
          guestCount: null,
          dietaryNotes: null,
          specialRequirements: null,
          notes: null,
          respondedAt: null,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
          guestId: 'guest-1',
          eventId: null,
          activityId: null,
        },
      ];

      jest.spyOn(rsvpManagementService, 'listRSVPs').mockResolvedValue({
        success: true,
        data: {
          data: mockRSVPs,
          pagination: { page: 1, limit: 10000, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 0, declined: 0, maybe: 0, pending: 1 },
            totalGuestCount: 0,
          },
        },
      });

      const result = await rsvpManagementService.exportRSVPsToCSV({});

      expect(result.success).toBe(true);
      if (result.success) {
        // Null values should be empty strings
        const lines = result.data.split('\n');
        expect(lines[1]).toContain('rsvp-1,John,Doe,,,');
        // Guest count should default to 1
        expect(lines[1]).toContain(',1,');
      }
    });
  });
});
