import type { SendEmailDTO } from '@/schemas/emailSchemas';

/**
 * Unit Test for Email-to-SMS Fallback
 * 
 * Tests that email failure triggers SMS fallback.
 * Validates: Requirements 13.10
 */

// Mock the SMS service
jest.mock('./smsService', () => ({
  sendSMSFallback: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'log-123' }, error: null })),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

// Import after mocks are set up
import { sendEmailWithSMSFallback, setResendClient, resetResendClient } from './emailService';
import { sendSMSFallback } from './smsService';

const mockSendSMSFallback = sendSMSFallback as jest.MockedFunction<typeof sendSMSFallback>;

describe('Email-to-SMS Fallback', () => {
  const mockEmailData: SendEmailDTO = {
    to: 'guest@example.com',
    subject: 'RSVP Reminder',
    html: '<p>Please RSVP by Friday</p>',
    text: 'Please RSVP by Friday',
  };

  const mockPhone = '+15551234567';
  let mockEmailsSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock Resend client
    mockEmailsSend = jest.fn();
    const mockResendClient = {
      emails: {
        send: mockEmailsSend,
      },
    } as any;
    
    // Inject the mock client
    setResendClient(mockResendClient);
  });

  afterEach(() => {
    resetResendClient();
  });

  it('should send email successfully without triggering SMS fallback', async () => {
    // Mock successful email send - Resend returns { data, error } structure
    mockEmailsSend.mockResolvedValue({
      data: {
        id: 'email-123',
      },
      error: null,
    });

    const result = await sendEmailWithSMSFallback(mockEmailData, mockPhone);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe('email');
      expect(result.data.id).toBe('email-123');
    }

    // SMS should not be called
    expect(mockSendSMSFallback).not.toHaveBeenCalled();
  });

  it('should trigger SMS fallback when email fails', async () => {
    // Mock failed email send - Resend returns error in the response
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock successful SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: true,
      data: { id: 'sms-456' },
    });

    const result = await sendEmailWithSMSFallback(mockEmailData, mockPhone);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe('sms');
      expect(result.data.id).toBe('sms-456');
    }

    // SMS should be called with correct parameters
    expect(mockSendSMSFallback).toHaveBeenCalledWith(
      mockPhone,
      mockEmailData.subject,
      mockEmailData.text
    );
  });

  it('should strip HTML tags when falling back to SMS', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock successful SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: true,
      data: { id: 'sms-789' },
    });

    const emailDataWithHTML: SendEmailDTO = {
      to: 'guest@example.com',
      subject: 'RSVP Reminder',
      html: '<p>Please <strong>RSVP</strong> by <em>Friday</em></p>',
    };

    await sendEmailWithSMSFallback(emailDataWithHTML, mockPhone);

    // SMS should be called with HTML stripped
    expect(mockSendSMSFallback).toHaveBeenCalledWith(
      mockPhone,
      emailDataWithHTML.subject,
      'Please RSVP by Friday'
    );
  });

  it('should return error when email fails and no phone number provided', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    const result = await sendEmailWithSMSFallback(mockEmailData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('EMAIL_SERVICE_ERROR');
    }

    // SMS should not be called
    expect(mockSendSMSFallback).not.toHaveBeenCalled();
  });

  it('should return error when both email and SMS fail', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock failed SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'SMS service unavailable',
      },
    });

    const result = await sendEmailWithSMSFallback(mockEmailData, mockPhone);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(result.error.message).toContain('Both email and SMS delivery failed');
      expect(result.error.details).toBeDefined();
    }
  });

  it('should use text body if provided, otherwise strip HTML', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock successful SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: true,
      data: { id: 'sms-999' },
    });

    const emailDataWithText: SendEmailDTO = {
      to: 'guest@example.com',
      subject: 'Test',
      html: '<p>HTML version</p>',
      text: 'Text version',
    };

    await sendEmailWithSMSFallback(emailDataWithText, mockPhone);

    // Should use text body, not HTML
    expect(mockSendSMSFallback).toHaveBeenCalledWith(
      mockPhone,
      'Test',
      'Text version'
    );
  });

  it('should handle email with template variables', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock successful SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: true,
      data: { id: 'sms-111' },
    });

    const emailDataWithTemplate: SendEmailDTO = {
      to: 'guest@example.com',
      subject: 'Hello {{guest_name}}',
      html: '<p>Welcome {{guest_name}} to our wedding</p>',
      template_id: 'template-123',
      variables: { guest_name: 'John' },
    };

    await sendEmailWithSMSFallback(emailDataWithTemplate, mockPhone);

    // SMS fallback should be triggered
    expect(mockSendSMSFallback).toHaveBeenCalled();
  });

  it('should handle long email content by truncating for SMS', async () => {
    // Mock failed email send
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service unavailable' },
    });

    // Mock successful SMS send
    mockSendSMSFallback.mockResolvedValue({
      success: true,
      data: { id: 'sms-222' },
    });

    const longContent = 'A'.repeat(500);
    const emailDataWithLongContent: SendEmailDTO = {
      to: 'guest@example.com',
      subject: 'Long Message',
      html: `<p>${longContent}</p>`,
    };

    await sendEmailWithSMSFallback(emailDataWithLongContent, mockPhone);

    // SMS should be called (truncation happens in smsService)
    expect(mockSendSMSFallback).toHaveBeenCalledWith(
      mockPhone,
      'Long Message',
      longContent
    );
  });
});
