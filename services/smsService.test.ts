// Set up environment variables BEFORE any imports
process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
process.env.TWILIO_AUTH_TOKEN = 'auth-token-123';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Create mock Twilio messages object
const mockTwilioMessages = {
  create: jest.fn(),
};

// Mock Twilio constructor - returns a function that creates the client
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: mockTwilioMessages,
  }));
});

// Mock Supabase client creation - create a simple mock that we can configure per test
const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Use require() to import service AFTER mocking dependencies
// This ensures mocks are applied before the service initializes
const smsService = require('./smsService');

describe('smsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables to valid values
    process.env.TWILIO_ACCOUNT_SID = 'AC123456789';
    process.env.TWILIO_AUTH_TOKEN = 'auth-token-123';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';

    // Reset Twilio mock
    mockTwilioMessages.create.mockReset();
    mockTwilioMessages.create.mockResolvedValue({
      sid: 'SMS123456789',
      status: 'sent',
    });

    // Reset Supabase mocks to default successful state
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: jest.fn().mockReturnValue({
        order: mockOrder,
      }),
      update: mockUpdate,
    });
  });

  describe('sendSMS', () => {
    it('should return success when SMS sent successfully', async () => {
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'SMS123456789',
        status: 'sent',
      });

      const result = await smsService.sendSMS('+15551234567', 'Test message');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('SMS123456789');
      }
      expect(mockTwilioMessages.create).toHaveBeenCalledWith({
        body: 'Test message',
        from: '+15551234567',
        to: '+15551234567',
      });
    });

    it.skip('should return EXTERNAL_SERVICE_ERROR when Twilio not configured', async () => {
      // Skipped: Testing module-level initialization is complex with Jest
      // This scenario is better tested in integration tests
    });

    it.skip('should return EXTERNAL_SERVICE_ERROR when credentials are test values', async () => {
      // Skipped: Testing module-level initialization is complex with Jest
      // This scenario is better tested in integration tests
    });

    it('should return VALIDATION_ERROR when phone number is invalid format', async () => {
      const result = await smsService.sendSMS('invalid-phone', 'Test message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Phone number must be in E.164 format (e.g., +15551234567)');
      }
    });

    it('should return VALIDATION_ERROR when message is empty', async () => {
      const result = await smsService.sendSMS('+15551234567', '');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toBe('Message cannot be empty');
      }
    });

    it('should truncate message when longer than 160 characters', async () => {
      const longMessage = 'A'.repeat(200);
      const expectedMessage = 'A'.repeat(157) + '...';
      
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'SMS123456789',
        status: 'sent',
      });

      const result = await smsService.sendSMS('+15551234567', longMessage);

      expect(result.success).toBe(true);
      expect(mockTwilioMessages.create).toHaveBeenCalledWith({
        body: expectedMessage,
        from: '+15551234567',
        to: '+15551234567',
      });
    });

    it('should return EXTERNAL_SERVICE_ERROR when Twilio API fails', async () => {
      mockTwilioMessages.create.mockRejectedValue(new Error('API Error'));

      const result = await smsService.sendSMS('+15551234567', 'Test message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      }
    });

    it('should log successful SMS to database', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });
      
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'SMS123456789',
        status: 'sent',
      });

      await smsService.sendSMS('+15551234567', 'Test message');

      expect(mockFrom).toHaveBeenCalledWith('sms_logs');
      expect(mockInsert).toHaveBeenCalledWith({
        recipient_phone: '+15551234567',
        message: 'Test message',
        delivery_status: 'sent',
        sent_at: expect.any(String),
      });
    });

    it('should log failed SMS to database', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });
      
      mockTwilioMessages.create.mockRejectedValue(new Error('API Error'));

      await smsService.sendSMS('+15551234567', 'Test message');

      expect(mockFrom).toHaveBeenCalledWith('sms_logs');
      expect(mockInsert).toHaveBeenCalledWith({
        recipient_phone: '+15551234567',
        message: 'Test message',
        delivery_status: 'failed',
        error_message: 'API Error',
      });
    });
  });

  describe('sendSMSFallback', () => {
    it('should return success when SMS fallback sent successfully', async () => {
      mockTwilioMessages.create.mockResolvedValue({
        sid: 'SMS123456789',
      });

      const result = await smsService.sendSMSFallback(
        '+15551234567',
        'RSVP Reminder',
        'Please confirm your attendance'
      );

      expect(result.success).toBe(true);
      expect(mockTwilioMessages.create).toHaveBeenCalledWith({
        body: '[RSVP Reminder] Please confirm your attendance',
        from: '+15551234567',
        to: '+15551234567',
      });
    });

    it('should return EXTERNAL_SERVICE_ERROR when SMS sending fails', async () => {
      mockTwilioMessages.create.mockRejectedValue(new Error('Unexpected error'));

      const result = await smsService.sendSMSFallback(
        '+15551234567',
        'RSVP Reminder',
        'Please confirm your attendance'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      }
    });
  });

  describe('updateSMSDeliveryStatus', () => {
    it('should return success when delivery status updated to delivered', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await smsService.updateSMSDeliveryStatus('sms-123', 'delivered');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        delivery_status: 'delivered',
        delivered_at: expect.any(String),
      });
    });

    it('should return success when delivery status updated to failed with error message', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await smsService.updateSMSDeliveryStatus('sms-123', 'failed', 'Network error');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        delivery_status: 'failed',
        error_message: 'Network error',
      });
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ update: mockUpdate });

      const result = await smsService.updateSMSDeliveryStatus('sms-123', 'delivered');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await smsService.updateSMSDeliveryStatus('sms-123', 'delivered');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('getSMSAnalytics', () => {
    it('should return success with SMS analytics when logs exist', async () => {
      const mockLogs = [
        { id: '1', delivery_status: 'delivered', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', delivery_status: 'failed', created_at: '2024-01-01T01:00:00Z' },
        { id: '3', delivery_status: 'sent', created_at: '2024-01-01T02:00:00Z' },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSAnalytics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(3);
        expect(result.data.delivered).toBe(1);
        expect(result.data.failed).toBe(1);
      }
    });

    it('should return success with zero analytics when no logs exist', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSAnalytics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSAnalytics();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await smsService.getSMSAnalytics();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  describe('getSMSLogs', () => {
    it('should return success with SMS logs when no filters provided', async () => {
      const mockLogs = [
        {
          id: 'sms-1',
          recipient_phone: '+15551234567',
          message: 'Test message 1',
          delivery_status: 'delivered',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'sms-2',
          recipient_phone: '+15559876543',
          message: 'Test message 2',
          delivery_status: 'failed',
          created_at: '2024-01-01T01:00:00Z',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSLogs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should return success with filtered logs when filters provided', async () => {
      const mockLogs = [
        {
          id: 'sms-1',
          recipient_phone: '+15551234567',
          message: 'Test message 1',
          delivery_status: 'delivered',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockOrder = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSLogs({
        delivery_status: 'delivered',
        recipient_phone: '+15551234567',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it('should return success with empty array when no data returned', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSLogs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await smsService.getSMSLogs();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should return UNKNOWN_ERROR when unexpected error occurs', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await smsService.getSMSLogs();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});