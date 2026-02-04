/**
 * Tests for Mock External Services
 * 
 * Verifies that mock services provide realistic responses and proper tracking.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Mock B2 Service', () => {
  let mockB2: any;

  beforeEach(async () => {
    mockB2 = await import('./mockB2Service');
    mockB2.resetB2Client();
  });

  it('should validate B2 config successfully', () => {
    const result = mockB2.validateB2Config();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('endpoint');
    expect(result.data).toHaveProperty('bucket');
  });

  it('should initialize B2 client', () => {
    const config = {
      endpoint: 'https://test.com',
      region: 'us-west',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      bucket: 'test-bucket',
      cdnDomain: 'test-cdn.com',
    };

    const result = mockB2.initializeB2Client(config);
    expect(result.success).toBe(true);
  });

  it('should upload file and return mock URL', async () => {
    const config = mockB2.validateB2Config().data;
    mockB2.initializeB2Client(config);

    const fileBuffer = Buffer.from('test file content');
    const result = await mockB2.uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.data.url).toContain('test-cdn.example.com');
    expect(result.data.key).toContain('photos/');
    expect(result.data.key).toContain('test.jpg');
  });

  it('should track uploaded files', async () => {
    const config = mockB2.validateB2Config().data;
    mockB2.initializeB2Client(config);

    const fileBuffer = Buffer.from('test file content');
    await mockB2.uploadToB2(fileBuffer, 'photo1.jpg', 'image/jpeg');
    await mockB2.uploadToB2(fileBuffer, 'photo2.jpg', 'image/jpeg');

    const uploads = mockB2.getMockUploads();
    expect(uploads).toHaveLength(2);
    expect(uploads[0].fileName).toBe('photo1.jpg');
    expect(uploads[1].fileName).toBe('photo2.jpg');
  });

  it('should perform health check', async () => {
    const result = await mockB2.checkB2Health();
    expect(result.success).toBe(true);
    expect(result.data.healthy).toBe(true);
  });

  it('should simulate B2 failure', async () => {
    const config = mockB2.validateB2Config().data;
    mockB2.initializeB2Client(config);

    mockB2.simulateB2Failure('Storage quota exceeded');
    const status = mockB2.getB2HealthStatus();
    expect(status.healthy).toBe(false);
    expect(status.error).toBe('Storage quota exceeded');
  });

  it('should reset mock state', async () => {
    const config = mockB2.validateB2Config().data;
    mockB2.initializeB2Client(config);

    const fileBuffer = Buffer.from('test');
    await mockB2.uploadToB2(fileBuffer, 'test.jpg', 'image/jpeg');

    mockB2.resetB2Client();
    const uploads = mockB2.getMockUploads();
    expect(uploads).toHaveLength(0);
  });
});

describe('Mock Resend Service', () => {
  let mockResend: any;

  beforeEach(async () => {
    mockResend = await import('./mockResendService');
    mockResend.resetMockResend();
  });

  it('should send email successfully', async () => {
    const client = new mockResend.MockResend();
    const result = await client.emails.send({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>Hello!</p>',
    });

    expect(result.data).toBeTruthy();
    expect(result.data?.id).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('should track sent emails', async () => {
    const client = new mockResend.MockResend();
    await client.emails.send({
      from: 'test@example.com',
      to: 'user1@example.com',
      subject: 'Email 1',
      html: '<p>Test 1</p>',
    });
    await client.emails.send({
      from: 'test@example.com',
      to: 'user2@example.com',
      subject: 'Email 2',
      html: '<p>Test 2</p>',
    });

    const emails = mockResend.getSentEmails();
    expect(emails).toHaveLength(2);
    expect(emails[0].to).toBe('user1@example.com');
    expect(emails[1].to).toBe('user2@example.com');
  });

  it('should filter emails by recipient', async () => {
    const client = new mockResend.MockResend();
    await client.emails.send({
      from: 'test@example.com',
      to: 'user1@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });
    await client.emails.send({
      from: 'test@example.com',
      to: 'user2@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    const emails = mockResend.getSentEmailsByRecipient('user1@example.com');
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe('user1@example.com');
  });

  it('should verify email was sent', async () => {
    const client = new mockResend.MockResend();
    await client.emails.send({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Welcome Email',
      html: '<p>Welcome to our platform!</p>',
    });

    expect(mockResend.verifyEmailSent({
      to: 'user@example.com',
      subject: 'Welcome',
    })).toBe(true);

    expect(mockResend.verifyEmailSent({
      to: 'other@example.com',
    })).toBe(false);
  });

  it('should simulate email failure', async () => {
    const client = new mockResend.MockResend();
    mockResend.simulateEmailFailure('Invalid recipient');

    const result = await client.emails.send({
      from: 'test@example.com',
      to: 'invalid@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe('Invalid recipient');
  });
});

describe('Mock Twilio Service', () => {
  let mockTwilio: any;

  beforeEach(async () => {
    mockTwilio = await import('./mockTwilioService');
    mockTwilio.resetMockTwilio();
  });

  it('should send SMS successfully', async () => {
    const client = mockTwilio.mockTwilio('test-sid', 'test-token');
    const result = await client.messages.create({
      to: '+15551234567',
      from: '+15559876543',
      body: 'Test message',
    });

    expect(result.sid).toBeTruthy();
    expect(result.status).toBe('sent');
  });

  it('should track sent messages', async () => {
    const client = mockTwilio.mockTwilio('test-sid', 'test-token');
    await client.messages.create({
      to: '+15551234567',
      from: '+15559876543',
      body: 'Message 1',
    });
    await client.messages.create({
      to: '+15551234568',
      from: '+15559876543',
      body: 'Message 2',
    });

    const messages = mockTwilio.getSentMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toBe('Message 1');
    expect(messages[1].body).toBe('Message 2');
  });

  it('should verify SMS was sent', async () => {
    const client = mockTwilio.mockTwilio('test-sid', 'test-token');
    await client.messages.create({
      to: '+15551234567',
      from: '+15559876543',
      body: 'Your verification code is 123456',
    });

    expect(mockTwilio.verifySMSSent({
      to: '+15551234567',
      containsText: 'verification code',
    })).toBe(true);

    expect(mockTwilio.verifySMSSent({
      to: '+15559999999',
    })).toBe(false);
  });

  it('should simulate SMS failure', async () => {
    const client = mockTwilio.mockTwilio('test-sid', 'test-token');
    mockTwilio.simulateSMSFailure('Invalid phone number');

    await expect(client.messages.create({
      to: 'invalid',
      from: '+15559876543',
      body: 'Test',
    })).rejects.toThrow('Invalid phone number');
  });
});

describe('Mock Gemini Service', () => {
  let mockGemini: any;

  beforeEach(async () => {
    mockGemini = await import('./mockGeminiService');
    mockGemini.resetMockGemini();
  });

  it('should generate content successfully', async () => {
    const genAI = new mockGemini.MockGoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Content Type: activity\nExtract data...');
    const response = await result.response;
    const text = response.text();

    expect(text).toBeTruthy();
    expect(text).toContain('Mock Activity');
  });

  it('should track AI requests', async () => {
    const genAI = new mockGemini.MockGoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    await model.generateContent('Content Type: activity\nExtract data...');
    await model.generateContent('Content Type: accommodation\nExtract data...');

    const requests = mockGemini.getAIRequests();
    expect(requests).toHaveLength(2);
  });

  it('should verify AI request was made', async () => {
    const genAI = new mockGemini.MockGoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    await model.generateContent('Content Type: vendor\nExtract vendor data...');

    expect(mockGemini.verifyAIRequest({
      contentType: 'vendor',
    })).toBe(true);

    expect(mockGemini.verifyAIRequest({
      contentType: 'activity',
    })).toBe(false);
  });

  it('should simulate AI failure', async () => {
    const genAI = new mockGemini.MockGoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    mockGemini.simulateAIFailure('API quota exceeded');

    await expect(model.generateContent('Extract data...')).rejects.toThrow('API quota exceeded');
  });
});

describe('Service Detector', () => {
  let serviceDetector: any;

  beforeEach(async () => {
    serviceDetector = await import('./serviceDetector');
  });

  it('should detect E2E test mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const isE2E = serviceDetector.isE2ETestMode();
    expect(isE2E).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it('should determine if mocks should be used', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const useMocks = serviceDetector.shouldUseMockServices();
    expect(useMocks).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  it('should get environment summary', () => {
    const summary = serviceDetector.getEnvironmentSummary();
    expect(summary).toHaveProperty('nodeEnv');
    expect(summary).toHaveProperty('isE2ETest');
    expect(summary).toHaveProperty('useMockServices');
    expect(summary).toHaveProperty('indicators');
  });

  it('should get appropriate B2 service', async () => {
    const b2Service = await serviceDetector.getB2Service();
    expect(b2Service).toBeTruthy();
    expect(b2Service.uploadToB2).toBeDefined();
  });

  it('should reset all mock services', async () => {
    // This should not throw
    await expect(serviceDetector.resetAllMockServices()).resolves.not.toThrow();
  });
});
