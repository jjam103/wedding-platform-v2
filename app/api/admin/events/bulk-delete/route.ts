import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * Bulk delete events
 * 
 * @param request - Request with array of event IDs
 * @returns Success response with count of deleted events
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Authentication
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

    // 3. Soft delete events (set deleted_at timestamp)
    const { error: deleteError, count } = await supabase
      .from('events')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_by: session.user.id 
      })
      .in('id', ids)
      .is('deleted_at', null); // Only delete non-deleted events

    if (deleteError) {
      console.error('Bulk delete error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete events',
            details: deleteError,
          },
        },
        { status: 500 }
      );
    }

    // 4. Response
    return NextResponse.json({
      success: true,
      data: {
        deleted: count || 0,
        message: `Successfully deleted ${count || 0} event(s)`,
      },
    });
  } catch (error) {
    console.error('Bulk delete events error:', error);
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
