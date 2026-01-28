import { NextResponse } from 'next/server';
import { listPhotos } from '@/services/photoService';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

/**
 * GET /api/admin/photos/pending-count
 * Gets the count of pending photos
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
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

    // 2. Call service to get pending photos
    const result = await listPhotos({
      moderation_status: 'pending',
      limit: 1, // We only need the count
      offset: 0,
    });

    // 3. Return response with count
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          data: { count: result.data.total },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(result, { status: 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
