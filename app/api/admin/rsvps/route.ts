import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, errorResponse, successResponse } from '@/lib/apiHelpers';
import * as rsvpManagementService from '@/services/rsvpManagementService';

/**
 * GET /api/admin/rsvps
 * 
 * List all RSVPs with filtering, pagination, and statistics
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - eventId: string (UUID)
 * - activityId: string (UUID)
 * - status: 'pending' | 'attending' | 'declined' | 'maybe'
 * - guestId: string (UUID)
 * - searchQuery: string (searches guest name and email)
 * 
 * Returns:
 * - data: Array of RSVP view models
 * - pagination: { page, limit, total, totalPages }
 * - statistics: { totalRSVPs, byStatus, totalGuestCount }
 * 
 * **Validates: Requirements 6.2, 6.5**
 */

// Query parameter validation schema
const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  eventId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']).optional(),
  guestId: z.string().uuid().optional(),
  searchQuery: z.string().max(100).optional(),
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

export async function GET(request: Request) {
  return withAuth(async (userId) => {
    try {
      // 1. Parse and validate query parameters
      const { searchParams } = new URL(request.url);
      
      // Build query object, filtering out null values
      const queryParams: Record<string, string | number> = {};
      
      const pageParam = searchParams.get('page');
      const limitParam = searchParams.get('limit');
      const eventIdParam = searchParams.get('eventId');
      const activityIdParam = searchParams.get('activityId');
      const statusParam = searchParams.get('status');
      const guestIdParam = searchParams.get('guestId');
      const searchQueryParam = searchParams.get('searchQuery');
      
      if (pageParam !== null) queryParams.page = pageParam;
      if (limitParam !== null) queryParams.limit = limitParam;
      if (eventIdParam !== null) queryParams.eventId = eventIdParam;
      if (activityIdParam !== null) queryParams.activityId = activityIdParam;
      if (statusParam !== null) queryParams.status = statusParam;
      if (guestIdParam !== null) queryParams.guestId = guestIdParam;
      if (searchQueryParam !== null) queryParams.searchQuery = searchQueryParam;
      
      const queryValidation = queryParamsSchema.safeParse(queryParams);

      if (!queryValidation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Invalid query parameters',
          400,
          { fields: queryValidation.error.issues }
        );
      }

      const { page, limit, ...filters } = queryValidation.data;

      // 2. Call service layer
      const result = await rsvpManagementService.listRSVPs(
        filters,
        { page, limit }
      );

      // 3. Handle service errors
      if (!result.success) {
        return errorResponse(
          result.error.code,
          result.error.message,
          getStatusCode(result.error.code),
          result.error.details
        );
      }

      // 4. Return success response
      return successResponse(result.data, 200);

    } catch (error) {
      console.error('GET /api/admin/rsvps error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch RSVPs',
        500
      );
    }
  });
}
