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
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

/**
 * GET /api/admin/groups/[id]/guests
 * 
 * Fetches all guests in a specific group.
 * Used by EmailComposer to get recipient emails when sending to groups.
 * Requires authentication.
 * 
 * Path Parameters:
 * - id: string (UUID) - Group ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. VALIDATE path parameter
    const { id } = await params;
    const idValidation = z.string().uuid().safeParse(id);
    
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid group ID format',
            details: idValidation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const groupId = idValidation.data;

    // 3. DELEGATE - Fetch guests from database
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, age_type, guest_type, group_id')
      .eq('group_id', groupId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('[API /api/admin/groups/[id]/guests GET] Database error:', {
        groupId,
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch guests',
          },
        },
        { status: getStatusCode('DATABASE_ERROR') }
      );
    }

    // 4. RESPOND
    return NextResponse.json(
      { success: true, data: guests || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/admin/groups/[id]/guests GET] Unexpected error:', {
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
