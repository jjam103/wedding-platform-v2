/**
 * Integration Tests for RSVP Management APIs
 * 
 * Tests the complete API flow for RSVP management endpoints:
 * - GET /api/admin/rsvps (list with filters)
 * - PATCH /api/admin/rsvps/bulk (bulk update)
 * - GET /api/admin/rsvps/export (CSV export)
 * 
 * Following testing standards:
 * - Mock services to avoid worker crashes
 * - Test authentication, validation, and error handling
 * - Test complete request/response flow
 */

import { GET as getRsvps } from '@/app/api/admin/rsvps/route';
import { PATCH as bulkUpdateRsvps } from '@/app/api/admin/rsvps/bulk/route';
import { GET as exportRsvps } from '@/app/api/admin/rsvps/export/route';
import * as rsvpManagementService from '@/services/rsvpManagementService';
import * as apiHelpers from '@/lib/apiHelpers';
import * as rateLimit from '@/lib/rateLimit';

// Mock services to avoid worker crashes
jest.mock('@/services/rsvpManagementService');
jest.mock('@/lib/apiHelpers', () => ({
  ...jest.requireActual('@/lib/apiHelpers'),
  withAuth: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({
  ...jest.requireActual('@/lib/rateLimit'),
  rateLimitMiddleware: jest.fn(),
  getRateLimitHeaders: jest.fn(),
}));

describe('RSVP Management APIs - Integration Tests', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: withAuth calls handler with userId
    (apiHelpers.withAuth as jest.Mock).mockImplementation(
      async (handler: (userId: string) => Promise<Response>) => {
        return handler(mockUserId);
      }
    );
    
    // Default: rate limit allows request
    (rateLimit.rateLimitMiddleware as jest.Mock).mockReturnValue({
      success: true,
      data: {
        allowed: true,
        limit: 1,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });

    
    (rateLimit.getRateLimitHeaders as jest.Mock).mockReturnValue({
      'X-RateLimit-Limit': '1',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
    });
  });

  describe('GET /api/admin/rsvps - List RSVPs with Filters', () => {
    const mockRsvpData = {
      data: [
        {
          id: 'rsvp-1',
          guestId: 'guest-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
          guestEmail: 'john@example.com',
          eventId: 'event-1',
          eventName: 'Wedding Ceremony',
          activityId: null,
          activityName: null,
          status: 'attending' as const,
          guestCount: 2,
          dietaryNotes: 'Vegetarian',
          specialRequirements: null,
          notes: null,
          respondedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'rsvp-2',
          guestId: 'guest-2',
          guestFirstName: 'Jane',
          guestLastName: 'Smith',
          guestEmail: 'jane@example.com',
          eventId: 'event-1',
          eventName: 'Wedding Ceremony',
          activityId: 'activity-1',
          activityName: 'Reception Dinner',
          status: 'pending' as const,
          guestCount: 1,
          dietaryNotes: null,
          specialRequirements: 'Wheelchair access',
          notes: null,
          respondedAt: null,
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 2,
        totalPages: 1,
      },
      statistics: {
        totalRSVPs: 2,
        byStatus: {
          attending: 1,
          declined: 0,
          maybe: 0,
          pending: 1,
        },
        totalGuestCount: 3,
      },
    };

    it('should successfully retrieve RSVPs with default pagination', async () => {
      // Arrange
      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: mockRsvpData,
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toHaveLength(2);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(50);
      expect(data.data.statistics.totalRSVPs).toBe(2);
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 50 }
      );
    });


    it('should filter RSVPs by event ID', async () => {
      // Arrange
      const filteredData = {
        ...mockRsvpData,
        data: [mockRsvpData.data[0]],
        pagination: { ...mockRsvpData.pagination, total: 1 },
        statistics: {
          totalRSVPs: 1,
          byStatus: { attending: 1, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 2,
        },
      };

      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: filteredData,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/rsvps?eventId=00000000-0000-0000-0000-000000000001'
      );

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toHaveLength(1);
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith(
        { eventId: '00000000-0000-0000-0000-000000000001' },
        { page: 1, limit: 50 }
      );
    });

    it('should filter RSVPs by status', async () => {
      // Arrange
      const filteredData = {
        ...mockRsvpData,
        data: [mockRsvpData.data[1]],
        pagination: { ...mockRsvpData.pagination, total: 1 },
        statistics: {
          totalRSVPs: 1,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 1 },
          totalGuestCount: 1,
        },
      };

      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: filteredData,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/rsvps?status=pending'
      );

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toHaveLength(1);
      expect(data.data.data[0].status).toBe('pending');
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith(
        { status: 'pending' },
        { page: 1, limit: 50 }
      );
    });

    it('should apply multiple filters simultaneously', async () => {
      // Arrange
      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
          statistics: {
            totalRSVPs: 0,
            byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
            totalGuestCount: 0,
          },
        },
      });

      const request = new Request(
        'http://localhost:3000/api/admin/rsvps?eventId=00000000-0000-0000-0000-000000000001&activityId=00000000-0000-0000-0000-000000000002&status=attending&searchQuery=John&page=1&limit=25'
      );

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(rsvpManagementService.listRSVPs).toHaveBeenCalledWith(
        {
          eventId: '00000000-0000-0000-0000-000000000001',
          activityId: '00000000-0000-0000-0000-000000000002',
          status: 'attending',
          searchQuery: 'John',
        },
        { page: 1, limit: 25 }
      );
    });


    it('should return 400 for invalid UUID in eventId filter', async () => {
      // Arrange
      const request = new Request(
        'http://localhost:3000/api/admin/rsvps?eventId=invalid-uuid'
      );

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid query parameters');
      expect(rsvpManagementService.listRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid status value', async () => {
      // Arrange
      const request = new Request(
        'http://localhost:3000/api/admin/rsvps?status=invalid-status'
      );

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.listRSVPs).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (apiHelpers.withAuth as jest.Mock).mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          }),
          { status: 401 }
        );
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(rsvpManagementService.listRSVPs).not.toHaveBeenCalled();
    });

    it('should handle database errors from service', async () => {
      // Arrange
      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to query RSVPs',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await getRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });


  describe('PATCH /api/admin/rsvps/bulk - Bulk Update RSVPs', () => {
    const mockRsvpIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ];

    it('should successfully update multiple RSVPs', async () => {
      // Arrange
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: { updatedCount: 3 },
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(3);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        mockRsvpIds,
        'attending',
        undefined
      );
    });

    it('should update RSVPs with notes', async () => {
      // Arrange
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: { updatedCount: 2 },
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds.slice(0, 2),
          status: 'declined',
          notes: 'Unable to attend due to scheduling conflict',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(2);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        mockRsvpIds.slice(0, 2),
        'declined',
        'Unable to attend due to scheduling conflict'
      );
    });

    it('should handle partial success when some RSVPs not found', async () => {
      // Arrange
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: { updatedCount: 2 }, // Only 2 of 3 updated
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'maybe',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(2);
    });

    it('should return 400 when rsvpIds is empty', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: [],
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });


    it('should return 400 when rsvpIds exceeds 100 items', async () => {
      // Arrange
      const tooManyIds = Array.from({ length: 101 }, (_, i) =>
        `${String(i).padStart(8, '0')}-1111-1111-1111-111111111111`
      );

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: tooManyIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when rsvpIds contains invalid UUID', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: ['invalid-uuid', mockRsvpIds[0]],
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when status is invalid', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'invalid-status',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (apiHelpers.withAuth as jest.Mock).mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          }),
          { status: 401 }
        );
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });


    it('should handle database errors from service', async () => {
      // Arrange
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update RSVPs',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await bulkUpdateRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/rsvps/export - CSV Export', () => {
    it('should successfully export RSVPs to CSV', async () => {
      // Arrange
      const mockCSV = 'RSVP ID,Guest First Name,Guest Last Name,Guest Email,Event Name,Activity Name,Status,Guest Count,Dietary Notes,Special Requirements,Notes,Responded At,Created At,Updated At\nrsvp-1,John,Doe,john@example.com,Wedding Ceremony,,attending,2,Vegetarian,,,2024-01-15T10:00:00Z,2024-01-10T10:00:00Z,2024-01-15T10:00:00Z';

      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCSV,
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/export');

      // Act
      const response = await exportRsvps(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toMatch(
        /^attachment; filename="rsvps-export-\d{4}-\d{2}-\d{2}\.csv"$/
      );
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');

      const csvContent = await response.text();
      expect(csvContent).toBe(mockCSV);
      expect(rsvpManagementService.exportRSVPsToCSV).toHaveBeenCalledWith({});
    });

    it('should export RSVPs with filters applied', async () => {
      // Arrange
      const mockCSV = 'RSVP ID,Guest First Name,Guest Last Name\nrsvp-1,John,Doe';

      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockResolvedValue({
        success: true,
        data: mockCSV,
      });

      const request = new Request(
        'http://localhost:3000/api/admin/rsvps/export?eventId=00000000-0000-0000-0000-000000000001&status=attending&searchQuery=John'
      );

      // Act
      const response = await exportRsvps(request);

      // Assert
      expect(response.status).toBe(200);
      expect(rsvpManagementService.exportRSVPsToCSV).toHaveBeenCalledWith({
        eventId: '00000000-0000-0000-0000-000000000001',
        status: 'attending',
        searchQuery: 'John',
      });
    });

    it('should include rate limit headers in response', async () => {
      // Arrange
      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockResolvedValue({
        success: true,
        data: 'CSV content',
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/export');

      // Act
      const response = await exportRsvps(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });


    it('should return 429 when rate limit exceeded', async () => {
      // Arrange
      (rateLimit.rateLimitMiddleware as jest.Mock).mockReturnValue({
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

      (rateLimit.getRateLimitHeaders as jest.Mock).mockReturnValue({
        'X-RateLimit-Limit': '1',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        'Retry-After': '60',
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/export');

      // Act
      const response = await exportRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(rsvpManagementService.exportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid filter parameters', async () => {
      // Arrange
      const request = new Request(
        'http://localhost:3000/api/admin/rsvps/export?eventId=invalid-uuid'
      );

      // Act
      const response = await exportRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.exportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      // Arrange
      (apiHelpers.withAuth as jest.Mock).mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          }),
          { status: 401 }
        );
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/export');

      // Act
      const response = await exportRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(rsvpManagementService.exportRSVPsToCSV).not.toHaveBeenCalled();
    });

    it('should handle database errors from service', async () => {
      // Arrange
      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to export RSVPs',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/rsvps/export');

      // Act
      const response = await exportRsvps(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });


  describe('Complete RSVP Management Workflow', () => {
    it('should support complete workflow: list, filter, bulk update, export', async () => {
      // Step 1: List all RSVPs
      (rsvpManagementService.listRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          data: [
            {
              id: 'rsvp-1',
              guestId: 'guest-1',
              guestFirstName: 'John',
              guestLastName: 'Doe',
              guestEmail: 'john@example.com',
              eventId: 'event-1',
              eventName: 'Wedding Ceremony',
              activityId: null,
              activityName: null,
              status: 'pending' as const,
              guestCount: 2,
              dietaryNotes: null,
              specialRequirements: null,
              notes: null,
              respondedAt: null,
              createdAt: '2024-01-10T10:00:00Z',
              updatedAt: '2024-01-10T10:00:00Z',
            },
          ],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
          statistics: {
            totalRSVPs: 1,
            byStatus: { attending: 0, declined: 0, maybe: 0, pending: 1 },
            totalGuestCount: 2,
          },
        },
      });

      const listRequest = new Request('http://localhost:3000/api/admin/rsvps?status=pending');
      const listResponse = await getRsvps(listRequest);
      const listData = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listData.data.data).toHaveLength(1);
      expect(listData.data.data[0].status).toBe('pending');

      // Step 2: Bulk update RSVPs to attending
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue({
        success: true,
        data: { updatedCount: 1 },
      });

      const updateRequest = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: ['11111111-1111-1111-1111-111111111111'],
          status: 'attending',
          notes: 'Confirmed attendance',
        }),
      });

      const updateResponse = await bulkUpdateRsvps(updateRequest);
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.data.updatedCount).toBe(1);

      // Step 3: Export updated RSVPs
      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockResolvedValue({
        success: true,
        data: 'RSVP ID,Guest First Name,Status\nrsvp-1,John,attending',
      });

      const exportRequest = new Request(
        'http://localhost:3000/api/admin/rsvps/export?status=attending'
      );
      const exportResponse = await exportRsvps(exportRequest);

      expect(exportResponse.status).toBe(200);
      expect(exportResponse.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');

      const csvContent = await exportResponse.text();
      expect(csvContent).toContain('attending');
    });
  });

  describe('Error Scenarios Across All Endpoints', () => {
    it('should handle service throwing unexpected errors', async () => {
      // Test GET endpoint
      (rsvpManagementService.listRSVPs as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const getRequest = new Request('http://localhost:3000/api/admin/rsvps');
      const getResponse = await getRsvps(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(500);
      expect(getData.error.code).toBe('INTERNAL_ERROR');

      // Test PATCH endpoint
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const patchRequest = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: ['11111111-1111-1111-1111-111111111111'],
          status: 'attending',
        }),
      });

      const patchResponse = await bulkUpdateRsvps(patchRequest);
      const patchData = await patchResponse.json();

      expect(patchResponse.status).toBe(500);
      expect(patchData.error.code).toBe('INTERNAL_ERROR');

      // Test export endpoint
      (rsvpManagementService.exportRSVPsToCSV as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const exportRequest = new Request('http://localhost:3000/api/admin/rsvps/export');
      const exportResponse = await exportRsvps(exportRequest);
      const exportData = await exportResponse.json();

      expect(exportResponse.status).toBe(500);
      expect(exportData.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
