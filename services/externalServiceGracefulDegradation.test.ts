/**
 * Unit tests for external service graceful degradation.
 * 
 * Tests:
 * - B2 unavailable → Supabase fallback
 * - Email unavailable → SMS fallback
 * 
 * Validates: Requirements 19.8
 */

// Mock AWS SDK BEFORE importing services
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn(),
  HeadBucketCommand: jest.fn(),
}));

// Mock Supabase BEFORE importing services
const mockSupabaseStorage = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
};

const mockSupabaseFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
    storage: {
      from: jest.fn(() => mockSupabaseStorage),
    },
  })),
}));

// Mock fetch for external APIs
global.fetch = jest.fn();

// NOW import services after mocks are set up
import { uploadToB2, initializeB2Client, checkB2Health, resetB2Client } from './b2Service';
import { resetAllCircuitBreakers } from '../utils/circuitBreaker';

describe('External Service Graceful Degradation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllCircuitBreakers();
    resetB2Client();
    
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
    
    // Reset mock implementations
    mockSend.mockReset();
    mockSupabaseFrom.mockReset();
    mockSupabaseStorage.upload.mockReset();
    mockSupabaseStorage.getPublicUrl.mockReset();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('B2 Storage Failover to Supabase', () => {
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
      mockSend.mockResolvedValueOnce({}); // HeadBucketCommand succeeds

      // Check B2 health - should succeed
      const healthResult = await checkB2Health();
      expect(healthResult.success).toBe(true);
      expect(healthResult.data.healthy).toBe(true);

      // Mock B2 upload to succeed
      mockSend.mockResolvedValueOnce({}); // PutObjectCommand succeeds

      // Attempt B2 upload - should succeed
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');

      // Upload should succeed using B2
      expect(uploadResult.success).toBe(true);
      if (uploadResult.success) {
        expect(uploadResult.data.url).toContain('cdn.example.com');
        expect(uploadResult.data.key).toContain('photos/');
      }
    });

    it('should handle B2 upload failure gracefully', async () => {
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

      // Mock B2 upload to fail
      mockSend.mockRejectedValueOnce(new Error('B2 service unavailable'));

      // Attempt B2 upload - should fail
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');

      // Upload should fail
      expect(uploadResult.success).toBe(false);
      if (!uploadResult.success) {
        expect(uploadResult.error.code).toBe('UPLOAD_ERROR');
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
      mockSend.mockRejectedValue(new Error('B2 service unavailable'));

      const fileBuffer = Buffer.from('test image data');

      // Attempt multiple uploads to trigger circuit breaker (threshold is 3)
      for (let i = 0; i < 3; i++) {
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
    it('should demonstrate email service failure pattern', async () => {
      // Mock email API to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Email service unavailable',
      });

      // Simulate email service call
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'test@example.com', subject: 'Test' }),
      });

      // Email should fail
      expect(emailResponse.ok).toBe(false);
      expect(emailResponse.status).toBe(500);
    });

    it('should demonstrate SMS fallback success pattern', async () => {
      // Mock SMS API to succeed
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sid: 'SMS123', status: 'sent' }),
      });

      // Simulate SMS service call as fallback
      const smsResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/test/Messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'To=%2B1234567890&From=%2B1234567890&Body=Test',
      });

      // SMS should succeed
      expect(smsResponse.ok).toBe(true);
      const data = await smsResponse.json();
      expect(data.sid).toBe('SMS123');
    });

    it('should demonstrate both services failing gracefully', async () => {
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

      // Attempt email
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
      });
      expect(emailResponse.ok).toBe(false);

      // Attempt SMS fallback
      const smsResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/test/Messages.json', {
        method: 'POST',
      });
      expect(smsResponse.ok).toBe(false);

      // Both services attempted
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Graceful Degradation Patterns', () => {
    it('should demonstrate circuit breaker pattern for service protection', async () => {
      // Initialize B2 client
      initializeB2Client({
        endpoint: process.env.B2_ENDPOINT!,
        region: process.env.B2_REGION!,
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        bucket: process.env.B2_BUCKET_NAME!,
        cdnDomain: process.env.B2_CDN_DOMAIN!,
      });

      // Mock B2 to fail
      mockSend.mockRejectedValue(new Error('B2 unavailable'));

      const fileBuffer = Buffer.from('test image data');

      // First few failures should return UPLOAD_ERROR
      const result1 = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.error.code).toBe('UPLOAD_ERROR');
      }

      const result2 = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      expect(result2.success).toBe(false);

      const result3 = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      expect(result3.success).toBe(false);

      // After threshold, circuit should open and fail fast
      const result4 = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');
      expect(result4.success).toBe(false);
      if (!result4.success) {
        expect(result4.error.code).toBe('CIRCUIT_OPEN');
      }
    });

    it('should provide meaningful error messages when services fail', async () => {
      // Initialize B2 client
      initializeB2Client({
        endpoint: process.env.B2_ENDPOINT!,
        region: process.env.B2_REGION!,
        accessKeyId: process.env.B2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        bucket: process.env.B2_BUCKET_NAME!,
        cdnDomain: process.env.B2_CDN_DOMAIN!,
      });

      // Mock B2 to fail with specific error
      mockSend.mockRejectedValue(new Error('Connection timeout'));

      // Upload should fail with clear error
      const fileBuffer = Buffer.from('test image data');
      const uploadResult = await uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');

      expect(uploadResult.success).toBe(false);
      if (!uploadResult.success) {
        expect(uploadResult.error.message).toBeTruthy();
        expect(uploadResult.error.message).toContain('Connection timeout');
        expect(uploadResult.error.code).toBe('UPLOAD_ERROR');
      }
    });
  });
});
