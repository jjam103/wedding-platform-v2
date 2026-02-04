import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/wedding-info
 * 
 * Returns wedding date, location, and venue information
 * 
 * Requirements: 7.2, 7.3
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

    // Get wedding info from settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('wedding_date, wedding_location, wedding_venue')
      .single();

    if (settingsError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: settingsError.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        date: settings.wedding_date,
        location: settings.wedding_location || 'Costa Rica',
        venue: settings.wedding_venue || 'TBD',
      },
    });
  } catch (error) {
    console.error('Error fetching wedding info:', error);
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
