import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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
    'CONFLICT': 409,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

/**
 * GET /api/admin/groups
 * 
 * Fetches all groups for dropdown filters.
 * Requires authentication.
 * 
 * Query Parameters:
 * - include_count: boolean (optional) - Include guest count for each group
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
      include_count: z.string().optional().transform(val => val === 'true'),
    });

    // Convert null to undefined for optional parameters
    const validation = querySchema.safeParse({
      include_count: searchParams.get('include_count') ?? undefined,
    });

    if (!validation.success) {
      console.error('[API /api/admin/groups GET] Validation error:', validation.error);
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

    // 3. DELEGATE - Fetch groups from database
    const { include_count } = validation.data;
    
    let query = supabase
      .from('groups')
      .select(include_count ? 'id, name, guest_count:guests(count)' : 'id, name')
      .order('name', { ascending: true });

    const { data: groups, error } = await query;

    if (error) {
      console.error('[API /api/admin/groups GET] Database error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch groups',
          },
        },
        { status: getStatusCode('DATABASE_ERROR') }
      );
    }

    // 4. RESPOND
    return NextResponse.json(
      { success: true, data: groups || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/admin/groups GET] Unexpected error:', {
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
