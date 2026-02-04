import { NextResponse } from 'next/server';
import { getPhoto } from '@/services/photoService';

/**
 * GET /api/photos/[id]
 * 
 * Public endpoint to get a single photo by ID
 * No authentication required - used for guest-facing photo galleries
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params
    const { id } = await params;

    // 2. Call service (no auth check - public endpoint)
    const result = await getPhoto(id);

    // 3. Return response
    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        DATABASE_ERROR: 500,
        UNKNOWN_ERROR: 500,
      };
      return NextResponse.json(result, {
        status: statusMap[result.error.code] || 500,
      });
    }

    // Only return approved photos to public
    if (result.data.moderation_status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Photo not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
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
