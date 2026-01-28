import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { moderatePhoto } from '@/services/photoService';

/**
 * POST /api/admin/photos/[id]/moderate
 * Moderates a photo (approve or reject)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Await params
    const { id } = await params;

    // 4. Parse and validate request body
    const body = await request.json();

    // 5. Call service
    const result = await moderatePhoto(id, body);

    // 5. Return response
    return NextResponse.json(result, {
      status: result.success ? 200 : result.error.code === 'NOT_FOUND' ? 404 : 500,
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
