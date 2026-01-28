import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/rsvps
 * 
 * Retrieves all RSVPs for the authenticated guest.
 * Returns RSVP records with status information.
 * 
 * Requirements: 13.1, 13.5
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
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // Fetch all RSVPs for this guest
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('guest_id', guest.id)
      .order('created_at', { ascending: false });
    
    if (rsvpsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: rsvpsError.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: rsvps || [] });
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
