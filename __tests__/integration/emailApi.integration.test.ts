/**
 * Integration Test: Email API
 * 
 * Tests email sending, template management, and email logs API endpoints.
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock the email service BEFORE importing route handlers
jest.mock('@/services/emailService', () => ({
  getEmailLogs: jest.fn(),
  sendBulkEmail: jest.fn(),
  listTemplates: jest.fn(),
  createTemplate: jest.fn(),
  getTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  getEmailAnalytics: jest.fn(),
}));

// Mock Next.js server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
  NextRequest: jest.fn(),
}));

// Mock the Supabase server client
jest.mock('@/lib/supabaseServer', () => ({
  createAuthenticatedClient: jest.fn(),
}));

// Import route handlers after mocking
import { GET as getEmailLogs } from '@/app/api/admin/emails/route';
import { POST as sendBulkEmail } from '@/app/api/admin/emails/send/route';
import { GET as getEmailTemplates, POST as createEmailTemplate } from '@/app/api/admin/emails/templates/route';
import { GET as getEmailTemplate, PUT as updateEmailTemplate, DELETE as deleteEmailTemplate } from '@/app/api/admin/emails/templates/[id]/route';
import { GET as getEmailAnalytics } from '@/app/api/admin/emails/analytics/route';

describe('Email API Integration Tests', () => {
  let mockSupabase: any;
  let mockGetEmailLogs: jest.Mock;
  let mockSendBulkEmail: jest.Mock;
  let mockListTemplates: jest.Mock;
  let mockCreateTemplate: jest.Mock;
  let mockGetTemplate: jest.Mock;
  let mockUpdateTemplate: jest.Mock;
  let mockDeleteTemplate: jest.Mock;
  let mockGetEmailAnalytics: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
      },
    };

    // Mock service functions
    mockGetEmailLogs = require('@/services/emailService').getEmailLogs;
    mockSendBulkEmail = require('@/services/emailService').sendBulkEmail;
    mockListTemplates = require('@/services/emailService').listTemplates;
    mockCreateTemplate = require('@/services/emailService').createTemplate;
    mockGetTemplate = require('@/services/emailService').getTemplate;
    mockUpdateTemplate = require('@/services/emailService').updateTemplate;
    mockDeleteTemplate = require('@/services/emailService').deleteTemplate;
    mockGetEmailAnalytics = require('@/services/emailService').getEmailAnalytics;

    // Mock createAuthenticatedClient
    const { createAuthenticatedClient } = require('@/lib/supabaseServer');
    createAuthenticatedClient.mockResolvedValue(mockSupabase);

    // Mock successful authentication by default
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'admin@example.com' },
          access_token: 'mock-token',
        },
      },
      error: null,
    });
  });

  describe('GET /api/admin/emails', () => {
    it('should return email logs when authenticated', async () => {
      // Arrange
      const mockEmailLogs = [
        {
          id: 'log-1',
          recipient_email: 'guest@example.com',
          subject: 'RSVP Reminder',
          delivery_status: 'delivered',
          sent_at: '2024-01-01T10:00:00Z',
          delivered_at: '2024-01-01T10:01:00Z',
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'log-2',
          recipient_email: 'guest2@example.com',
          subject: 'Welcome Email',
          delivery_status: 'sent',
          sent_at: '2024-01-01T11:00:00Z',
          created_at: '2024-01-01T11:00:00Z',
        },
      ];

      mockGetEmailLogs.mockResolvedValue({
        success: true,
        data: mockEmailLogs,
      });

      const request = new Request('http://localhost:3000/api/admin/emails', {
        method: 'GET',
      });

      // Act
      const response = await getEmailLogs(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockEmailLogs);
      expect(mockGetEmailLogs).toHaveBeenCalledWith();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails', {
        method: 'GET',
      });

      // Act
      const response = await getEmailLogs(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockGetEmailLogs).not.toHaveBeenCalled();
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      mockGetEmailLogs.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails', {
        method: 'GET',
      });

      // Act
      const response = await getEmailLogs(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const request = new Request('http://localhost:3000/api/admin/emails', {
        method: 'GET',
      });

      // Act
      const response = await getEmailLogs(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/admin/emails/send', () => {
    it('should send bulk email when authenticated with valid data', async () => {
      // Arrange
      const bulkEmailData = {
        recipients: ['guest1@example.com', 'guest2@example.com'],
        subject: 'Wedding Update',
        html: '<p>Important wedding information</p>',
        text: 'Important wedding information',
      };

      mockSendBulkEmail.mockResolvedValue({
        success: true,
        data: { sent: 2, failed: 0 },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkEmailData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.sent).toBe(2);
      expect(data.data.failed).toBe(0);
      expect(mockSendBulkEmail).toHaveBeenCalledWith(bulkEmailData);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: ['test@example.com'],
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockSendBulkEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email data', async () => {
      // Arrange
      const invalidData = {
        recipients: ['invalid-email'], // Invalid email format
        subject: '', // Empty subject
        html: '', // Empty HTML
      };

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toBeDefined();
      expect(mockSendBulkEmail).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const incompleteData = {
        recipients: ['test@example.com'],
        // Missing subject and html
      };

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockSendBulkEmail).not.toHaveBeenCalled();
    });

    it('should return 500 when email service fails', async () => {
      // Arrange
      const validData = {
        recipients: ['test@example.com'],
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      mockSendBulkEmail.mockResolvedValue({
        success: false,
        error: {
          code: 'EMAIL_SERVICE_ERROR',
          message: 'Resend API error',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('EMAIL_SERVICE_ERROR');
    });

    it('should handle template-based bulk emails', async () => {
      // Arrange
      const templateData = {
        recipients: ['guest1@example.com', 'guest2@example.com'],
        subject: 'RSVP Reminder',
        html: '<p>Please RSVP by {{deadline}}</p>',
        template_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        variables: { deadline: '2024-02-01' },
      };

      mockSendBulkEmail.mockResolvedValue({
        success: true,
        data: { sent: 2, failed: 0 },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendBulkEmail).toHaveBeenCalledWith(templateData);
    });

    it('should validate maximum recipients limit', async () => {
      // Arrange - Create array with 101 recipients (over limit)
      const tooManyRecipients = Array.from({ length: 101 }, (_, i) => `user${i}@example.com`);
      const invalidData = {
        recipients: tooManyRecipients,
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockSendBulkEmail).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/emails/templates', () => {
    it('should return email templates when authenticated', async () => {
      // Arrange
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'RSVP Reminder',
          subject: 'Please RSVP by {{deadline}}',
          body_html: '<p>Dear {{guest_name}}, please RSVP by {{deadline}}</p>',
          body_text: 'Dear {{guest_name}}, please RSVP by {{deadline}}',
          variables: ['guest_name', 'deadline'],
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'template-2',
          name: 'Welcome Email',
          subject: 'Welcome to our wedding!',
          body_html: '<p>Welcome {{guest_name}}! We are excited to celebrate with you.</p>',
          body_text: 'Welcome {{guest_name}}! We are excited to celebrate with you.',
          variables: ['guest_name'],
          created_at: '2024-01-01T11:00:00Z',
          updated_at: '2024-01-01T11:00:00Z',
        },
      ];

      mockListTemplates.mockResolvedValue({
        success: true,
        data: mockTemplates,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplates(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTemplates);
      expect(data.data).toHaveLength(2);
      expect(mockListTemplates).toHaveBeenCalledWith();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplates(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockListTemplates).not.toHaveBeenCalled();
    });

    it('should return empty array when no templates exist', async () => {
      // Arrange
      mockListTemplates.mockResolvedValue({
        success: true,
        data: [],
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplates(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.data).toHaveLength(0);
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      mockListTemplates.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch templates',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplates(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle templates with complex variables', async () => {
      // Arrange
      const complexTemplate = {
        id: 'template-complex',
        name: 'Activity Reminder',
        subject: '{{activity_name}} reminder for {{event_date}}',
        body_html: `
          <h1>{{activity_name}}</h1>
          <p>Dear {{guest_name}},</p>
          <p>This is a reminder about {{activity_name}} on {{event_date}} at {{event_time}}.</p>
          <p>Location: {{location_name}}</p>
          <p>Please arrive by {{arrival_time}}.</p>
        `,
        body_text: 'Dear {{guest_name}}, reminder about {{activity_name}} on {{event_date}} at {{event_time}}. Location: {{location_name}}. Please arrive by {{arrival_time}}.',
        variables: ['guest_name', 'activity_name', 'event_date', 'event_time', 'location_name', 'arrival_time'],
        created_at: '2024-01-01T12:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
      };

      mockListTemplates.mockResolvedValue({
        success: true,
        data: [complexTemplate],
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplates(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].variables).toHaveLength(6);
      expect(data.data[0].variables).toContain('guest_name');
      expect(data.data[0].variables).toContain('activity_name');
    });
  });

  describe('POST /api/admin/emails/templates', () => {
    it('should create email template when authenticated with valid data', async () => {
      // Arrange
      const templateData = {
        name: 'New Template',
        subject: 'Hello {{guest_name}}',
        body_html: '<p>Hello {{guest_name}}, welcome!</p>',
        body_text: 'Hello {{guest_name}}, welcome!',
        variables: ['guest_name'],
      };

      const createdTemplate = {
        id: 'template-new',
        ...templateData,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      mockCreateTemplate.mockResolvedValue({
        success: true,
        data: createdTemplate,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      // Act
      const response = await createEmailTemplate(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('template-new');
      expect(data.data.name).toBe('New Template');
      expect(mockCreateTemplate).toHaveBeenCalledWith(templateData);
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Template',
          subject: 'Test',
          body_html: '<p>Test</p>',
        }),
      });

      // Act
      const response = await createEmailTemplate(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid template data', async () => {
      // Arrange
      const invalidData = {
        name: '', // Empty name
        subject: 'Test',
        body_html: '', // Empty HTML
      };

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await createEmailTemplate(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toBeDefined();
      expect(mockCreateTemplate).not.toHaveBeenCalled();
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      const validData = {
        name: 'Test Template',
        subject: 'Test Subject',
        body_html: '<p>Test content</p>',
        body_text: 'Test content',
        variables: ['guest_name'],
      };

      mockCreateTemplate.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create template',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });

      // Act
      const response = await createEmailTemplate(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/emails/templates/[id]', () => {
    it('should return specific template when authenticated', async () => {
      // Arrange
      const mockTemplate = {
        id: 'template-1',
        name: 'RSVP Reminder',
        subject: 'Please RSVP by {{deadline}}',
        body_html: '<p>Dear {{guest_name}}, please RSVP by {{deadline}}</p>',
        body_text: 'Dear {{guest_name}}, please RSVP by {{deadline}}',
        variables: ['guest_name', 'deadline'],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      };

      mockGetTemplate.mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTemplate);
      expect(mockGetTemplate).toHaveBeenCalledWith('template-1');
    });

    it('should return 404 when template not found', async () => {
      // Arrange
      mockGetTemplate.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/nonexistent', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplate(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'GET',
      });

      // Act
      const response = await getEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockGetTemplate).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/admin/emails/templates/[id]', () => {
    it('should update template when authenticated with valid data', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Template',
        subject: 'Updated {{guest_name}}',
        body_html: '<p>Updated {{guest_name}}</p>',
      };

      const updatedTemplate = {
        id: 'template-1',
        ...updateData,
        body_text: 'Updated {{guest_name}}',
        variables: ['guest_name'],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z',
      };

      mockUpdateTemplate.mockResolvedValue({
        success: true,
        data: updatedTemplate,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await updateEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Template');
      expect(mockUpdateTemplate).toHaveBeenCalledWith('template-1', updateData);
    });

    it('should return 404 when template not found', async () => {
      // Arrange
      mockUpdateTemplate.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });

      // Act
      const response = await updateEmailTemplate(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      // Arrange
      const invalidData = {
        name: '', // Empty name
      };

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await updateEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockUpdateTemplate).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/emails/templates/[id]', () => {
    it('should delete template when authenticated', async () => {
      // Arrange
      mockDeleteTemplate.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'DELETE',
      });

      // Act
      const response = await deleteEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1');
    });

    it('should return 404 when template not found', async () => {
      // Arrange
      mockDeleteTemplate.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/nonexistent', {
        method: 'DELETE',
      });

      // Act
      const response = await deleteEmailTemplate(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/templates/template-1', {
        method: 'DELETE',
      });

      // Act
      const response = await deleteEmailTemplate(request, { params: Promise.resolve({ id: 'template-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/admin/emails/analytics', () => {
    it('should return email analytics when authenticated', async () => {
      // Arrange
      const mockAnalytics = {
        total: 150,
        delivered: 140,
        bounced: 5,
        failed: 5,
        delivery_rate: 93.33,
        bounce_rate: 3.33,
        failure_rate: 3.33,
        recent_activity: [
          {
            date: '2024-01-01',
            sent: 25,
            delivered: 24,
            bounced: 1,
            failed: 0,
          },
          {
            date: '2024-01-02',
            sent: 30,
            delivered: 28,
            bounced: 1,
            failed: 1,
          },
        ],
      };

      mockGetEmailAnalytics.mockResolvedValue({
        success: true,
        data: mockAnalytics,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/analytics', {
        method: 'GET',
      });

      // Act
      const response = await getEmailAnalytics(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(150);
      expect(data.data.delivery_rate).toBe(93.33);
      expect(data.data.recent_activity).toHaveLength(2);
      expect(mockGetEmailAnalytics).toHaveBeenCalledWith();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/analytics', {
        method: 'GET',
      });

      // Act
      const response = await getEmailAnalytics(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockGetEmailAnalytics).not.toHaveBeenCalled();
    });

    it('should return 500 when service fails', async () => {
      // Arrange
      mockGetEmailAnalytics.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch analytics',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/emails/analytics', {
        method: 'GET',
      });

      // Act
      const response = await getEmailAnalytics(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle empty analytics data', async () => {
      // Arrange
      const emptyAnalytics = {
        total: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        delivery_rate: 0,
        bounce_rate: 0,
        failure_rate: 0,
        recent_activity: [],
      };

      mockGetEmailAnalytics.mockResolvedValue({
        success: true,
        data: emptyAnalytics,
      });

      const request = new Request('http://localhost:3000/api/admin/emails/analytics', {
        method: 'GET',
      });

      // Act
      const response = await getEmailAnalytics(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.total).toBe(0);
      expect(data.data.recent_activity).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle missing Content-Type header', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/emails/send', {
        method: 'POST',
        body: JSON.stringify({
          recipients: ['test@example.com'],
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      });

      // Act
      const response = await sendBulkEmail(request);
      const data = await response.json();

      // Assert - Should still work as Next.js handles JSON parsing
      expect(response.status).toBe(200);
      expect(mockSendBulkEmail).toHaveBeenCalled();
    });

    it('should handle service throwing unexpected errors', async () => {
      // Arrange
      mockGetEmailLogs.mockRejectedValue(new Error('Unexpected service error'));

      const request = new Request('http://localhost:3000/api/admin/emails', {
        method: 'GET',
      });

      // Act
      const response = await getEmailLogs(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
      expect(data.error.message).toBe('Unexpected service error');
    });
  });
});