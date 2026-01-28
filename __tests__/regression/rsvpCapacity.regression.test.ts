/**
 * Regression Test Suite: RSVP Capacity Management
 * 
 * Tests RSVP capacity tracking and alerts to prevent regressions in:
 * - Capacity calculations
 * - Capacity limit enforcement
 * - Alert generation at thresholds
 * - Waitlist management
 * - Real-time capacity updates
 * 
 * Requirements: 21.4
 */

import { rsvpService } from '@/services/rsvpService';
import { rsvpAnalyticsService } from '@/services/rsvpAnalyticsService';
import { capacityReportService } from '@/services/capacityReportService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Regression: RSVP Capacity Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Capacity Calculations', () => {
    it('should calculate current capacity correctly', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      const rsvps = [
        { status: 'attending', guestCount: 2 },
        { status: 'attending', guestCount: 3 },
        { status: 'attending', guestCount: 1 },
        { status: 'declined', guestCount: 2 },
        { status: 'pending', guestCount: 1 },
      ];

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Only attending RSVPs count: 2 + 3 + 1 = 6
        expect(result.data.currentAttendees).toBe(6);
        expect(result.data.capacity).toBe(100);
        expect(result.data.availableSpots).toBe(94);
        expect(result.data.utilizationPercent).toBe(6);
      }
    });

    it('should handle activities without capacity limits', async () => {
      const activity = {
        id: 'activity-1',
        capacity: null,
      };

      const rsvps = [
        { status: 'attending', guestCount: 50 },
        { status: 'attending', guestCount: 75 },
      ];

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAttendees).toBe(125);
        expect(result.data.capacity).toBeNull();
        expect(result.data.availableSpots).toBeNull();
      }
    });

    it('should handle zero attendees', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 50,
      };

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAttendees).toBe(0);
        expect(result.data.availableSpots).toBe(50);
        expect(result.data.utilizationPercent).toBe(0);
      }
    });
  });

  describe('Capacity Alert Generation', () => {
    it('should generate alert at 90% capacity', async () => {
      const activity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 100,
      };

      const rsvps = Array(90).fill({ status: 'attending', guestCount: 1 });

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await capacityReportService.checkCapacityAlerts(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shouldAlert).toBe(true);
        expect(result.data.alertLevel).toBe('warning');
        expect(result.data.utilizationPercent).toBe(90);
      }
    });

    it('should generate critical alert at 100% capacity', async () => {
      const activity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        capacity: 100,
      };

      const rsvps = Array(100).fill({ status: 'attending', guestCount: 1 });

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await capacityReportService.checkCapacityAlerts(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shouldAlert).toBe(true);
        expect(result.data.alertLevel).toBe('critical');
        expect(result.data.utilizationPercent).toBe(100);
      }
    });

    it('should not alert below 90% capacity', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      const rsvps = Array(85).fill({ status: 'attending', guestCount: 1 });

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await capacityReportService.checkCapacityAlerts(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shouldAlert).toBe(false);
        expect(result.data.utilizationPercent).toBe(85);
      }
    });

    it('should handle over-capacity situations', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      const rsvps = Array(110).fill({ status: 'attending', guestCount: 1 });

      mockSupabase.select.mockResolvedValue({
        data: rsvps,
        error: null,
      });

      const result = await capacityReportService.checkCapacityAlerts(
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shouldAlert).toBe(true);
        expect(result.data.alertLevel).toBe('over_capacity');
        expect(result.data.utilizationPercent).toBe(110);
      }
    });
  });

  describe('Capacity Limit Enforcement', () => {
    it('should prevent RSVP when at capacity', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      // Mock current capacity at 100
      mockSupabase.select.mockResolvedValue({
        data: Array(100).fill({ status: 'attending', guestCount: 1 }),
        error: null,
      });

      const result = await rsvpService.create({
        guestId: 'guest-1',
        activityId: 'activity-1',
        status: 'attending',
        guestCount: 1,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAPACITY_EXCEEDED');
      }
    });

    it('should allow RSVP when capacity available', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      // Mock current capacity at 95
      mockSupabase.select.mockResolvedValue({
        data: Array(95).fill({ status: 'attending', guestCount: 1 }),
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'rsvp-1',
          guestId: 'guest-1',
          activityId: 'activity-1',
          status: 'attending',
          guestCount: 1,
        },
        error: null,
      });

      const result = await rsvpService.create({
        guestId: 'guest-1',
        activityId: 'activity-1',
        status: 'attending',
        guestCount: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should allow declining RSVP even at capacity', async () => {
      const activity = {
        id: 'activity-1',
        capacity: 100,
      };

      mockSupabase.select.mockResolvedValue({
        data: Array(100).fill({ status: 'attending', guestCount: 1 }),
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'rsvp-1',
          guestId: 'guest-1',
          activityId: 'activity-1',
          status: 'declined',
          guestCount: 0,
        },
        error: null,
      });

      const result = await rsvpService.create({
        guestId: 'guest-1',
        activityId: 'activity-1',
        status: 'declined',
        guestCount: 0,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Real-Time Capacity Updates', () => {
    it('should update capacity when RSVP status changes', async () => {
      // Initial state: 95 attending
      mockSupabase.select
        .mockResolvedValueOnce({
          data: Array(95).fill({ status: 'attending', guestCount: 1 }),
          error: null,
        })
        .mockResolvedValueOnce({
          data: Array(94).fill({ status: 'attending', guestCount: 1 }),
          error: null,
        });

      // Check initial capacity
      const initialResult = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(initialResult.success).toBe(true);
      if (initialResult.success) {
        expect(initialResult.data.currentAttendees).toBe(95);
      }

      // Update RSVP to declined
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'rsvp-1',
          status: 'declined',
        },
        error: null,
      });

      await rsvpService.update('rsvp-1', { status: 'declined' });

      // Check updated capacity
      const updatedResult = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(updatedResult.success).toBe(true);
      if (updatedResult.success) {
        expect(updatedResult.data.currentAttendees).toBe(94);
      }
    });

    it('should handle guest count changes', async () => {
      mockSupabase.select
        .mockResolvedValueOnce({
          data: [
            { status: 'attending', guestCount: 2 },
            { status: 'attending', guestCount: 3 },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { status: 'attending', guestCount: 4 },
            { status: 'attending', guestCount: 3 },
          ],
          error: null,
        });

      // Initial: 2 + 3 = 5
      const initialResult = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(initialResult.success).toBe(true);
      if (initialResult.success) {
        expect(initialResult.data.currentAttendees).toBe(5);
      }

      // Update guest count from 2 to 4
      mockSupabase.single.mockResolvedValue({
        data: { id: 'rsvp-1', guestCount: 4 },
        error: null,
      });

      await rsvpService.update('rsvp-1', { guestCount: 4 });

      // Updated: 4 + 3 = 7
      const updatedResult = await rsvpAnalyticsService.calculateCapacity(
        'activity-1'
      );

      expect(updatedResult.success).toBe(true);
      if (updatedResult.success) {
        expect(updatedResult.data.currentAttendees).toBe(7);
      }
    });
  });

  describe('Multiple Activities Capacity', () => {
    it('should track capacity across multiple activities', async () => {
      const activities = [
        { id: 'activity-1', capacity: 50 },
        { id: 'activity-2', capacity: 75 },
        { id: 'activity-3', capacity: 100 },
      ];

      mockSupabase.select
        .mockResolvedValueOnce({
          data: Array(45).fill({ status: 'attending', guestCount: 1 }),
          error: null,
        })
        .mockResolvedValueOnce({
          data: Array(70).fill({ status: 'attending', guestCount: 1 }),
          error: null,
        })
        .mockResolvedValueOnce({
          data: Array(95).fill({ status: 'attending', guestCount: 1 }),
          error: null,
        });

      const results = await Promise.all(
        activities.map((activity) =>
          rsvpAnalyticsService.calculateCapacity(activity.id)
        )
      );

      expect(results[0].success && results[0].data.utilizationPercent).toBe(
        90
      );
      expect(results[1].success && results[1].data.utilizationPercent).toBeCloseTo(
        93.33,
        2
      );
      expect(results[2].success && results[2].data.utilizationPercent).toBe(
        95
      );
    });
  });
});
