/**
 * Regression Test Suite: Data Service Operations
 * 
 * Tests CRUD operations across all data services to prevent regressions in:
 * - Guest management
 * - Event management
 * - Activity management
 * - RSVP management
 * - Vendor management
 * - Accommodation management
 * 
 * Requirements: 21.1, 21.2
 */

import { guestService } from '@/services/guestService';
import { eventService } from '@/services/eventService';
import { activityService } from '@/services/activityService';
import { rsvpService } from '@/services/rsvpService';
import { vendorService } from '@/services/vendorService';
import { accommodationService } from '@/services/accommodationService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn(),
  range: jest.fn().mockReturnThis(),
};

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Regression: Data Service Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest Service CRUD', () => {
    const validGuest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      ageType: 'adult' as const,
      guestType: 'wedding_guest' as const,
    };

    it('should create guest with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', ...validGuest },
        error: null,
      });

      const result = await guestService.create(validGuest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('guest-1');
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should retrieve guest by ID', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', ...validGuest },
        error: null,
      });

      const result = await guestService.get('guest-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('guest-1');
      }
    });

    it('should update guest data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', ...validGuest, firstName: 'Jane' },
        error: null,
      });

      const result = await guestService.update('guest-1', {
        firstName: 'Jane',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('Jane');
      }
    });

    it('should delete guest', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await guestService.delete('guest-1');

      expect(result.success).toBe(true);
    });

    it('should list guests with pagination', async () => {
      mockSupabase.range.mockReturnThis();
      mockSupabase.select.mockResolvedValue({
        data: [
          { id: 'guest-1', ...validGuest },
          { id: 'guest-2', ...validGuest, firstName: 'Jane' },
        ],
        error: null,
        count: 2,
      });

      const result = await guestService.list({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
      }
    });
  });

  describe('Event Service CRUD', () => {
    const validEvent = {
      name: 'Wedding Ceremony',
      eventType: 'ceremony' as const,
      startDate: new Date('2025-06-15T14:00:00Z'),
      rsvpRequired: true,
      visibility: ['wedding_party', 'wedding_guest'],
      status: 'published' as const,
    };

    it('should create event with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'event-1', ...validEvent },
        error: null,
      });

      const result = await eventService.create(validEvent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('event-1');
        expect(result.data.name).toBe('Wedding Ceremony');
      }
    });

    it('should detect scheduling conflicts', async () => {
      const conflictingEvent = {
        ...validEvent,
        name: 'Conflicting Event',
        locationId: 'location-1',
      };

      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'event-1', ...validEvent, locationId: 'location-1' }],
        error: null,
      });

      const result = await eventService.checkSchedulingConflict(
        conflictingEvent
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasConflict).toBe(true);
      }
    });
  });

  describe('Activity Service CRUD', () => {
    const validActivity = {
      name: 'Beach Volleyball',
      activityType: 'activity' as const,
      startTime: new Date('2025-06-16T10:00:00Z'),
      capacity: 20,
      costPerPerson: 25,
      hostSubsidy: 10,
      adultsOnly: false,
      plusOneAllowed: true,
      visibility: ['wedding_guest'],
      status: 'published' as const,
      displayOrder: 1,
    };

    it('should create activity with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'activity-1', ...validActivity },
        error: null,
      });

      const result = await activityService.create(validActivity);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('activity-1');
        expect(result.data.capacity).toBe(20);
      }
    });

    it('should validate required fields', async () => {
      const invalidActivity = {
        activityType: 'activity' as const,
        // Missing name and startTime
      };

      const result = await activityService.create(invalidActivity as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('RSVP Service CRUD', () => {
    const validRSVP = {
      guestId: 'guest-1',
      eventId: 'event-1',
      status: 'attending' as const,
      guestCount: 2,
      dietaryNotes: 'Vegetarian',
    };

    it('should create RSVP with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'rsvp-1', ...validRSVP },
        error: null,
      });

      const result = await rsvpService.create(validRSVP);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('attending');
      }
    });

    it('should update RSVP status', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'rsvp-1', ...validRSVP, status: 'declined' },
        error: null,
      });

      const result = await rsvpService.update('rsvp-1', {
        status: 'declined',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('declined');
      }
    });
  });

  describe('Vendor Service CRUD', () => {
    const validVendor = {
      name: 'Perfect Photos',
      category: 'photography' as const,
      pricingModel: 'flat_rate' as const,
      baseCost: 2500,
      paymentStatus: 'unpaid' as const,
      amountPaid: 0,
    };

    it('should create vendor with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'vendor-1', ...validVendor },
        error: null,
      });

      const result = await vendorService.create(validVendor);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('photography');
      }
    });

    it('should update payment status', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'vendor-1',
          ...validVendor,
          paymentStatus: 'partial',
          amountPaid: 1000,
        },
        error: null,
      });

      const result = await vendorService.recordPayment('vendor-1', 1000);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentStatus).toBe('partial');
        expect(result.data.amountPaid).toBe(1000);
      }
    });
  });

  describe('Accommodation Service CRUD', () => {
    const validAccommodation = {
      name: 'Beach Resort',
      description: 'Luxury beachfront resort',
      status: 'published' as const,
    };

    it('should create accommodation with valid data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'accommodation-1', ...validAccommodation },
        error: null,
      });

      const result = await accommodationService.create(validAccommodation);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Beach Resort');
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity on delete', async () => {
      // Mock event with activities
      mockSupabase.select.mockResolvedValue({
        data: [{ id: 'activity-1', eventId: 'event-1' }],
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      // Deleting event should not cascade to independent activities
      const result = await eventService.delete('event-1');

      expect(result.success).toBe(true);
    });

    it('should handle concurrent updates', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'guest-1', firstName: 'Updated' },
        error: null,
      });

      // Simulate concurrent updates
      const results = await Promise.all([
        guestService.update('guest-1', { firstName: 'Update1' }),
        guestService.update('guest-1', { firstName: 'Update2' }),
        guestService.update('guest-1', { firstName: 'Update3' }),
      ]);

      // All should succeed (last write wins)
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const result = await guestService.get('guest-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should handle not found errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const result = await guestService.get('nonexistent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
