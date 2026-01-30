import {
  extractContentFromUrl,
  validateExtractedContent,
  sanitizeExtractedText,
  sanitizeExtractedRichText,
} from './aiContentService';
import { createMockSupabaseClient } from '../__tests__/helpers/mockSupabase';

// Mock external dependencies
jest.mock('@google/generative-ai');
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input) => {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }),
  sanitizeRichText: jest.fn((input) => {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('aiContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('sanitizeExtractedText', () => {
    it('should return sanitized text when valid input provided', () => {
      const result = sanitizeExtractedText('Hello <script>alert("xss")</script>World');
      expect(result).toBe('Hello World');
    });

    it('should return empty string when input is null', () => {
      const result = sanitizeExtractedText(null as any);
      expect(result).toBe('');
    });

    it('should return empty string when input is undefined', () => {
      const result = sanitizeExtractedText(undefined as any);
      expect(result).toBe('');
    });

    it('should return empty string when input is not a string', () => {
      const result = sanitizeExtractedText(123 as any);
      expect(result).toBe('');
    });
  });

  describe('sanitizeExtractedRichText', () => {
    it('should return sanitized HTML when valid input provided', () => {
      const result = sanitizeExtractedRichText('<p>Hello <script>alert("xss")</script>World</p>');
      expect(result).toBe('<p>Hello World</p>');
    });

    it('should return empty string when input is null', () => {
      const result = sanitizeExtractedRichText(null as any);
      expect(result).toBe('');
    });

    it('should return empty string when input is undefined', () => {
      const result = sanitizeExtractedRichText(undefined as any);
      expect(result).toBe('');
    });

    it('should return empty string when input is not a string', () => {
      const result = sanitizeExtractedRichText(123 as any);
      expect(result).toBe('');
    });
  });

  describe('validateExtractedContent', () => {
    it('should return success when valid activity data provided', () => {
      const validActivityData = {
        name: 'Beach Volleyball',
        description: 'Fun beach activity',
        activityType: 'activity',
        startTime: '2024-01-01T10:00:00Z',
        capacity: 20,
        costPerPerson: 25,
        adultsOnly: false,
        plusOneAllowed: true,
      };

      const result = validateExtractedContent('activity', validActivityData);
      expect(result.success).toBe(true);
    });

    it('should return VALIDATION_ERROR when invalid activity data provided', () => {
      const invalidActivityData = {
        name: '', // Invalid: empty name
        activityType: 'activity',
      };

      const result = validateExtractedContent('activity', invalidActivityData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return success when valid accommodation data provided', () => {
      const validAccommodationData = {
        name: 'Beach Resort',
        description: 'Luxury beachfront resort',
        address: '123 Beach Road, Costa Rica',
      };

      const result = validateExtractedContent('accommodation', validAccommodationData);
      expect(result.success).toBe(true);
    });

    it('should return success when valid vendor data provided', () => {
      const validVendorData = {
        name: 'Costa Rica Photography',
        category: 'photography',
        contactName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        pricingModel: 'flat_rate',
        baseCost: 2500,
        notes: 'Professional wedding photography',
      };

      const result = validateExtractedContent('vendor', validVendorData);
      expect(result.success).toBe(true);
    });

    it('should return INVALID_CONTENT_TYPE when unsupported content type provided', () => {
      const result = validateExtractedContent('invalid' as any, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONTENT_TYPE');
      }
    });

    it('should return VALIDATION_ERROR when validation throws error', () => {
      const result = validateExtractedContent('activity', null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('extractContentFromUrl', () => {
    beforeEach(() => {
      // Mock environment variable
      process.env.GEMINI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
    });

    it('should return VALIDATION_ERROR when invalid URL provided', async () => {
      const result = await extractContentFromUrl({
        url: 'invalid-url',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return CONFIGURATION_ERROR when GEMINI_API_KEY not set', async () => {
      delete process.env.GEMINI_API_KEY;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: jest.fn().mockResolvedValue('<html><body>Test content</body></html>'),
      });

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIGURATION_ERROR');
      }
    });

    it('should return FETCH_ERROR when URL fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FETCH_ERROR');
      }
    });

    it('should return INVALID_CONTENT_TYPE when non-HTML content returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      });

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONTENT_TYPE');
      }
    });

    it('should return CONTENT_TOO_LARGE when content exceeds 1MB', async () => {
      const largeContent = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: jest.fn().mockResolvedValue(largeContent),
      });

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONTENT_TOO_LARGE');
      }
    });

    it('should return TIMEOUT when fetch times out', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Request timed out');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TIMEOUT');
      }
    });

    it('should return EXTERNAL_SERVICE_ERROR when AI service fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/html'),
        },
        text: jest.fn().mockResolvedValue('<html><body>Test content</body></html>'),
      });

      // Mock GoogleGenerativeAI to throw error
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: () => {
            throw new Error('AI service error');
          },
        }),
      }));

      const result = await extractContentFromUrl({
        url: 'https://example.com',
        contentType: 'activity',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      }
    });
  });
});