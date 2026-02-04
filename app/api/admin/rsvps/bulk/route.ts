import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, errorResponse, successResponse } from '@/lib/apiHelpers';
import * as rsvpManagementService from '@/services/rsvpManagementService';

/**
 * PATCH /api/admin/rsvps/bulk
 * 
 * Bulk update RSVP statuses
 * 
 * Request Body:
 * - rsvpIds: string[] (array of RSVP UUIDs, min 1, max 100)
 * - status: 'pending' | 'attending' | 'declined' | 'maybe'
 * - notes: string (optional, max 1000 characters)
 * 
 * Returns:
 * - updatedCount: number (count of successfully updated RSVPs)
 * 
 * **Validates: Requirements 6.4**
 */

// Request body validation schema
const bulkUpdateSchema = z.object({
  rsvpIds: z.array(z.string().uuid()).min(1, 'At least one RSVP ID is required').max(100, 'Maximum 100 RSVPs can be updated at once'),
  status: z.enum(['pending', 'attending', 'declined', 'maybe'], {
    errorMap: () => ({ message: 'Status must be one of: pending, attending, declined, maybe' }),
  }),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

/**
 * Map error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'INVALID_INPUT': 400,
    'UNAUTHORIZED': 401,
    'AUTHENTICATION_REQUIRED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  
  return statusMap[errorCode] || 500;
}

export async function PATCH(request: Request) {
  return withAuth(async (userId) => {
    try {
      // 1. Parse request body
      const body = await request.json();

      // 2. Validate request body
      const validation = bulkUpdateSchema.safeParse(body);

      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          400,
          { fields: validation.error.issues }
        );
      }

      const { rsvpIds, status, notes } = validation.data;

      // 3. Call service layer
      const result = await rsvpManagementService.bulkUpdateRSVPs(
        rsvpIds,
        status,
        notes
      );

      // 4. Handle service errors
      if (!result.success) {
        return errorResponse(
          result.error.code,
          result.error.message,
          getStatusCode(result.error.code),
          result.error.details
        );
      }

      // 5. Return success response
      // Note: If some RSVPs were not found, the service logs a warning
      // but still returns success with the count of updated RSVPs
      return successResponse(result.data, 200);

    } catch (error) {
      console.error('PATCH /api/admin/rsvps/bulk error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to update RSVPs',
        500
      );
    }
  });
}
