import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { getEmailLogs } from '@/services/emailService';
import { z } from 'zod';

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    // 400 - Bad Request
    'VALIDATION_ERROR': 400,
    'INVALID_INPUT': 400,
    'MISSING_REQUIRED_FIELD': 400,
    'INVALID_FORMAT': 400,
    
    // 401 - Unauthorized
    'UNAUTHORIZED': 401,
    'INVALID_CREDENTIALS': 401,
    'SESSION_EXPIRED': 401,
    'AUTHENTICATION_REQUIRED': 401,
    
    // 403 - Forbidden
    'FORBIDDEN': 403,
    'INSUFFICIENT_PERMISSIONS': 403,
    'ACCESS_DENIED': 403,
    
    // 404 - Not Found
    'NOT_FOUND': 404,
    
    // 409 - Conflict
    'CONFLICT': 409,
    'DUPLICATE_ENTRY': 409,
    
    // 429 - Too Many Requests
    'RATE_LIMIT_EXCEEDED': 429,
    
    // 500 - Internal Server Error
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
    
    // 502/503 - Service Unavailable
    'EXTERNAL_SERVICE_ERROR': 502,
    'STORAGE_UNAVAILABLE': 503,
    'EMAIL_SERVICE_ERROR': 503,
  };
  
  return statusMap[errorCode] || 500;
}

/**
 * Query parameter schema for email logs filtering
 */
const querySchema = z.object({
  template_id: z.string().uuid().optional(),
  recipient_email: z.string().email().optional(),
  delivery_status: z.enum(['queued', 'sent', 'delivered', 'failed', 'bounced']).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

/**
 * GET /api/admin/emails
 * Fetches email logs for the admin dashboard with optional filtering.
 * Requirements: 8.1, 8.2
 */
export async function GET(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. VALIDATE query parameters
    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      template_id: searchParams.get('template_id') ?? undefined,
      recipient_email: searchParams.get('recipient_email') ?? undefined,
      delivery_status: searchParams.get('delivery_status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. DELEGATE to service
    const result = await getEmailLogs(validation.data);

    // 4. RESPOND with proper status
    if (!result.success) {
      return NextResponse.json(result, { 
        status: getStatusCode(result.error.code) 
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('API Error:', {
      path: request.url,
      method: request.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
