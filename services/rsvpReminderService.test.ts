// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_APP_URL = 'https://test.example.com';

// Mock email service
jest.mock('./emailService', () => ({
  sendEmail: jest.fn(),
}));

// Mock cron service
jest.mock('./cronService', () => ({
  executeCronJob: jest.fn((jobType: string, jobFunction: () => any) => jobFunction()),
}));

// Import after mocks are set up
import { findPendingRSVPs, sendRSVPReminder, __setSupabaseClient, __resetSupabaseClient } from './rsvpReminderService';
import * as emailService from './emailService';

/**
 * Unit test for automated RSVP reminders
 * Validates: Requirements 23.3
 * 
 * Tests that deadline approaching triggers reminder
 */
describe('rsvpReminderService - Automated RSVP Reminders', () => {
  let mockFromFn: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock Supabase client
    mockFromFn = jest.fn();
    const mockSupabaseClient = {
      from: mockFromFn,
    };
    
    // Inject the mock client into the service
    __setSupabaseClient(mockSupabaseClient as any);
  });
  
  afterEach(() => {
    __resetSupabaseClient();
  });

  describe('deadline approaching triggers reminder', () => {
    it('should trigger reminder when deadline is within threshold', async () => {
      // Setup: Event with deadline 5 days away (within 7-day threshold)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const deadlineStr = futureDate.toISOString().split('T')[0];

      // Mock events query - needs to chain: select().eq().not().gte().lte().eq()
      const mockEventsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
      };
      // The second eq() call (after lte) should resolve with data
      (mockEventsQuery.eq as jest.Mock).mockReturnValueOnce(mockEventsQuery).mockResolvedValueOnce({
        data: [
          {
            id: 'event-1',
            name: 'Wedding Ceremony',
            rsvp_deadline: deadlineStr,
          },
        ],
        error: null,
      });

      // Mock guests query - needs to chain: select().not().eq()
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

      // Mock RSVPs query (no existing RSVP) - needs to chain: select().eq().eq()
      const mockRsvpsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      // The second eq() call should resolve with empty data
      (mockRsvpsQuery.eq as jest.Mock).mockReturnValueOnce(mockRsvpsQuery).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock activities query - needs to chain: select().eq()
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      // Set up the from() mock to return the right query chain in order
      mockFromFn
        .mockReturnValueOnce(mockEventsQuery)  // First call: events query
        .mockReturnValueOnce(mockGuestsQuery)  // Second call: guests query
        .mockReturnValueOnce(mockRsvpsQuery)   // Third call: rsvps query
        .mockReturnValueOnce(mockActivitiesQuery); // Fourth call: activities query

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
        lte: jest.fn().mockReturnThis(),
      };
      // The second eq() call (after lte) should resolve with empty data
      (mockEventsQuery.eq as jest.Mock).mockReturnValueOnce(mockEventsQuery).mockResolvedValueOnce({
        data: [], // No events within threshold
        error: null,
      });

      // Mock activities query
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockFromFn
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
        lte: jest.fn().mockReturnThis(),
      };
      // The second eq() call (after lte) should resolve with data
      (mockEventsQuery.eq as jest.Mock).mockReturnValueOnce(mockEventsQuery).mockResolvedValueOnce({
        data: [
          {
            id: 'event-1',
            name: 'Wedding Ceremony',
            rsvp_deadline: deadlineStr,
          },
        ],
        error: null,
      });

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
        eq: jest.fn().mockReturnThis(),
      };
      // The second eq() call should resolve with attending status
      (mockRsvpsQuery.eq as jest.Mock).mockReturnValueOnce(mockRsvpsQuery).mockResolvedValueOnce({
        data: [{ status: 'attending' }],
        error: null,
      });

      // Mock activities query
      const mockActivitiesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockFromFn
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

      // Mock database insert for logging - needs to chain: insert()
      const mockInsertQuery = {
        insert: jest.fn().mockResolvedValue({
          data: { id: 'reminder-1' },
          error: null,
        }),
      };

      mockFromFn.mockReturnValue(mockInsertQuery);

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

