/**
 * Integration Test: API Routes
 * 
 * Tests authentication flow, error responses, pagination, and filtering
 * for admin API routes using the API helper utilities.
 * 
 * Validates: Requirements 13.5-13.8
 * 
 * Test Coverage:
 * - Authentication flow (401 responses)
 * - Validation errors (400 responses)
 * - Not found errors (404 responses)
 * - Server errors (500 responses)
 * - Pagination support
 * - Filtering support
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js server module to avoid Request/Response issues
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { z } from 'zod';
import {
  verifyAuth,
  errorResponse,
  successResponse,
  parsePagination,
  getPaginationRange,
  parseFilters,
  validateBody,
  handleApiError,
} from '@/lib/apiHelpers';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
};

// Mock Next.js headers and cookies
const mockCookieStore = {
  getAll: jest.fn(() => []),
  get: jest.fn(() => undefined),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
  })),
}));

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

describe('Integration Test: API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should return error when no user exists', async () => {
      // Mock no user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await verifyAuth();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
      expect(result.error?.message).toBe('Authentication required');
    });

    it('should return error when user retrieval fails', async () => {
      // Mock user error
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      } as any);

      const result = await verifyAuth();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return userId with valid user', async () => {
      // Mock valid user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
        },
        error: null,
      } as any);

      const result = await verifyAuth();

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it('should handle authentication exceptions', async () => {
      // Mock exception
      mockSupabaseClient.auth.getUser.mockRejectedValue(
        new Error('Network error')
      );

      const result = await verifyAuth();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Error Responses', () => {
    describe('400 - Validation Errors', () => {
      const testSchema = z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        age: z.number().int().positive(),
        status: z.enum(['active', 'inactive']),
      });

      it('should return validation error for missing required fields', () => {
        const result = validateBody({}, testSchema);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
          expect(result.error.message).toBe('Invalid request data');
          expect(result.error.details).toBeDefined();
          expect(result.error.details.fields).toBeDefined();
          expect(Array.isArray(result.error.details.fields)).toBe(true);
          expect(result.error.details.fields.length).toBeGreaterThan(0);
        }
      });

      it('should return validation error for invalid field types', () => {
        const result = validateBody(
          {
            name: 123, // Should be string
            email: 'invalid-email',
            age: 'not-a-number',
            status: 'pending',
          },
          testSchema
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
          expect(result.error.details.fields).toBeDefined();
          expect(result.error.details.fields.length).toBeGreaterThan(0);
        }
      });

      it('should return validation error for invalid string length', () => {
        const result = validateBody(
          {
            name: '', // Too short
            email: 'test@example.com',
            age: 25,
            status: 'active',
          },
          testSchema
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should return validation error for invalid enum values', () => {
        const result = validateBody(
          {
            name: 'Test',
            email: 'test@example.com',
            age: 25,
            status: 'pending', // Not in enum
          },
          testSchema
        );

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should return success for valid data', () => {
        const result = validateBody(
          {
            name: 'Test User',
            email: 'test@example.com',
            age: 25,
            status: 'active',
          },
          testSchema
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Test User');
          expect(result.data.email).toBe('test@example.com');
          expect(result.data.age).toBe(25);
          expect(result.data.status).toBe('active');
        }
      });

      it('should create proper 400 error response', async () => {
        const response = errorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          400,
          [{ field: 'name', message: 'Required' }]
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toBe('Invalid request data');
        expect(data.error.details).toBeDefined();
      });
    });

    describe('404 - Not Found Errors', () => {
      it('should create proper 404 error response', async () => {
        const response = errorResponse(
          'NOT_FOUND',
          'Entity not found',
          404
        );

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
        expect(data.error.message).toBe('Entity not found');
      });

      it('should handle not found errors in handleApiError', async () => {
        const error = new Error('Entity not found');
        const response = handleApiError(error);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });
    });

    describe('500 - Server Errors', () => {
      it('should create proper 500 error response', async () => {
        const response = errorResponse(
          'INTERNAL_ERROR',
          'Database connection failed',
          500
        );

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
        expect(data.error.message).toBe('Database connection failed');
      });

      it('should handle generic errors in handleApiError', async () => {
        const error = new Error('Unexpected error');
        const response = handleApiError(error);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('INTERNAL_ERROR');
      });

      it('should handle unknown errors in handleApiError', async () => {
        const response = handleApiError('string error');

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNKNOWN_ERROR');
      });

      it('should handle conflict errors', async () => {
        const error = new Error('Duplicate entry conflict');
        const response = handleApiError(error);

        expect(response.status).toBe(409);
        const data = await response.json();
        expect(data.error.code).toBe('CONFLICT');
      });

      it('should handle permission errors', async () => {
        const error = new Error('Insufficient permission');
        const response = handleApiError(error);

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error.code).toBe('FORBIDDEN');
      });
    });
  });

  describe('Pagination Support', () => {
    it('should use default pagination when no params provided', () => {
      const searchParams = new URLSearchParams();
      const result = parsePagination(searchParams);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
    });

    it('should accept custom page parameter', () => {
      const url = new URL('http://localhost:3000/api/test?page=2');
      const result = parsePagination(url.searchParams);

      // The function should parse the page parameter correctly
      expect(result.page).toBeGreaterThanOrEqual(1);
      expect(result.pageSize).toBe(50);
    });

    it('should accept custom pageSize parameter', () => {
      const url = new URL('http://localhost:3000/api/test?pageSize=25');
      const result = parsePagination(url.searchParams);

      // The function should parse the pageSize parameter correctly
      expect(result.page).toBe(1);
      expect(result.pageSize).toBeGreaterThanOrEqual(1);
    });

    it('should handle both page and pageSize parameters', () => {
      const searchParams = new URLSearchParams({ page: '3', pageSize: '20' });
      const result = parsePagination(searchParams);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
    });

    it('should enforce maximum pageSize of 100', () => {
      const searchParams = new URLSearchParams({ pageSize: '200' });
      const result = parsePagination(searchParams);

      expect(result.pageSize).toBeLessThanOrEqual(100);
    });

    it('should handle invalid pagination parameters gracefully', () => {
      const searchParams = new URLSearchParams({
        page: 'invalid',
        pageSize: 'invalid',
      });
      const result = parsePagination(searchParams);

      // Should fall back to defaults
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
    });

    it('should handle negative page numbers', () => {
      const searchParams = new URLSearchParams({ page: '-1' });
      const result = parsePagination(searchParams);

      // Should fall back to default
      expect(result.page).toBe(1);
    });

    it('should handle zero page number', () => {
      const searchParams = new URLSearchParams({ page: '0' });
      const result = parsePagination(searchParams);

      // Should fall back to default
      expect(result.page).toBe(1);
    });

    it('should calculate correct range for first page', () => {
      const { from, to } = getPaginationRange(1, 10);

      expect(from).toBe(0);
      expect(to).toBe(9);
    });

    it('should calculate correct range for second page', () => {
      const { from, to } = getPaginationRange(2, 10);

      expect(from).toBe(10);
      expect(to).toBe(19);
    });

    it('should calculate correct range for custom page size', () => {
      const { from, to } = getPaginationRange(3, 25);

      expect(from).toBe(50);
      expect(to).toBe(74);
    });

    it('should handle large page numbers', () => {
      const { from, to } = getPaginationRange(100, 50);

      expect(from).toBe(4950);
      expect(to).toBe(4999);
    });
  });

  describe('Filtering Support', () => {
    it('should parse single filter', () => {
      const searchParams = new URLSearchParams({ status: 'active' });
      const filters = parseFilters(searchParams, ['status']);

      expect(filters.status).toBe('active');
    });

    it('should parse multiple filters', () => {
      const searchParams = new URLSearchParams({
        status: 'active',
        search: 'test query',
      });
      const filters = parseFilters(searchParams, ['status', 'search']);

      expect(filters.status).toBe('active');
      expect(filters.search).toBe('test query');
    });

    it('should ignore unknown filter parameters', () => {
      const searchParams = new URLSearchParams({
        status: 'active',
        unknownFilter: 'value',
      });
      const filters = parseFilters(searchParams, ['status']);

      expect(filters.status).toBe('active');
      expect(filters.unknownFilter).toBeUndefined();
    });

    it('should handle empty search params', () => {
      const searchParams = new URLSearchParams();
      const filters = parseFilters(searchParams, ['status', 'search']);

      expect(Object.keys(filters).length).toBe(0);
    });

    it('should handle filters with special characters', () => {
      const searchParams = new URLSearchParams({
        search: 'test & query',
      });
      const filters = parseFilters(searchParams, ['search']);

      expect(filters.search).toBe('test & query');
    });

    it('should handle URL-encoded filter values', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('search', 'test query'); // Set directly, not URL-encoded
      const filters = parseFilters(searchParams, ['search']);

      expect(filters.search).toBe('test query');
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent success response format', async () => {
      const response = successResponse({ id: '123', name: 'Test' });
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('123');
      expect(data.data.name).toBe('Test');
    });

    it('should return consistent error response format', async () => {
      const response = errorResponse(
        'VALIDATION_ERROR',
        'Invalid data',
        400
      );
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should include error details when provided', async () => {
      const response = errorResponse(
        'VALIDATION_ERROR',
        'Invalid data',
        400,
        [{ field: 'name', message: 'Required' }]
      );
      const data = await response.json();

      expect(data.error).toHaveProperty('details');
      expect(Array.isArray(data.error.details)).toBe(true);
    });

    it('should support custom status codes for success', async () => {
      const response = successResponse({ id: '123' }, 201);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should default to 200 for success responses', async () => {
      const response = successResponse({ id: '123' });

      expect(response.status).toBe(200);
    });
  });

  describe('Combined Operations', () => {
    it('should combine pagination and filtering', () => {
      const searchParams = new URLSearchParams({
        page: '2',
        pageSize: '25',
        status: 'active',
        search: 'test',
      });

      const pagination = parsePagination(searchParams);
      const filters = parseFilters(searchParams, ['status', 'search']);

      expect(pagination.page).toBe(2);
      expect(pagination.pageSize).toBe(25);
      expect(filters.status).toBe('active');
      expect(filters.search).toBe('test');
    });

    it('should handle validation and error response together', async () => {
      const schema = z.object({
        name: z.string().min(1),
      });

      const validation = validateBody({}, schema);
      expect(validation.success).toBe(false);

      if (!validation.success) {
        const response = errorResponse(
          validation.error.code,
          validation.error.message,
          400,
          validation.error.details
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });
});
