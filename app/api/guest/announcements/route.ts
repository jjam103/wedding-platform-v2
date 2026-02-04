import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/announcements
 * 
 * Returns active announcements for guests
 * 
 * Requirements: 7.7
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
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

    // Get active announcements
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, title, message, urgent, created_at')
      .eq('active', true)
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (announcementsError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: announcementsError.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcements || [],
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
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
