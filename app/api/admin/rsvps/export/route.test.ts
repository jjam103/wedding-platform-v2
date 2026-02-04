import { GET } from './route';
import * as rsvpManagementService from '@/services/rsvpManagementService';
import * as apiHelpers from '@/lib/apiHelpers';
import * as rateLimit from '@/lib/rateLimit';

// Helper to create test requests
function createTestRequest(url: string): Request {
  return new Request(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

// Mock dependencies
jest.mock('@/services/rsvpManagementService');
jest.mock('@/lib/apiHelpers', () => {
  const actual = jest.requireActual('@/lib/apiHelpers');
  return {
    ...actual,
    withAuth: jest.fn(),
  };
});
jest.mock('@/lib/rateLimit', () => {
  const actual = jest.requireActual('@/lib/rateLimit');
  return {
    ...actual,
    rateLimitMiddleware: jest.fn(),
    getRateLimitHeaders: jest.fn(),
  };
});

describe('GET /api/admin/rsvps/export', () => {
  const mockUserId = 'user-123';
  const mockWithAuth = apiHelpers.withAuth as jest.MockedFunction<typeof apiHelpers.withAuth>;
  const mockRateLimitMiddleware = rateLimit.rateLimitMiddleware as jest.MockedFunction<typeof rateLimit.rateLimitMiddleware>;
  const mockGetRateLimitHeaders = rateLimit.getRateLimitHeaders as jest.MockedFunction<typeof rateLimit.getRateLimitHeaders>;
  const mockExportRSVPsToCSV = rsvpManagementService.exportRSVPsToCSV as jest.MockedFunction<typeof rsvpManagementService.exportRSVPsToCSV>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: withAuth calls the handler with userId
    mockWithAuth.mockImplementation(async (handler) => {
      return await handler(mockUserId);
    });

    // Default: rate limit allows request
    mockRateLimitMiddleware.mockReturnValue({
      success: true,
      data: {
        allowed: true,
        limit: 1,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });

    // Default: rate limit headers
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Limit': '1',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
    });
  });

  describe('Success Cases', () => {
    it('should export RSVPs to CSV when authenticated with valid filters', async () => {
      const mockCSV = 'RSVP ID,Guest First Name,Guest Last Name\nrsvp-1,John,Doe';
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: mockCSV,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export?eventId=00000000-0000-0000-0000-000000000001&status=attending');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toMatch(/^attachment; filename="rsvps-export-\d{4}-\d{2}-\d{2}\.csv"$/);
      
      const csvContent = await response.text();
      expect(csvContent).toBe(mockCSV);

      // Verify service was called with correct filters
      expect(mockExportRSVPsToCSV).toHaveBeenCalledWith({
        eventId: '00000000-0000-0000-0000-000000000001',
        status: 'attending',
      });
    });

    it('should export all RSVPs when no filters provided', async () => {
      const mockCSV = 'RSVP ID,Guest First Name,Guest Last Name\nrsvp-1,John,Doe\nrsvp-2,Jane,Smith';
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: mockCSV,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockExportRSVPsToCSV).toHaveBeenCalledWith({});
    });

    it('should include rate limit headers in successful response', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    it('should support multiple filter combinations', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps/export?eventId=00000000-0000-0000-0000-000000000001&activityId=00000000-0000-0000-0000-000000000002&status=attending&searchQuery=john'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockExportRSVPsToCSV).toHaveBeenCalledWith({
        eventId: '00000000-0000-0000-0000-000000000001',
        activityId: '00000000-0000-0000-0000-000000000002',
        status: 'attending',
        searchQuery: 'john',
      });
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when eventId is not a valid UUID', async () => {
      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export?eventId=invalid-uuid');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockExportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should return 400 when status is invalid', async () => {
      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export?status=invalid-status');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockExportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should return 400 when searchQuery exceeds max length', async () => {
      const longQuery = 'a'.repeat(101);
      const request = createTestRequest(`http://localhost:3000/api/admin/rsvps/export?searchQuery=${longQuery}`);
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockExportRSVPsToCSV).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockRateLimitMiddleware.mockReturnValue({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: 1,
            remaining: 0,
            reset: Math.floor(Date.now() / 1000) + 60,
            retryAfter: 60,
          },
        },
      });

      mockGetRateLimitHeaders.mockReturnValue({
        'X-RateLimit-Limit': '1',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        'Retry-After': '60',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(mockExportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should enforce 1 request per minute rate limit', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      await GET(request);

      // Verify rate limit was checked with correct parameters
      expect(mockRateLimitMiddleware).toHaveBeenCalledWith(
        mockUserId,
        'api:rsvps:export',
        { maxRequests: 1, windowMs: 60 * 1000 }
      );
    });
  });

  describe('Service Errors', () => {
    it('should return 500 when service returns database error', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should return 400 when service returns validation error', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
        },
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockWithAuth.mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          }),
          { status: 401 }
        ) as any;
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mockExportRSVPsToCSV).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when unexpected error occurs', async () => {
      mockExportRSVPsToCSV.mockRejectedValue(new Error('Unexpected error'));

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('CSV Response Format', () => {
    it('should set correct Content-Type header', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    });

    it('should set Content-Disposition header with filename', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toMatch(/^attachment; filename="rsvps-export-\d{4}-\d{2}-\d{2}\.csv"$/);
    });

    it('should set Cache-Control header to prevent caching', async () => {
      mockExportRSVPsToCSV.mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps/export');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });
});
