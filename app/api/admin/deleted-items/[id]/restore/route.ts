/**
 * Restore Deleted Item API Route
 * 
 * POST /api/admin/deleted-items/[id]/restore - Restore a soft-deleted item
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
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

    // 3. Restore item by clearing deleted_at
    const tableName = type === 'content_page' ? 'content_pages' : 
                      type === 'section' ? 'sections' :
                      type === 'column' ? 'columns' :
                      type === 'photo' ? 'photos' :
                      type === 'event' ? 'events' :
                      type === 'activity' ? 'activities' : null;

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid type' },
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(tableName)
      .update({ deleted_at: null, deleted_by: null })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: undefined });
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
