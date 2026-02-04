import {
  initializeB2Client,
  uploadToB2,
  checkB2Health,
  getB2HealthStatus,
  generateCDNUrl,
  isB2Healthy,
  resetB2Client,
} from './b2Service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  HeadBucketCommand: jest.fn(),
}));

// Mock circuit breaker
jest.mock('../utils/circuitBreaker', () => ({
  getCircuitBreaker: jest.fn().mockReturnValue({
    execute: jest.fn().mockImplementation((fn) => fn()),
  }),
}));

// Mock sanitization
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input) => input?.replace(/[^a-zA-Z0-9._-]/g, '_') || ''),
}));

describe('b2Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetB2Client(); // Reset client state before each test
    // Reset environment variables
    process.env.B2_BUCKET_NAME = 'test-bucket';
    process.env.B2_CDN_DOMAIN = 'cdn.example.com';
  });

  afterEach(() => {
    delete process.env.B2_BUCKET_NAME;
    delete process.env.B2_CDN_DOMAIN;
    resetB2Client(); // Clean up after each test
  });

  describe('initializeB2Client', () => {
    it('should return success when valid configuration provided', () => {
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(true);
    });

    it('should initialize B2 client with correct endpoint format', () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      initializeB2Client(config);

      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://s3.us-west-002.backblazeb2.com',
          region: 'us-west-002',
          credentials: {
            accessKeyId: 'test-key-id',
            secretAccessKey: 'test-secret-key',
          },
          forcePathStyle: true, // Required for B2 S3-compatible API
        })
      );
    });

    it('should return CONFIGURATION_ERROR when missing endpoint', () => {
      const config = {
        endpoint: '',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIGURATION_ERROR');
        expect(result.error.message).toBe('Missing required B2 configuration');
      }
    });

    it('should return CONFIGURATION_ERROR when missing accessKeyId', () => {
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: '',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIGURATION_ERROR');
      }
    });

    it('should return CONFIGURATION_ERROR when missing secretAccessKey', () => {
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: '',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIGURATION_ERROR');
      }
    });

    it('should return CONFIGURATION_ERROR when missing bucket', () => {
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: '',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIGURATION_ERROR');
      }
    });

    it('should return INITIALIZATION_ERROR when S3Client throws error', () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      S3Client.mockImplementationOnce(() => {
        throw new Error('S3Client initialization failed');
      });

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      const result = initializeB2Client(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INITIALIZATION_ERROR');
        expect(result.error.message).toBe('S3Client initialization failed');
      }
    });
  });

  describe('uploadToB2', () => {
    beforeEach(() => {
      // Initialize client first
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);
    });

    it('should return success when file uploaded successfully', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Re-initialize with mocked client
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const fileBuffer = Buffer.from('test file content');
      const result = await uploadToB2(fileBuffer, 'test-photo.jpg', 'image/jpeg');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toContain('cdn.example.com');
        expect(result.data.key).toContain('test-photo.jpg');
      }
    });

    it('should return CLIENT_NOT_INITIALIZED when client not initialized', async () => {
      // Reset client to ensure it's not initialized
      resetB2Client();
      
      const fileBuffer = Buffer.from('test file content');
      const result = await uploadToB2(fileBuffer, 'test-photo.jpg', 'image/jpeg');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CLIENT_NOT_INITIALIZED');
      }
    });

    it('should return UPLOAD_ERROR when S3 upload fails', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockRejectedValue(new Error('Upload failed'));
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Re-initialize with mocked client
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const fileBuffer = Buffer.from('test file content');
      const result = await uploadToB2(fileBuffer, 'test-photo.jpg', 'image/jpeg');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UPLOAD_ERROR');
      }
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Re-initialize with mocked client
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const fileBuffer = Buffer.from('test file content');
      await uploadToB2(fileBuffer, '../../../malicious.jpg', 'image/jpeg');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/photos\/\d+-\.\._\.\._\.\._malicious\.jpg/),
        })
      );
    });
  });

  describe('checkB2Health', () => {
    it('should return { available: true } when B2 is configured and healthy', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Initialize client
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const result = await checkB2Health();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthy).toBe(true);
        expect(result.data.lastChecked).toBeDefined();
        expect(result.data.lastChecked).toBeInstanceOf(Date);
        expect(result.data.error).toBeUndefined();
      }
    });

    it('should return { available: false } when B2 is not configured', async () => {
      // Reset client to ensure it's not initialized
      resetB2Client();
      
      const result = await checkB2Health();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthy).toBe(false);
        expect(result.data.error).toBe('B2 client not initialized');
        expect(result.data.lastChecked).toBeDefined();
      }
    });

    it('should return { available: false } when bucket is not accessible', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockRejectedValue(new Error('Access denied'));
      S3Client.mockImplementation(() => ({ send: mockSend }));

      // Initialize client
      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const result = await checkB2Health();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthy).toBe(false);
        expect(result.data.error).toBe('Access denied');
        expect(result.data.lastChecked).toBeDefined();
      }
    });

    it('should update health status timestamp on each check', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const firstCheck = await checkB2Health();
      const firstTimestamp = firstCheck.success ? firstCheck.data.lastChecked : null;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const secondCheck = await checkB2Health();
      const secondTimestamp = secondCheck.success ? secondCheck.data.lastChecked : null;

      expect(firstTimestamp).toBeDefined();
      expect(secondTimestamp).toBeDefined();
      if (firstTimestamp && secondTimestamp) {
        expect(secondTimestamp.getTime()).toBeGreaterThanOrEqual(firstTimestamp.getTime());
      }
    });
  });

  describe('getB2HealthStatus', () => {
    it('should return current health status', () => {
      const status = getB2HealthStatus();
      expect(status).toHaveProperty('healthy');
      expect(status).toHaveProperty('lastChecked');
    });
  });

  describe('generateCDNUrl', () => {
    it('should generate correct CDN URL with proper format', () => {
      const url = generateCDNUrl('photos/1234567890-photo.jpg');
      expect(url).toBe('https://cdn.example.com/photos/1234567890-photo.jpg');
      expect(url).toMatch(/^https:\/\//); // Starts with https://
      expect(url).toContain('cdn.example.com'); // Contains CDN domain
      expect(url).toContain('/photos/'); // Contains photos path
    });

    it('should handle keys with special characters', () => {
      const url = generateCDNUrl('photos/1234567890-test_photo-v2.jpg');
      expect(url).toBe('https://cdn.example.com/photos/1234567890-test_photo-v2.jpg');
      expect(url).toMatch(/^https:\/\/cdn\.example\.com\//);
    });

    it('should handle keys without photos prefix', () => {
      const url = generateCDNUrl('other/path/file.jpg');
      expect(url).toBe('https://cdn.example.com/other/path/file.jpg');
    });

    it('should handle empty CDN domain gracefully', () => {
      delete process.env.B2_CDN_DOMAIN;
      const url = generateCDNUrl('photos/1234567890-photo.jpg');
      expect(url).toBe('https:///photos/1234567890-photo.jpg');
      // Restore for other tests
      process.env.B2_CDN_DOMAIN = 'cdn.example.com';
    });

    it('should not double-encode URLs', () => {
      const url = generateCDNUrl('photos/1234567890-photo%20with%20spaces.jpg');
      expect(url).toBe('https://cdn.example.com/photos/1234567890-photo%20with%20spaces.jpg');
      expect(url).not.toContain('%2520'); // Should not double-encode
    });
  });

  describe('isB2Healthy', () => {
    it('should return cached health status when recent', async () => {
      // First check to set status
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      await checkB2Health();

      // Now check if it returns cached status
      const result = await isB2Healthy();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data).toBe('boolean');
      }
    });

    it('should perform new health check when status is stale', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockResolvedValue({});
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const result = await isB2Healthy();
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling - Application Stability', () => {
    it('should not crash app when B2 upload fails', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockRejectedValue(new Error('Network error'));
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const fileBuffer = Buffer.from('test file content');
      
      // Should not throw, should return error result
      const result = await uploadToB2(fileBuffer, 'test-photo.jpg', 'image/jpeg');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UPLOAD_ERROR');
        expect(result.error.message).toBe('Network error');
      }
    });

    it('should not crash app when health check fails', async () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      const mockSend = jest.fn().mockRejectedValue(new Error('Connection timeout'));
      S3Client.mockImplementation(() => ({ send: mockSend }));

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      // Should not throw, should return unhealthy status
      const result = await checkB2Health();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.healthy).toBe(false);
        expect(result.data.error).toBe('Connection timeout');
      }
    });

    it('should not crash app when initialization fails', () => {
      const { S3Client } = require('@aws-sdk/client-s3');
      S3Client.mockImplementationOnce(() => {
        throw new Error('Invalid credentials');
      });

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'invalid-key',
        secretAccessKey: 'invalid-secret',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };

      // Should not throw, should return error result
      const result = initializeB2Client(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INITIALIZATION_ERROR');
        expect(result.error.message).toBe('Invalid credentials');
      }
    });

    it('should handle circuit breaker open state gracefully', async () => {
      const { getCircuitBreaker } = require('../utils/circuitBreaker');
      const mockCircuitBreaker = {
        execute: jest.fn().mockImplementation(async () => {
          throw new Error('Circuit breaker open');
        }),
      };
      getCircuitBreaker.mockReturnValue(mockCircuitBreaker);

      const config = {
        endpoint: 'https://s3.us-west-002.backblazeb2.com',
        region: 'us-west-002',
        accessKeyId: 'test-key-id',
        secretAccessKey: 'test-secret-key',
        bucket: 'test-bucket',
        cdnDomain: 'cdn.example.com',
      };
      initializeB2Client(config);

      const fileBuffer = Buffer.from('test file content');
      
      // Should handle circuit breaker error gracefully
      await expect(uploadToB2(fileBuffer, 'test-photo.jpg', 'image/jpeg')).rejects.toThrow('Circuit breaker open');
    });
  });
});