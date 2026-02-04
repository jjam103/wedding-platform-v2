import { PATCH } from './route';
import * as rsvpManagementService from '@/services/rsvpManagementService';
import * as apiHelpers from '@/lib/apiHelpers';

// Mock dependencies
jest.mock('@/services/rsvpManagementService');
jest.mock('@/lib/apiHelpers', () => ({
  ...jest.requireActual('@/lib/apiHelpers'),
  withAuth: jest.fn(),
}));

describe('PATCH /api/admin/rsvps/bulk', () => {
  const mockUserId = 'user-123';
  const mockRsvpIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock withAuth to call the handler with mockUserId
    (apiHelpers.withAuth as jest.Mock).mockImplementation(
      async (handler: (userId: string) => Promise<Response>) => {
        return handler(mockUserId);
      }
    );
  });

  describe('Success Cases', () => {
    it('should update RSVPs and return 200 when valid data provided', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 3 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
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

    it('should update RSVPs with notes when notes provided', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 2 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds.slice(0, 2),
          status: 'declined',
          notes: 'Bulk declined by admin',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(2);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        mockRsvpIds.slice(0, 2),
        'declined',
        'Bulk declined by admin'
      );
    });

    it('should handle partial success when some RSVPs not found', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 2 }, // Only 2 of 3 updated
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'maybe',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(2);
    });

    it('should update RSVPs to pending status', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 1 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: [mockRsvpIds[0]],
          status: 'pending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(1);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        [mockRsvpIds[0]],
        'pending',
        undefined
      );
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 when rsvpIds is empty array', async () => {
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
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid request data');
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
      const response = await PATCH(request);
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
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when status is missing', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
        }),
      });

      // Act
      const response = await PATCH(request);
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
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when notes exceeds 1000 characters', async () => {
      // Arrange
      const longNotes = 'a'.repeat(1001);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
          notes: longNotes,
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });

    it('should return 400 when rsvpIds is missing', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Errors', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      (apiHelpers.withAuth as jest.Mock).mockImplementation(
        async (handler: (userId: string) => Promise<Response>) => {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            }),
            { status: 401 }
          );
        }
      );

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(rsvpManagementService.bulkUpdateRSVPs).not.toHaveBeenCalled();
    });
  });

  describe('Service Errors', () => {
    it('should return 500 when service returns DATABASE_ERROR', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
          details: { dbError: 'Connection timeout' },
        },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 500 when service returns UNKNOWN_ERROR', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Unexpected error occurred',
        },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'declined',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });

    it('should return 500 when service throws unexpected error', async () => {
      // Arrange
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockRejectedValue(
        new Error('Unexpected service error')
      );

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('Failed to update RSVPs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single RSVP update', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 1 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: [mockRsvpIds[0]],
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(1);
    });

    it('should handle maximum allowed RSVPs (100)', async () => {
      // Arrange
      const maxRsvpIds = Array.from({ length: 100 }, (_, i) => 
        `${String(i).padStart(8, '0')}-1111-1111-1111-111111111111`
      );
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 100 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: maxRsvpIds,
          status: 'attending',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updatedCount).toBe(100);
    });

    it('should handle empty notes string', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 2 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: mockRsvpIds.slice(0, 2),
          status: 'maybe',
          notes: '',
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        mockRsvpIds.slice(0, 2),
        'maybe',
        ''
      );
    });

    it('should handle notes at maximum length (1000 characters)', async () => {
      // Arrange
      const maxLengthNotes = 'a'.repeat(1000);
      const mockServiceResponse = {
        success: true,
        data: { updatedCount: 1 },
      };
      (rsvpManagementService.bulkUpdateRSVPs as jest.Mock).mockResolvedValue(mockServiceResponse);

      const request = new Request('http://localhost:3000/api/admin/rsvps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvpIds: [mockRsvpIds[0]],
          status: 'attending',
          notes: maxLengthNotes,
        }),
      });

      // Act
      const response = await PATCH(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(rsvpManagementService.bulkUpdateRSVPs).toHaveBeenCalledWith(
        [mockRsvpIds[0]],
        'attending',
        maxLengthNotes
      );
    });
  });
});
