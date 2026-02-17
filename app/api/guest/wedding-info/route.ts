import { NextResponse } from 'next/server';
import { validateGuestAuth } from '@/lib/guestAuth';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/guest/wedding-info
 * 
 * Returns wedding date, location, and venue information
 * 
 * Requirements: 7.2, 7.3
 */
export async function GET() {
  try {
    // Check authentication
    const authResult = await validateGuestAuth();
    
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }

    const supabase = createSupabaseClient();

    // Get wedding info from system_settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('wedding_date, wedding_location, wedding_venue')
      .single();

    // Handle missing table or no data gracefully
    // Return default values instead of error for better UX
    if (settingsError || !settings) {
      return NextResponse.json({
        success: true,
        data: {
          date: null,
          location: 'Costa Rica',
          venue: 'TBD',
        },
      });
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
