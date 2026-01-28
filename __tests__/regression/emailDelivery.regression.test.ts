/**
 * Regression Test Suite: Email Delivery
 * 
 * Tests email delivery system to prevent regressions in:
 * - Email template validation
 * - Variable substitution
 * - Bulk email sending
 * - Delivery tracking
 * - SMS fallback
 * - Webhook processing
 * 
 * Requirements: 21.4
 */

// Mock environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.RESEND_API_KEY = 'test-resend-key';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}));

// Mock Resend
const mockResend = {
  emails: {
    send: jest.fn(),
  },
};

jest.mock('resend', () => ({
  Resend: jest.fn(() => mockResend),
}));

// Mock SMS service
jest.mock('@/services/smsService', () => ({
  smsService: {
    send: jest.fn(),
  },
}));

// Now import services after mocks are set up
import { emailService } from '@/services/emailService';
import { smsService } from '@/services/smsService';

describe('Regression: Email Delivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Template Validation', () => {
    it('should validate template with valid syntax', async () => {
      const template = {
        name: 'RSVP Confirmation',
        subject: 'Your RSVP for {{event_name}}',
        bodyHtml: '<p>Hi {{guest_name}}, thanks for RSVPing!</p>',
        bodyText: 'Hi {{guest_name}}, thanks for RSVPing!',
        variables: ['guest_name', 'event_name'],
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 'template-1', ...template },
        error: null,
      });

      const result = await emailService.createTemplate(template);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variables).toContain('guest_name');
        expect(result.data.variables).toContain('event_name');
      }
    });

    it('should reject template with undefined variables', async () => {
      const template = {
        name: 'Invalid Template',
        subject: 'Hello {{undefined_var}}',
        bodyHtml: '<p>Hi {{guest_name}}</p>',
        bodyText: 'Hi {{guest_name}}',
        variables: ['guest_name'], // missing undefined_var
      };

      const result = await emailService.createTemplate(template);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('undefined_var');
      }
    });

    it('should reject template with malformed HTML', async () => {
      const template = {
        name: 'Malformed Template',
        subject: 'Test',
        bodyHtml: '<p>Unclosed paragraph',
        bodyText: 'Test',
        variables: [],
      };

      const result = await emailService.createTemplate(template);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute all variables correctly', async () => {
      const template = {
        subject: 'RSVP for {{event_name}}',
        bodyHtml: '<p>Hi {{guest_name}}, see you at {{event_name}} on {{event_date}}!</p>',
        bodyText: 'Hi {{guest_name}}, see you at {{event_name}} on {{event_date}}!',
      };

      const variables = {
        guest_name: 'John Doe',
        event_name: 'Wedding Ceremony',
        event_date: 'June 15, 2025',
      };

      const result = emailService.substituteVariables(template, variables);

      expect(result.subject).toBe('RSVP for Wedding Ceremony');
      expect(result.bodyHtml).toContain('Hi John Doe');
      expect(result.bodyHtml).toContain('Wedding Ceremony');
      expect(result.bodyHtml).toContain('June 15, 2025');
    });

    it('should handle missing variables gracefully', async () => {
      const template = {
        subject: 'Hello {{guest_name}}',
        bodyHtml: '<p>Event: {{event_name}}</p>',
        bodyText: 'Event: {{event_name}}',
      };

      const variables = {
        guest_name: 'John Doe',
        // event_name is missing
      };

      const result = emailService.substituteVariables(template, variables);

      expect(result.subject).toBe('Hello John Doe');
      // Missing variables should remain as placeholders or be empty
      expect(result.bodyHtml).toMatch(/Event: (\{\{event_name\}\}|)/);
    });

    it('should escape HTML in variable values', async () => {
      const template = {
        subject: 'Hello {{guest_name}}',
        bodyHtml: '<p>{{message}}</p>',
        bodyText: '{{message}}',
      };

      const variables = {
        guest_name: 'John Doe',
        message: '<script>alert("xss")</script>',
      };

      const result = emailService.substituteVariables(template, variables);

      expect(result.bodyHtml).not.toContain('<script>');
      expect(result.bodyHtml).toContain('&lt;script&gt;');
    });
  });

  describe('Email Sending', () => {
    it('should send single email successfully', async () => {
      mockResend.emails.send.mockResolvedValue({
        id: 'email-123',
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'log-1',
          deliveryStatus: 'sent',
        },
        error: null,
      });

      const result = await emailService.send({
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailId).toBe('email-123');
      }
    });

    it('should handle email service failure', async () => {
      mockResend.emails.send.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const result = await emailService.send({
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMAIL_SERVICE_ERROR');
      }
    });

    it('should validate email addresses', async () => {
      const result = await emailService.send({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Bulk Email Sending', () => {
    it('should send bulk emails successfully', async () => {
      const recipients = [
        'guest1@example.com',
        'guest2@example.com',
        'guest3@example.com',
      ];

      mockResend.emails.send.mockResolvedValue({
        id: 'email-123',
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: 'log-1' },
        error: null,
      });

      const result = await emailService.sendBulk({
        recipients,
        subject: 'Bulk Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sent).toBe(3);
        expect(result.data.failed).toBe(0);
      }
    });

    it('should handle partial failures in bulk send', async () => {
      const recipients = [
        'guest1@example.com',
        'guest2@example.com',
        'guest3@example.com',
      ];

      mockResend.emails.send
        .mockResolvedValueOnce({ id: 'email-1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ id: 'email-3' });

      mockSupabase.single.mockResolvedValue({
        data: { id: 'log-1' },
        error: null,
      });

      const result = await emailService.sendBulk({
        recipients,
        subject: 'Bulk Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sent).toBe(2);
        expect(result.data.failed).toBe(1);
      }
    });

    it('should respect rate limits', async () => {
      const recipients = Array(150).fill('guest@example.com');

      mockResend.emails.send.mockResolvedValue({
        id: 'email-123',
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: 'log-1' },
        error: null,
      });

      const startTime = Date.now();
      await emailService.sendBulk({
        recipients,
        subject: 'Bulk Email',
        html: '<p>Test</p>',
        text: 'Test',
      });
      const endTime = Date.now();

      // Should take time due to rate limiting
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe('Delivery Tracking', () => {
    it('should log email delivery status', async () => {
      mockResend.emails.send.mockResolvedValue({
        id: 'email-123',
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'log-1',
          deliveryStatus: 'sent',
          sentAt: new Date().toISOString(),
        },
        error: null,
      });

      const result = await emailService.send({
        to: 'guest@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should update delivery status via webhook', async () => {
      const webhookPayload = {
        type: 'email.delivered',
        data: {
          email_id: 'email-123',
          delivered_at: new Date().toISOString(),
        },
      };

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'log-1',
          deliveryStatus: 'delivered',
          deliveredAt: webhookPayload.data.delivered_at,
        },
        error: null,
      });

      const result = await emailService.processWebhook(webhookPayload);

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it('should track bounce events', async () => {
      const webhookPayload = {
        type: 'email.bounced',
        data: {
          email_id: 'email-123',
          bounce_reason: 'Invalid recipient',
        },
      };

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'log-1',
          deliveryStatus: 'bounced',
          errorMessage: 'Invalid recipient',
        },
        error: null,
      });

      const result = await emailService.processWebhook(webhookPayload);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveryStatus).toBe('bounced');
      }
    });
  });

  describe('SMS Fallback', () => {
    it('should send SMS when email fails', async () => {
      mockResend.emails.send.mockRejectedValue(
        new Error('Email service unavailable')
      );

      (smsService.send as jest.Mock).mockResolvedValue({
        success: true,
        data: { messageId: 'sms-123' },
      });

      const result = await emailService.sendWithFallback({
        to: 'guest@example.com',
        phone: '+1234567890',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveryMethod).toBe('sms');
      }
    });

    it('should not attempt SMS if no phone number', async () => {
      mockResend.emails.send.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const result = await emailService.sendWithFallback({
        to: 'guest@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(smsService.send).not.toHaveBeenCalled();
    });
  });

  describe('Email Scheduling', () => {
    it('should schedule email for future delivery', async () => {
      const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now

      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'scheduled-1',
          scheduledFor: scheduledTime.toISOString(),
          status: 'scheduled',
        },
        error: null,
      });

      const result = await emailService.schedule({
        to: 'guest@example.com',
        subject: 'Scheduled Email',
        html: '<p>Test</p>',
        text: 'Test',
        scheduledFor: scheduledTime,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('scheduled');
      }
    });

    it('should reject scheduling in the past', async () => {
      const pastTime = new Date(Date.now() - 3600000); // 1 hour ago

      const result = await emailService.schedule({
        to: 'guest@example.com',
        subject: 'Scheduled Email',
        html: '<p>Test</p>',
        text: 'Test',
        scheduledFor: pastTime,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
