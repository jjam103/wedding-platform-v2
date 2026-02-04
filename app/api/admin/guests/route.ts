import { NextResponse } from 'next/server';
import * as guestService from '@/services/guestService';
import { createAuthenticatedClient, createServiceRoleClient } from '@/lib/supabaseServer';

/**
 * GET /api/admin/guests
 * 
 * Fetches all guests with optional filtering.
 * Requires authentication.
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || undefined;
    const ageType = (searchParams.get('ageType') as 'adult' | 'child' | 'senior' | null) || undefined;
    const guestType = searchParams.get('guestType') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 3. Call service
    const result = await guestService.list({
      groupId,
      ageType,
      guestType,
      page,
      pageSize,
    });

    // 4. Return response
    if (!result.success) {
      console.error('[API /api/admin/guests GET] Service error:', result.error);
    }
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[API /api/admin/guests GET] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
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
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();

    // 3. Call service
    const result = await guestService.create(body);

    // 4. Return response with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(result, { status: statusCode });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
