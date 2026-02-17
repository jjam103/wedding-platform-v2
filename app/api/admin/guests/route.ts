import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as guestService from '@/services/guestService';
import { createAuthenticatedClient, createServiceRoleClient } from '@/lib/supabaseServer';
import { ERROR_CODES } from '@/types';

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'INVALID_INPUT': 400,
    'UNAUTHORIZED': 401,
    'AUTHENTICATION_REQUIRED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'GUEST_NOT_FOUND': 404,
    'CONFLICT': 409,
    'DUPLICATE_EMAIL': 409,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

/**
 * GET /api/admin/guests
 * 
 * Fetches all guests with optional filtering.
 * Requires authentication.
 * 
 * Query Parameters:
 * - groupId: UUID (optional) - Filter by group
 * - ageType: 'adult' | 'child' | 'senior' (optional) - Filter by age type
 * - guestType: string (optional) - Filter by guest type
 * - page: number (optional, default: 1) - Page number
 * - pageSize: number (optional, default: 50) - Items per page
 * - format: 'paginated' | 'simple' (optional, default: 'paginated') - Response format
 */
export async function GET(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. VALIDATE query parameters
    const { searchParams } = new URL(request.url);
    const querySchema = z.object({
      groupId: z.string().uuid().optional(),
      ageType: z.enum(['adult', 'child', 'senior']).optional(),
      guestType: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(50),
      format: z.enum(['paginated', 'simple']).default('paginated'),
    });

    // Convert null to undefined for optional parameters
    const validation = querySchema.safeParse({
      groupId: searchParams.get('groupId') ?? undefined,
      ageType: searchParams.get('ageType') ?? undefined,
      guestType: searchParams.get('guestType') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      format: searchParams.get('format') ?? undefined,
    });

    if (!validation.success) {
      console.error('[API /api/admin/guests GET] Validation error:', validation.error);
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
    const { format, ...serviceParams } = validation.data;
    const result = await guestService.list(serviceParams);

    // 4. RESPOND with proper status
    if (!result.success) {
      console.error('[API /api/admin/guests GET] Service error:', {
        code: result.error.code,
        message: result.error.message,
      });
      return NextResponse.json(result, { status: getStatusCode(result.error.code) });
    }

    // Return simple format for dropdowns (just the guests array)
    if (format === 'simple') {
      return NextResponse.json(
        { success: true, data: result.data.guests },
        { status: 200 }
      );
    }

    // Return paginated format (default)
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API /api/admin/guests GET] Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
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

/**
 * POST /api/admin/guests
 * 
 * Creates a new guest.
 * Requires authentication.
 */
export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATE
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. VALIDATE - Parse request body with explicit error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid JSON body',
          },
        },
        { status: 400 }
      );
    }

    // 3. DELEGATE to service (validation happens in service layer)
    const result = await guestService.create(body);

    // 4. RESPOND with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      console.error('[API /api/admin/guests POST] Service error:', {
        code: result.error.code,
        message: result.error.message,
      });
      return NextResponse.json(result, { status: getStatusCode(result.error.code) });
    }
  } catch (error) {
    console.error('[API /api/admin/guests POST] Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
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
