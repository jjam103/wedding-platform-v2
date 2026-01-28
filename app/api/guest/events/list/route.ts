import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/events/list
 * 
 * Retrieves all published events visible to the authenticated guest.
 * 
 * Requirements: 13.6, 6.1-6.8
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    
    // Get guest information
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, guest_type')
      .eq('email', user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // Fetch published events visible to this guest type
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .or(`visibility.cs.{${guest.guest_type}},visibility.eq.{}`)
      .order('start_date', { ascending: true });
    
    if (eventsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: eventsError.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: events || [] });
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
