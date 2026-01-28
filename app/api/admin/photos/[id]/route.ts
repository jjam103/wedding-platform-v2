import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { getPhoto, deletePhoto, updatePhoto } from '@/services/photoService';

/**
 * GET /api/admin/photos/[id]
 * Gets a single photo by ID
 */
export async function GET(
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

    // 5. Call service
    const result = await getPhoto(id);

    // 4. Return response
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

/**
 * PATCH /api/admin/photos/[id]
 * Updates photo metadata
 */
export async function PATCH(
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

    // 2. Parse request body
    const body = await request.json();

    // 5. Call service
    const result = await updatePhoto(id, body);

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

/**
 * DELETE /api/admin/photos/[id]
 * Deletes a photo
 */
export async function DELETE(
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

    // 5. Call service
    const result = await deletePhoto(id);

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
