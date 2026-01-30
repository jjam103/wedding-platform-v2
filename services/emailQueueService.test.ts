// Mock emailService
jest.mock('./emailService', () => ({
  sendEmail: jest.fn(),
}));

// Mock cronService
jest.mock('./cronService', () => ({
  executeCronJob: jest.fn().mockImplementation(async (jobType, fn) => {
    try {
      const result = await fn();
      return {
        success: true,
        data: {
          jobType,
          status: 'completed',
          itemsProcessed: result.itemsProcessed,
          itemsFailed: result.itemsFailed,
          durationMs: 100,
          errors: [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }),
}));

// Mock Supabase client creation - service creates its own client
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    // Export mockFrom so we can access it in tests
    __mockFrom: mockFrom,
  };
});

// Import service AFTER mocking dependencies
import {
  processScheduledEmails,
  getScheduledEmailStats,
  retryFailedScheduledEmails,
  cancelScheduledEmail,
} from './emailQueueService';

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

describe('emailQueueService', () => {
  const mockSendEmail = require('./emailService').sendEmail;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables for the service
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    
    // Reset Supabase mocks to default successful state
    // Default setup for most common query patterns
    mockFrom.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });
  });

  describe('processScheduledEmails', () => {
    it('should return success with zero processed when no scheduled emails exist', async () => {
      // Set up the complete mock chain for this specific test
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await processScheduledEmails();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsProcessed).toBe(0);
        expect(result.data.itemsFailed).toBe(0);
      }
    });

    it('should return success with processed count when emails sent successfully', async () => {
      const mockScheduledEmails = [
        {
          id: 'email-1',
          recipient_email: 'guest1@example.com',
          subject: 'RSVP Reminder',
          html: '<p>Please RSVP</p>',
          text: 'Please RSVP',
          template_id: 'template-1',
          status: 'pending',
          scheduled_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        },
        {
          id: 'email-2',
          recipient_email: 'guest2@example.com',
          subject: 'Event Update',
          html: '<p>Event updated</p>',
          text: 'Event updated',
          template_id: 'template-2',
          status: 'pending',
          scheduled_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        },
      ];

      // Handle multiple calls to supabase.from() - first call gets emails, subsequent calls update status
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'scheduled_emails') {
          callCount++;
          if (callCount === 1) {
            // First call - select emails
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue({ data: mockScheduledEmails, error: null }),
                    }),
                  }),
                }),
              }),
            };
          } else {
            // Subsequent calls - updates
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
        }
        return {};
      });

      mockSendEmail.mockResolvedValue({
        success: true,
        data: { id: 'sent-email-id' },
      });

      const result = await processScheduledEmails();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsProcessed).toBe(2);
        expect(result.data.itemsFailed).toBe(0);
      }
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle email sending failures and mark emails as failed', async () => {
      const mockScheduledEmails = [
        {
          id: 'email-1',
          recipient_email: 'guest1@example.com',
          subject: 'RSVP Reminder',
          html: '<p>Please RSVP</p>',
          text: 'Please RSVP',
          template_id: 'template-1',
        },
      ];

      // Handle multiple calls to supabase.from()
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'scheduled_emails') {
          callCount++;
          if (callCount === 1) {
            // First call - select emails
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue({ data: mockScheduledEmails, error: null }),
                    }),
                  }),
                }),
              }),
            };
          } else {
            // Subsequent calls - updates
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
        }
        return {};
      });

      mockSendEmail.mockResolvedValue({
        success: false,
        error: { message: 'Email service error' },
      });

      const result = await processScheduledEmails();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsProcessed).toBe(0);
        expect(result.data.itemsFailed).toBe(1);
      }
    });

    it('should handle exceptions during email processing', async () => {
      const mockScheduledEmails = [
        {
          id: 'email-1',
          recipient_email: 'guest1@example.com',
          subject: 'RSVP Reminder',
          html: '<p>Please RSVP</p>',
          text: 'Please RSVP',
          template_id: 'template-1',
        },
      ];

      // Handle multiple calls to supabase.from()
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'scheduled_emails') {
          callCount++;
          if (callCount === 1) {
            // First call - select emails
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockResolvedValue({ data: mockScheduledEmails, error: null }),
                    }),
                  }),
                }),
              }),
            };
          } else {
            // Subsequent calls - updates
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
        }
        return {};
      });

      mockSendEmail.mockRejectedValue(new Error('Unexpected error'));

      const result = await processScheduledEmails();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemsProcessed).toBe(0);
        expect(result.data.itemsFailed).toBe(1);
      }
    });

    it('should throw error when fetching scheduled emails fails', async () => {
      // Set up the mock chain to return an error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
              }),
            }),
          }),
        }),
      });

      const result = await processScheduledEmails();

      // The executeCronJob mock should catch the error and return a failed result
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('getScheduledEmailStats', () => {
    it('should return success with email statistics when emails exist', async () => {
      const mockEmails = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'processing' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'failed' },
      ];

      // Set up the complete mock chain for this specific test
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: mockEmails,
          error: null,
        }),
      });

      const result = await getScheduledEmailStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pending).toBe(2);
        expect(result.data.processing).toBe(1);
        expect(result.data.sent).toBe(3);
        expect(result.data.failed).toBe(1);
        expect(result.data.total).toBe(7);
      }
    });

    it('should return success with zero stats when no emails exist', async () => {
      // Set up the complete mock chain for this specific test
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      
      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await getScheduledEmailStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pending).toBe(0);
        expect(result.data.processing).toBe(0);
        expect(result.data.sent).toBe(0);
        expect(result.data.failed).toBe(0);
        expect(result.data.total).toBe(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      // Set up the complete mock chain for this specific test
      mockFrom.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' },
        }),
      });

      const result = await getScheduledEmailStats();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      // Set up the mock to throw an error
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await getScheduledEmailStats();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('retryFailedScheduledEmails', () => {
    it('should return success with retry count when failed emails retried', async () => {
      const mockFailedEmails = [
        {
          id: 'email-1',
          retry_count: 1,
        },
        {
          id: 'email-2',
          retry_count: null,
        },
      ];

      // Handle multiple calls to supabase.from() - first call gets emails, subsequent calls update
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'scheduled_emails') {
          callCount++;
          if (callCount === 1) {
            // First call - select failed emails
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  or: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue({ data: mockFailedEmails, error: null }),
                  }),
                }),
              }),
            };
          } else {
            // Subsequent calls - updates
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
        }
        return {};
      });

      const result = await retryFailedScheduledEmails(3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retried).toBe(2);
        expect(result.data.failed).toBe(0);
      }
    });

    it('should return success with zero count when no failed emails exist', async () => {
      // Set up the complete mock chain for this specific test
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const result = await retryFailedScheduledEmails(3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retried).toBe(0);
        expect(result.data.failed).toBe(0);
      }
    });

    it('should return DATABASE_ERROR when fetching failed emails fails', async () => {
      // Set up the mock chain to return an error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
            }),
          }),
        }),
      });

      const result = await retryFailedScheduledEmails(3);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return success with zero count when no data returned', async () => {
      // Set up the mock chain to return null data but no error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      const result = await retryFailedScheduledEmails(3);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retried).toBe(0);
        expect(result.data.failed).toBe(0);
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      // Set up the mock to throw an error
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await retryFailedScheduledEmails(3);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('cancelScheduledEmail', () => {
    it('should return success when email cancelled successfully', async () => {
      // Set up the complete mock chain for this specific test
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const result = await cancelScheduledEmail('email-123');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      // Set up the mock chain to return an error
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
          }),
        }),
      });

      const result = await cancelScheduledEmail('email-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      // Set up the mock to throw an error
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await cancelScheduledEmail('email-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});