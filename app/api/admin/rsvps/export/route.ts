import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, errorResponse } from '@/lib/apiHelpers';
import { rateLimitMiddleware, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rateLimit';
import * as rsvpManagementService from '@/services/rsvpManagementService';

/**
 * GET /api/admin/rsvps/export
 * 
 * Export RSVPs to CSV format with filtering support
 * 
 * Query Parameters:
 * - eventId: string (UUID) - Filter by event
 * - activityId: string (UUID) - Filter by activity
 * - status: 'pending' | 'attending' | 'declined' | 'maybe' - Filter by status
 * - guestId: string (UUID) - Filter by guest
 * - searchQuery: string (max 100 chars) - Search guest name/email
 * 
 * Returns:
 * - CSV file download with RSVP data
 * 
 * Rate Limit: 1 request per minute per user
 * 
 * **Validates: Requirements 6.4**
 */

// Query parameter validation schema
const queryParamsSchema = z.object({
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
    'RATE_LIMIT_EXCEEDED': 429,
  };
  
  return statusMap[errorCode] || 500;
}

export async function GET(request: Request) {
  return withAuth(async (userId) => {
    try {
      // 1. Rate limiting - 1 request per minute per user
      const rateLimitResult = rateLimitMiddleware(
        userId,
        'api:rsvps:export',
        { maxRequests: 1, windowMs: 60 * 1000 } // 1 request per minute
      );

      if (!rateLimitResult.success) {
        const details = rateLimitResult.error.details as any;
        const headers = getRateLimitHeaders({
          allowed: false,
          limit: details?.limit || 1,
          remaining: details?.remaining || 0,
          reset: details?.reset || Math.floor(Date.now() / 1000) + 60,
          retryAfter: details?.retryAfter,
        });

        return NextResponse.json(
          rateLimitResult,
          { 
            status: 429,
            headers,
          }
        );
      }

      // 2. Parse and validate query parameters
      const { searchParams } = new URL(request.url);
      
      // Build query object, filtering out null values
      const queryParams: Record<string, string> = {};
      
      const eventIdParam = searchParams.get('eventId');
      const activityIdParam = searchParams.get('activityId');
      const statusParam = searchParams.get('status');
      const guestIdParam = searchParams.get('guestId');
      const searchQueryParam = searchParams.get('searchQuery');
      
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

      const filters = queryValidation.data;

      // 3. Call service layer to generate CSV
      const result = await rsvpManagementService.exportRSVPsToCSV(filters);

      // 4. Handle service errors
      if (!result.success) {
        return errorResponse(
          result.error.code,
          result.error.message,
          getStatusCode(result.error.code),
          result.error.details
        );
      }

      // 5. Return CSV file as download
      const csv = result.data;
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `rsvps-export-${timestamp}.csv`;

      // Add rate limit headers to successful response
      const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.data);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...rateLimitHeaders,
        },
      });

    } catch (error) {
      console.error('GET /api/admin/rsvps/export error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return errorResponse(
        'INTERNAL_ERROR',
        'Failed to export RSVPs',
        500
      );
    }
  });
}
