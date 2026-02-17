/**
 * Bulk Delete Activities API Route
 * 
 * POST /api/admin/activities/bulk-delete - Soft delete multiple activities
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

export async function POST(request: Request) {
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

    // 2. Validation
    const body = await request.json();
    const validation = bulkDeleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { ids } = validation.data;

    // 3. Soft delete activities (set deleted_at timestamp)
    const { error: deleteError } = await supabase
      .from('activities')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: session.user.id,
      })
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: deleteError.message,
            details: deleteError,
          },
        },
        { status: 500 }
      );
    }

    // 4. Return success
    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully deleted ${ids.length} activity/activities`,
        deletedCount: ids.length,
      },
    });
  } catch (error) {
    console.error('Bulk delete activities error:', error);
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
