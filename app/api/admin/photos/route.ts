import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { listPhotos } from '@/services/photoService';

/**
 * GET /api/admin/photos
 * 
 * Lists photos with filtering and pagination
 * 
 * Query parameters:
 * - page_type: Filter by page type (event, activity, accommodation, memory)
 * - page_id: Filter by page ID
 * - moderation_status: Filter by moderation status (pending, approved, rejected)
 * - uploader_id: Filter by uploader ID
 * - limit: Number of photos per page (default: 50)
 * - offset: Offset for pagination (default: 0)
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      page_type: searchParams.get('page_type') as any,
      page_id: searchParams.get('page_id') || undefined,
      moderation_status: searchParams.get('moderation_status') as any,
      uploader_id: searchParams.get('uploader_id') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    // 3. Call service
    const result = await listPhotos(filters);

    // 4. Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
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
