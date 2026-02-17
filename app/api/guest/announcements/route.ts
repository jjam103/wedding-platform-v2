import { NextResponse } from 'next/server';
import { validateGuestAuth } from '@/lib/guestAuth';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/guest/announcements
 * 
 * Returns active announcements for guests
 * 
 * Requirements: 7.7
 */
export async function GET() {
  try {
    // Check authentication
    const authResult = await validateGuestAuth();
    
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }

    const supabase = createSupabaseClient();

    // Get active announcements
    const { data: announcements, error: announcementsError } = await supabase
      .from('announcements')
      .select('id, title, message, urgent, created_at')
      .eq('active', true)
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    // Handle missing table gracefully
    // Return empty array instead of error for better UX
    if (announcementsError) {
      return NextResponse.json({
        success: true,
        data: [],
      });
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
