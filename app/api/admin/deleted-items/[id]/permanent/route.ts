/**
 * Permanent Delete Item API Route
 * 
 * DELETE /api/admin/deleted-items/[id]/permanent - Permanently delete a soft-deleted item
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { deleteContentPage } from '@/services/contentPagesService';
import { deleteEvent } from '@/services/eventService';
import { deleteActivity } from '@/services/activityService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
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

    // 2. Parse request body
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Type is required' },
        },
        { status: 400 }
      );
    }

    // 3. Permanently delete based on type
    let result;

    switch (type) {
      case 'content_page':
        result = await deleteContentPage(id, { permanent: true });
        break;

      case 'event':
        result = await deleteEvent(id, { permanent: true });
        break;

      case 'activity':
        result = await deleteActivity(id, { permanent: true });
        break;

      case 'section':
      case 'column':
      case 'photo':
        // Direct database deletion for these types
        const { error } = await supabase
          .from(type === 'section' ? 'sections' : type === 'column' ? 'columns' : 'photos')
          .delete()
          .eq('id', id);

        if (error) {
          result = {
            success: false,
            error: { code: 'DATABASE_ERROR', message: error.message },
          };
        } else {
          result = { success: true, data: undefined };
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid type' },
          },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
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
