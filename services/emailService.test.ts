/**
 * Email Service Tests
 * 
 * Tests for email template operations, sending logic, and delivery tracking.
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9, 12.10
 */

import type { CreateEmailTemplateDTO, UpdateEmailTemplateDTO, SendEmailDTO, EmailTemplate } from '@/schemas/emailSchemas';
import { ERROR_CODES } from '@/types';

// Set up environment variables BEFORE any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase - Pattern A
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = {
    from: mockFrom,
  };
  
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
  };
});

// Mock SMS service
jest.mock('./smsService', () => ({
  sendSMSFallback: jest.fn(),
}));

// Import service using require() AFTER mocking
const emailService = require('./emailService');
const {
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  listTemplates,
  sendEmail,
  sendBulkEmail,
  scheduleEmail,
  updateDeliveryStatus,
  getEmailAnalytics,
  getEmailLogs,
  sendEmailWithSMSFallback,
  setResendClient,
  resetResendClient,
} = emailService;

// Get the mocked from function
const { __mockFrom: mockFrom } = require('@supabase/supabase-js');

// Create a helper object that mimics the old mockSupabase interface
// This allows existing tests to work without modification
const mockSupabase = {
  from: mockFrom,
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn(),
};

// Mock Resend client
const mockResend = {
  emails: {
    send: jest.fn(),
  },
};

describe('emailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure mockFrom to return mockSupabase helper for chaining
    mockFrom.mockReturnValue(mockSupabase);
    
    // Reset mockSupabase methods to return themselves for chaining
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.delete.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.limit.mockReturnValue(mockSupabase);
    
    setResendClient(mockResend as any);
  });

  afterEach(() => {
    resetResendClient();
  });

  // ===== TEMPLATE OPERATIONS TESTS =====

  describe('createTemplate', () => {
    const validTemplateData: CreateEmailTemplateDTO = {
      name: 'Welcome Email',
      subject: 'Welcome {{guest_name}}!',
      body_html: '<p>Hello {{guest_name}}, welcome to our wedding!</p>',
      body_text: 'Hello {{guest_name}}, welcome to our wedding!',
      variables: ['guest_name'],
    };

    it('should return success with template data when valid input provided', async () => {
      const expectedTemplate: EmailTemplate = {
        id: 'template-1',
        ...validTemplateData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({ data: expectedTemplate, error: null });

      const result = await createTemplate(validTemplateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('template-1');
        expect(result.data.name).toBe('Welcome Email');
        expect(result.data.variables).toEqual(['guest_name']);
      }
    });

    it('should return VALIDATION_ERROR when name is empty', async () => {
      const invalidData = { ...validTemplateData, name: '' };

      const result = await createTemplate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should return VALIDATION_ERROR when template contains undefined variables', async () => {
      const invalidData = {
        ...validTemplateData,
        body_html: '<p>Hello {{undefined_var}}, welcome!</p>',
        variables: ['guest_name'], // missing 'undefined_var'
      };

      const result = await createTemplate(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Template contains undefined variables');
        expect(result.error.details).toEqual({ undefinedVariables: ['undefined_var'] });
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Connection failed' } });

      const result = await createTemplate(validTemplateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
        expect(result.error.message).toBe('Connection failed');
      }
    });

    it('should sanitize HTML content to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validTemplateData,
        body_html: '<p>Hello {{guest_name}}</p><script>alert("xss")</script>',
      };

      const expectedTemplate: EmailTemplate = {
        id: 'template-1',
        ...maliciousData,
        body_html: '<p>Hello {{guest_name}}</p>', // script tag removed
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({ data: expectedTemplate, error: null });

      const result = await createTemplate(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body_html).not.toContain('<script>');
        expect(result.data.body_html).not.toContain('alert');
      }
    });
  });

  describe('getTemplate', () => {
    it('should return success with template data when template exists', async () => {
      const template: EmailTemplate = {
        id: 'template-1',
        name: 'Welcome Email',
        subject: 'Welcome!',
        body_html: '<p>Hello!</p>',
        body_text: 'Hello!',
        variables: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({ data: template, error: null });

      const result = await getTemplate('template-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('template-1');
        expect(result.data.name).toBe('Welcome Email');
      }
    });

    it('should return NOT_FOUND when template does not exist', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'No rows returned' } });

      const result = await getTemplate('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
        expect(result.error.message).toBe('Template not found');
      }
    });
  });

  describe('updateTemplate', () => {
    const updateData: UpdateEmailTemplateDTO = {
      name: 'Updated Welcome Email',
      subject: 'Welcome {{guest_name}}!',
    };

    it('should return success with updated template data when valid input provided', async () => {
      const existingTemplate: EmailTemplate = {
        id: 'template-1',
        name: 'Welcome Email',
        subject: 'Welcome!',
        body_html: '<p>Hello!</p>',
        body_text: 'Hello!',
        variables: ['guest_name'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedTemplate: EmailTemplate = {
        ...existingTemplate,
        ...updateData,
        updated_at: '2024-01-01T01:00:00Z',
      };

      // Mock getTemplate call first, then update call
      mockSupabase.single
        .mockResolvedValueOnce({ data: existingTemplate, error: null })
        .mockResolvedValueOnce({ data: updatedTemplate, error: null });

      const result = await updateTemplate('template-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Welcome Email');
        expect(result.data.subject).toBe('Welcome {{guest_name}}!');
      }
    });

    it('should return NOT_FOUND when template does not exist', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'No rows returned' } });

      const result = await updateTemplate('nonexistent', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });
  });

  describe('deleteTemplate', () => {
    it('should return success when template is deleted', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      const result = await deleteTemplate('template-1');

      expect(result.success).toBe(true);
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: { message: 'Foreign key constraint' } });

      const result = await deleteTemplate('template-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      }
    });
  });

  describe('listTemplates', () => {
    it('should return success with templates list', async () => {
      const templates: EmailTemplate[] = [
        {
          id: 'template-1',
          name: 'Welcome Email',
          subject: 'Welcome!',
          body_html: '<p>Hello!</p>',
          body_text: 'Hello!',
          variables: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'template-2',
          name: 'RSVP Reminder',
          subject: 'RSVP Reminder',
          body_html: '<p>Please RSVP!</p>',
          body_text: 'Please RSVP!',
          variables: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: templates, error: null });

      const result = await listTemplates();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Welcome Email');
        expect(result.data[1].name).toBe('RSVP Reminder');
      }
    });

    it('should return empty array when no templates exist', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await listTemplates();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  // ===== SENDING LOGIC TESTS =====

  describe('sendEmail', () => {
    const validEmailData: SendEmailDTO = {
      to: 'guest@example.com',
      subject: 'Welcome!',
      html: '<p>Hello!</p>',
      text: 'Hello!',
    };

    beforeEach(() => {
      // Mock successful email log insertion
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });
    });

    it('should return success with email ID when email is sent successfully', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const result = await sendEmail(validEmailData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('email-123');
      }

      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'onboarding@resend.dev',
        to: 'guest@example.com',
        subject: 'Welcome!',
        html: '<p>Hello!</p>',
        text: 'Hello!',
      });
    });

    it('should return VALIDATION_ERROR when email address is invalid', async () => {
      const invalidData = { ...validEmailData, to: 'invalid-email' };

      const result = await sendEmail(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Validation failed');
      }
    });

    it('should return EMAIL_SERVICE_ERROR when Resend fails', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'API key invalid' },
      });

      const result = await sendEmail(validEmailData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.EMAIL_SERVICE_ERROR);
        expect(result.error.message).toBe('API key invalid');
      }
    });

    it('should substitute template variables when template_id provided', async () => {
      const templateId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID
      const template: EmailTemplate = {
        id: templateId,
        name: 'Welcome Email',
        subject: 'Welcome {{guest_name}}!',
        body_html: '<p>Hello {{guest_name}}!</p>',
        body_text: 'Hello {{guest_name}}!',
        variables: ['guest_name'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Setup complete mock chain for getTemplate call
      // getTemplate does: supabase.from('email_templates').select('*').eq('id', id).single()
      const mockSingleForTemplate = jest.fn().mockResolvedValue({ data: template, error: null });
      const mockEqForTemplate = jest.fn().mockReturnValue({ single: mockSingleForTemplate });
      const mockSelectForTemplate = jest.fn().mockReturnValue({ eq: mockEqForTemplate });
      const mockFromForTemplate = jest.fn().mockReturnValue({ select: mockSelectForTemplate });
      
      // Setup mock chain for email log insertion
      // sendEmail does: supabase.from('email_logs').insert({...}).select().single()
      const mockSingleForLog = jest.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null });
      const mockSelectForLog = jest.fn().mockReturnValue({ single: mockSingleForLog });
      const mockInsertForLog = jest.fn().mockReturnValue({ select: mockSelectForLog });
      const mockFromForLog = jest.fn().mockReturnValue({ insert: mockInsertForLog });
      
      // Configure mockFrom to return the right chain based on table name
      mockFrom.mockImplementation((table: string) => {
        if (table === 'email_templates') {
          return { select: mockSelectForTemplate };
        } else if (table === 'email_logs') {
          return { insert: mockInsertForLog };
        }
        return mockSupabase;
      });

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const emailWithTemplate: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Welcome!', // Will be overridden by template
        html: '<p>Hello!</p>', // Will be overridden by template
        text: 'Hello!', // Add text field to pass validation
        template_id: templateId,
        variables: { guest_name: 'John Doe' },
      };

      const result = await sendEmail(emailWithTemplate);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('email-123');
      }
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'onboarding@resend.dev',
        to: 'guest@example.com',
        subject: 'Welcome John Doe!',
        html: '<p>Hello John Doe!</p>',
        text: 'Hello John Doe!',
      });
    });

    it('should return NOT_FOUND when template_id does not exist', async () => {
      // Setup complete mock chain for getTemplate call that returns null
      const mockSingleForTemplate = jest.fn().mockResolvedValue({ data: null, error: { message: 'No rows returned' } });
      const mockEqForTemplate = jest.fn().mockReturnValue({ single: mockSingleForTemplate });
      const mockSelectForTemplate = jest.fn().mockReturnValue({ eq: mockEqForTemplate });
      
      // Configure mockFrom to return the template chain
      mockFrom.mockImplementation((table: string) => {
        if (table === 'email_templates') {
          return { select: mockSelectForTemplate };
        }
        return mockSupabase;
      });

      const emailWithTemplate: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Welcome!',
        html: '<p>Hello!</p>',
        text: 'Hello!', // Add text field to pass validation
        template_id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
      };

      const result = await sendEmail(emailWithTemplate);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
        expect(result.error.message).toBe('Template not found');
      }
    });
  });

  describe('sendBulkEmail', () => {
    it('should return success with sent/failed counts when bulk email is sent', async () => {
      const bulkEmailData = {
        recipients: ['guest1@example.com', 'guest2@example.com', 'guest3@example.com'],
        subject: 'Bulk Email',
        html: '<p>Hello everyone!</p>',
        text: 'Hello everyone!',
      };

      // Mock successful sends for first two, failure for third
      mockResend.emails.send
        .mockResolvedValueOnce({ data: { id: 'email-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'email-2' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } });

      // Mock email log insertions
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

      const result = await sendBulkEmail(bulkEmailData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sent).toBe(2);
        expect(result.data.failed).toBe(1);
      }

      expect(mockResend.emails.send).toHaveBeenCalledTimes(3);
    });

    it('should return VALIDATION_ERROR when recipients array is empty', async () => {
      const invalidData = {
        recipients: [],
        subject: 'Bulk Email',
        html: '<p>Hello!</p>',
      };

      const result = await sendBulkEmail(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });
  });

  describe('scheduleEmail', () => {
    it('should return success with scheduled email ID when email is scheduled', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
      const scheduleData = {
        to: 'guest@example.com',
        subject: 'Scheduled Email',
        html: '<p>This is scheduled!</p>',
        text: 'This is scheduled!', // Add text field to pass validation
        scheduled_at: futureDate,
      };

      const scheduledEmail = {
        id: 'scheduled-1',
        recipient_email: 'guest@example.com',
        subject: 'Scheduled Email',
        html: '<p>This is scheduled!</p>',
        text: 'This is scheduled!',
        scheduled_at: futureDate,
        status: 'pending',
      };

      // Setup mock chain for scheduled_emails insert
      const mockSelectChain = {
        single: jest.fn().mockResolvedValue({ data: scheduledEmail, error: null }),
      };
      const mockInsertChain = {
        select: jest.fn().mockReturnValue(mockSelectChain),
      };
      mockSupabase.insert.mockReturnValue(mockInsertChain);

      const result = await scheduleEmail(scheduleData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('scheduled-1');
      }
    });

    it('should return VALIDATION_ERROR when scheduled time is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
      const scheduleData = {
        to: 'guest@example.com',
        subject: 'Scheduled Email',
        html: '<p>This is scheduled!</p>',
        scheduled_at: pastDate,
      };

      const result = await scheduleEmail(scheduleData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe('Scheduled time must be in the future');
      }
    });
  });

  describe('sendEmailWithSMSFallback', () => {
    const { sendSMSFallback } = require('./smsService');

    it('should return email result when email sends successfully', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

      const emailData: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Hello!</p>',
        text: 'Hello!',
      };

      const result = await sendEmailWithSMSFallback(emailData, '+15551234567');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('email-123');
        expect(result.data.method).toBe('email');
      }

      expect(sendSMSFallback).not.toHaveBeenCalled();
    });

    it('should fallback to SMS when email fails and phone number provided', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Email service down' },
      });
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

      sendSMSFallback.mockResolvedValue({
        success: true,
        data: { id: 'sms-123' },
      });

      const emailData: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Hello!</p>',
        text: 'Hello!',
      };

      const result = await sendEmailWithSMSFallback(emailData, '+15551234567');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('sms-123');
        expect(result.data.method).toBe('sms');
      }

      expect(sendSMSFallback).toHaveBeenCalledWith(
        '+15551234567',
        'Test Email',
        'Hello!'
      );
    });

    it('should return email error when email fails and no phone number provided', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Email service down' },
      });
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

      const emailData: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Hello!</p>',
      };

      const result = await sendEmailWithSMSFallback(emailData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.EMAIL_SERVICE_ERROR);
      }

      expect(sendSMSFallback).not.toHaveBeenCalled();
    });

    it('should return EXTERNAL_SERVICE_ERROR when both email and SMS fail', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Email service down' },
      });
      mockSupabase.single.mockResolvedValue({ data: { id: 'log-1' }, error: null });

      sendSMSFallback.mockResolvedValue({
        success: false,
        error: { code: ERROR_CODES.EXTERNAL_SERVICE_ERROR, message: 'SMS service down' },
      });

      const emailData: SendEmailDTO = {
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Hello!</p>',
      };

      const result = await sendEmailWithSMSFallback(emailData, '+15551234567');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR);
        expect(result.error.message).toBe('Both email and SMS delivery failed');
      }
    });
  });

  // ===== DELIVERY TRACKING TESTS =====

  describe('updateDeliveryStatus', () => {
    it('should return success when delivery status is updated to delivered', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      const result = await updateDeliveryStatus('log-1', 'delivered');

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        delivery_status: 'delivered',
        delivered_at: expect.any(String),
      });
    });

    it('should return success when delivery status is updated to failed with error message', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      const result = await updateDeliveryStatus('log-1', 'failed', 'Bounce detected');

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        delivery_status: 'failed',
        error_message: 'Bounce detected',
      });
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: { message: 'Connection failed' } });

      const result = await updateDeliveryStatus('log-1', 'delivered');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      }
    });
  });

  describe('getEmailAnalytics', () => {
    it('should return success with analytics data', async () => {
      const emailLogs = [
        { delivery_status: 'sent' },
        { delivery_status: 'delivered' },
        { delivery_status: 'delivered' },
        { delivery_status: 'failed' },
        { delivery_status: 'bounced' },
      ];

      mockSupabase.select.mockResolvedValue({ data: emailLogs, error: null });

      const result = await getEmailAnalytics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(5);
        expect(result.data.sent).toBe(1);
        expect(result.data.delivered).toBe(2);
        expect(result.data.failed).toBe(1);
        expect(result.data.bounced).toBe(1);
      }
    });

    it('should return empty analytics when no logs exist', async () => {
      mockSupabase.select.mockResolvedValue({ data: [], error: null });

      const result = await getEmailAnalytics();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.sent).toBe(0);
        expect(result.data.delivered).toBe(0);
        expect(result.data.failed).toBe(0);
        expect(result.data.bounced).toBe(0);
      }
    });
  });

  describe('getEmailLogs', () => {
    const sampleLogs = [
      {
        id: 'log-1',
        template_id: 'template-1',
        recipient_email: 'guest1@example.com',
        subject: 'Welcome!',
        delivery_status: 'delivered',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'log-2',
        template_id: 'template-2',
        recipient_email: 'guest2@example.com',
        subject: 'RSVP Reminder',
        delivery_status: 'sent',
        created_at: '2024-01-01T01:00:00Z',
      },
    ];

    it('should return success with all logs when no filters provided', async () => {
      mockSupabase.order.mockResolvedValue({ data: sampleLogs, error: null });

      const result = await getEmailLogs();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('log-1');
        expect(result.data[1].id).toBe('log-2');
      }
    });

    it('should return success with filtered logs when filters provided', async () => {
      const filteredLogs = [sampleLogs[0]]; // Only delivered emails
      mockSupabase.limit.mockResolvedValue({ data: filteredLogs, error: null });

      const result = await getEmailLogs({
        delivery_status: 'delivered',
        limit: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].delivery_status).toBe('delivered');
      }
    });

    it('should return empty array when no logs match filters', async () => {
      mockSupabase.eq.mockResolvedValue({ data: [], error: null });

      const result = await getEmailLogs({
        recipient_email: 'nonexistent@example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});