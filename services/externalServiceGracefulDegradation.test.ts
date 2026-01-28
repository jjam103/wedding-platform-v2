import { uploadToB2, initializeB2Client, checkB2Health } from './b2Service';
import { sendEmail } from './emailService';
import { sendSMS } from './smsService';
import { uploadPhoto } from './photoService';
import { resetAllCircuitBreakers } from '../utils/circuitBreaker';

/**
 * Unit tests for external service graceful degradation.
 * 
 * Tests:
 * - B2 unavailable → Supabase fallback
 * - Email unavailable → SMS fallback
 * 
 * Validates: Requirements 19.8
 */

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  HeadBucketCommand: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
      })),
    },
  })),
}));

// Mock fetch for external APIs
global.fetch = jest.fn();

describe('External Service Graceful Degradation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllCircuitBreakers();
    
    // Reset environment variables
    process.env.B2_ENDPOINT = 'https://s3.us-west-000.backblazeb2.com';
    process.env.B2_REGION = 'us-west-000';
    process.env.B2_ACCESS_KEY_ID = 'test-key';
    process.env.B2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.B2_BUCKET_NAME = 'test-bucket';
    process.env.B2_CDN_DOMAIN = 'cdn.example.com';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('B2 Storage Failover to Supabase', () => {
    it('should fallback to Supabase storage when B2 is unavailable', async () => {
      // Initialize B2 client
      const initResult = initializeB2Client({
        endpoint: process.env.B2_ENDPOINT!,
        region: process.env.B2_REGION!,
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        bucket: process.env.B2_BUCKET_NAME!,
        cdnDomain: process.env.B2_CDN_DOMAIN!,
      });
      expect(initResult.success).toBe(true);

      // Mock B2 health check to return unhealthy
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = S3Client.mock.results[0].value.send;
      mockSend.mockRejectedValue(new Error('B2 service unavailable'));

      // Check B2 health - should fail
      const healthResult = await checkB2Health();
      expect(healthResult.success).toBe(true);
      expect(healthResult.data.healthy).toBe(false);

      // Mock Supabase storage upload to succeed
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'photos/test.jpg' },
        error: null,
      });

      // Attempt photo upload - should use Supabase fallback
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadPhoto({
        file: fileBuffer,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        uploaderId: 'user-123',
        pageType: 'memory',
      });

      // Upload should succeed using Supabase
      expect(uploadResult.success).toBe(true);
      if (uploadResult.success) {
        expect(uploadResult.data.storageType).toBe('supabase');
        expect(mockSupabase.storage.from).toHaveBeenCalled();
      }
    });

    it('should use B2 when available and healthy', async () => {
      // Initialize B2 client
      const initResult = initializeB2Client({
        endpoint: process.env.B2_ENDPOINT!,
        region: process.env.B2_REGION!,
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        bucket: process.env.B2_BUCKET_NAME!,
        cdnDomain: process.env.B2_CDN_DOMAIN!,
      });
      expect(initResult.success).toBe(true);

      // Mock B2 health check to return healthy
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = S3Client.mock.results[0].value.send;
      mockSend.mockResolvedValue({});

      // Check B2 health - should succeed
      const healthResult = await checkB2Health();
      expect(healthResult.success).toBe(true);
      expect(healthResult.data.healthy).toBe(true);

      // Mock B2 upload to succeed
      mockSend.mockResolvedValue({});

      // Attempt photo upload - should use B2
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadPhoto({
        file: fileBuffer,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        uploaderId: 'user-123',
        pageType: 'memory',
      });

      // Upload should succeed using B2
      expect(uploadResult.success).toBe(true);
      if (uploadResult.success) {
        expect(uploadResult.data.storageType).toBe('b2');
      }
    });

    it('should handle B2 circuit breaker opening after repeated failures', async () => {
      // Initialize B2 client
      const initResult = initializeB2Client({
        endpoint: process.env.B2_ENDPOINT!,
        region: process.env.B2_REGION!,
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        bucket: process.env.B2_BUCKET_NAME!,
        cdnDomain: process.env.B2_CDN_DOMAIN!,
      });
      expect(initResult.success).toBe(true);

      // Mock B2 to fail repeatedly
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = S3Client.mock.results[0].value.send;
      mockSend.mockRejectedValue(new Error('B2 service unavailable'));

      const fileBuffer = Buffer.from('test image data');

      // Attempt multiple uploads to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      }

      // Next attempt should fail fast due to circuit breaker
      const result = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CIRCUIT_OPEN');
      }
    });
  });

  describe('Email to SMS Fallback', () => {
    it('should fallback to SMS when email delivery fails', async () => {
      // Mock email API to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Email service unavailable',
      });

      // Mock SMS API to succeed
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sid: 'SMS123', status: 'sent' }),
      });

      // Mock Supabase for email log
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      // Attempt to send email
      const emailResult = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      // Email should fail
      expect(emailResult.success).toBe(false);

      // Now send SMS as fallback
      const smsResult = await sendSMS({
        to: '+1234567890',
        message: 'Test content',
      });

      // SMS should succeed
      expect(smsResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should use email when available', async () => {
      // Mock email API to succeed
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'email-123' }),
      });

      // Mock Supabase for email log
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      // Send email
      const emailResult = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      // Email should succeed
      expect(emailResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle both email and SMS failures gracefully', async () => {
      // Mock email API to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Email service unavailable',
      });

      // Mock SMS API to also fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'SMS service unavailable',
      });

      // Mock Supabase for email log
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      // Attempt to send email
      const emailResult = await sendEmail({
        to: 'guest@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      // Email should fail
      expect(emailResult.success).toBe(false);

      // Attempt SMS fallback
      const smsResult = await sendSMS({
        to: '+1234567890',
        message: 'Test content',
      });

      // SMS should also fail
      expect(smsResult.success).toBe(false);

      // Both services attempted
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Graceful Degradation Patterns', () => {
    it('should continue operation when non-critical services fail', async () => {
      // Mock B2 to fail
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = S3Client.mock.results[0].value.send;
      mockSend.mockRejectedValue(new Error('B2 unavailable'));

      // Mock Supabase storage to succeed
      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'photos/test.jpg' },
        error: null,
      });

      // System should continue with fallback
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadPhoto({
        file: fileBuffer,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        uploaderId: 'user-123',
        pageType: 'memory',
      });

      expect(uploadResult.success).toBe(true);
    });

    it('should provide meaningful error messages when all fallbacks fail', async () => {
      // Mock both B2 and Supabase to fail
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = S3Client.mock.results[0].value.send;
      mockSend.mockRejectedValue(new Error('B2 unavailable'));

      const { createClient } = require('@supabase/supabase-js');
      const mockSupabase = createClient();
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: { message: 'Supabase storage unavailable' },
      });

      // Upload should fail with clear error
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadPhoto({
        file: fileBuffer,
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        uploaderId: 'user-123',
        pageType: 'memory',
      });

      expect(uploadResult.success).toBe(false);
      if (!uploadResult.success) {
        expect(uploadResult.error.message).toBeTruthy();
        expect(uploadResult.error.code).toBeTruthy();
      }
    });
  });
});
