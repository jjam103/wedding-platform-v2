import { findPendingRSVPs, sendRSVPReminder, processRSVPReminders } from './rsvpReminderService';
import * as emailService from './emailService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock email service
jest.mock('./emailService', () => ({
  sendEmail: jest.fn(),
}));

// Mock cron service
jest.mock('./cronService', () => ({
  executeCronJob: jest.fn((jobType, jobFunction) => jobFunction()),
}));

/**
 * Unit test for automated RSVP reminders
 * Validates: Requirements 23.3
 * 
 * Tests that deadline approaching triggers reminder
 */
describe('rsvpReminderService - Automated RSVP Reminders', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('deadline approaching triggers reminder', () => {
    it('should trigger reminder when deadline is within threshold', async () => {
      // Setup: Event with deadline 5 days away (within 7-day threshold)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const deadlineStr = futureDate.toISOString().split('T')[0];

      // Mock events query
      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              name: 'Wedding Ceremony',
              rsvp_deadline: deadlineStr,
            },
          ],
          error: null,
        }),
      };

      // Mock guests query
      const mockGuestsQuery = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'guest-1',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
            },
          ],
          error: null,
        }),
      };

      // Mock RSVPs query (no existing RSVP)
      const mockRsvpsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Mock activities query
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockGuestsQuery)
        .mockReturnValueOnce(mockRsvpsQuery)
        .mockReturnValueOnce(mockActivitiesQuery);

      // Act: Find pending RSVPs with 7-day threshold
      const result = await findPendingRSVPs(7);

      // Assert: Guest should be included in reminder list
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0].guest_id).toBe('guest-1');
        expect(result.data[0].guest_name).toBe('John Doe');
        expect(result.data[0].event_name).toBe('Wedding Ceremony');
        expect(result.data[0].days_until_deadline).toBeGreaterThanOrEqual(4);
        expect(result.data[0].days_until_deadline).toBeLessThanOrEqual(6);
      }
    });

    it('should not trigger reminder when deadline is beyond threshold', async () => {
      // Setup: Event with deadline 10 days away (beyond 7-day threshold)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const deadlineStr = futureDate.toISOString().split('T')[0];

      // Mock events query - should return empty because deadline is too far
      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [], // No events within threshold
          error: null,
        }),
      };

      // Mock activities query
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockActivitiesQuery);

      // Act: Find pending RSVPs with 7-day threshold
      const result = await findPendingRSVPs(7);

      // Assert: No guests should be included (deadline too far away)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it('should not trigger reminder when guest has already responded', async () => {
      // Setup: Event with deadline 5 days away
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const deadlineStr = futureDate.toISOString().split('T')[0];

      // Mock events query
      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'event-1',
              name: 'Wedding Ceremony',
              rsvp_deadline: deadlineStr,
            },
          ],
          error: null,
        }),
      };

      // Mock guests query
      const mockGuestsQuery = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'guest-1',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
            },
          ],
          error: null,
        }),
      };

      // Mock RSVPs query (guest already responded with 'attending')
      const mockRsvpsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ status: 'attending' }],
          error: null,
        }),
      };

      // Mock activities query
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockEventsQuery)
        .mockReturnValueOnce(mockGuestsQuery)
        .mockReturnValueOnce(mockRsvpsQuery)
        .mockReturnValueOnce(mockActivitiesQuery);

      // Act: Find pending RSVPs
      const result = await findPendingRSVPs(7);

      // Assert: No guests should be included (already responded)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(0);
      }
    });

    it('should send reminder email when deadline is approaching', async () => {
      const guest = {
        guest_id: 'guest-1',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        event_id: 'event-1',
        event_name: 'Wedding Ceremony',
        deadline: '2025-02-15',
        days_until_deadline: 7,
      };

      // Mock successful email send
      (emailService.sendEmail as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'email-123' },
      });

      // Mock database insert for logging
      const mockInsertQuery = {
        insert: jest.fn().mockResolvedValue({
          data: { id: 'reminder-1' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockInsertQuery);

      // Act: Send reminder
      const result = await sendRSVPReminder(guest);

      // Assert: Reminder should be sent successfully
      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('RSVP Reminder'),
          subject: expect.stringContaining('Wedding Ceremony'),
          subject: expect.stringContaining('7 days left'),
        })
      );
    });
  });
});

