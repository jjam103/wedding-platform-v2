import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/groups
 * 
 * Fetches all groups for dropdown filters.
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

    // 2. Fetch groups from database
    const { data: groups, error } = await supabase
      .from('groups')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('[API /api/admin/groups GET] Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: error.message,
            details: error,
          },
        },
        { status: 500 }
      );
    }

    // 3. Return response
    return NextResponse.json(
      { success: true, data: groups || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /api/admin/groups GET] Unexpected error:', error);
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
