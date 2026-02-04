import { GET } from './route';
import * as rsvpManagementService from '@/services/rsvpManagementService';
import * as apiHelpers from '@/lib/apiHelpers';

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

describe('GET /api/admin/rsvps', () => {
  const mockListRSVPs = rsvpManagementService.listRSVPs as jest.MockedFunction<
    typeof rsvpManagementService.listRSVPs
  >;
  const mockWithAuth = apiHelpers.withAuth as jest.MockedFunction<typeof apiHelpers.withAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock withAuth to call the handler directly
    mockWithAuth.mockImplementation(async (handler) => {
      return handler('test-user-id');
    });
  });

  describe('Success Cases', () => {
    it('should return paginated RSVPs with statistics when called with valid parameters', async () => {
      // Arrange
      const mockResponse = {
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
            dietaryNotes: null,
            specialRequirements: null,
            notes: null,
            respondedAt: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
        statistics: {
          totalRSVPs: 1,
          byStatus: {
            attending: 1,
            declined: 0,
            maybe: 0,
            pending: 0,
          },
          totalGuestCount: 2,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps?page=1&limit=50');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockResponse);
      expect(mockListRSVPs).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 50 }
      );
    });

    it('should apply filters when provided in query parameters', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?eventId=00000000-0000-0000-0000-000000000001&status=attending&searchQuery=John'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockListRSVPs).toHaveBeenCalledWith(
        {
          eventId: '00000000-0000-0000-0000-000000000001',
          status: 'attending',
          searchQuery: 'John',
        },
        { page: 1, limit: 50 }
      );
    });

    it('should use default pagination values when not provided', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockListRSVPs).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 50 }
      );
    });

    it('should handle multiple filters simultaneously', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 2, limit: 25, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?eventId=00000000-0000-0000-0000-000000000001&activityId=00000000-0000-0000-0000-000000000002&status=pending&guestId=00000000-0000-0000-0000-000000000003&page=2&limit=25'
      );

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockListRSVPs).toHaveBeenCalledWith(
        {
          eventId: '00000000-0000-0000-0000-000000000001',
          activityId: '00000000-0000-0000-0000-000000000002',
          status: 'pending',
          guestId: '00000000-0000-0000-0000-000000000003',
        },
        { page: 2, limit: 25 }
      );
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when eventId is not a valid UUID', async () => {
      // Arrange
      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?eventId=invalid-uuid'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid query parameters');
      expect(mockListRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when status is invalid', async () => {
      // Arrange
      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?status=invalid-status'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockListRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when page is not a positive integer', async () => {
      // Arrange
      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?page=-1'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockListRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when limit exceeds maximum', async () => {
      // Arrange
      const request = createTestRequest(
        'http://localhost:3000/api/admin/rsvps?limit=150'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockListRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when searchQuery exceeds maximum length', async () => {
      // Arrange
      const longQuery = 'a'.repeat(101);
      const request = createTestRequest(
        `http://localhost:3000/api/admin/rsvps?searchQuery=${longQuery}`
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(mockListRSVPs).not.toHaveBeenCalled();
    });
  });

  describe('Service Errors', () => {
    it('should return 500 when service returns DATABASE_ERROR', async () => {
      // Arrange
      mockListRSVPs.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 400 when service returns VALIDATION_ERROR', async () => {
      // Arrange
      mockListRSVPs.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filter parameters',
          details: [{ field: 'eventId', message: 'Invalid UUID' }],
        },
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 when service returns UNKNOWN_ERROR', async () => {
      // Arrange
      mockListRSVPs.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when service throws an exception', async () => {
      // Arrange
      mockListRSVPs.mockRejectedValue(new Error('Unexpected service error'));

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('Failed to fetch RSVPs');
    });

    it('should log error details when exception occurs', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockListRSVPs.mockRejectedValue(new Error('Test error'));

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      await GET(request);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'GET /api/admin/rsvps error:',
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Authentication', () => {
    it('should call withAuth wrapper', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      await GET(request);

      // Assert
      expect(apiHelpers.withAuth).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty result set', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual([]);
      expect(data.data.pagination.total).toBe(0);
    });

    it('should handle large page numbers', async () => {
      // Arrange
      const mockResponse = {
        data: [],
        pagination: { page: 999, limit: 50, total: 0, totalPages: 0 },
        statistics: {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        },
      };

      mockListRSVPs.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const request = createTestRequest('http://localhost:3000/api/admin/rsvps?page=999');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockListRSVPs).toHaveBeenCalledWith(
        {},
        { page: 999, limit: 50 }
      );
    });

    it('should handle all valid RSVP statuses', async () => {
      // Arrange
      const statuses = ['pending', 'attending', 'declined', 'maybe'] as const;

      for (const status of statuses) {
        mockListRSVPs.mockResolvedValue({
          success: true,
          data: {
            data: [],
            pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
            statistics: {
              totalRSVPs: 0,
              byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
              totalGuestCount: 0,
            },
          },
        });

        const request = createTestRequest(
          `http://localhost:3000/api/admin/rsvps?status=${status}`
        );

        // Act
        const response = await GET(request);

        // Assert
        expect(response.status).toBe(200);
        expect(mockListRSVPs).toHaveBeenCalledWith(
          { status },
          { page: 1, limit: 50 }
        );
      }
    });
  });
});
