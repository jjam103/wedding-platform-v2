import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as rsvpService from '@/services/rsvpService';
import { ERROR_CODES } from '@/types';

/**
 * GET /api/guest/rsvps/summary
 * 
 * Returns RSVP summary for the authenticated guest.
 * Includes event and activity counts, and status breakdown.
 * 
 * Requirements: 7.5
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get guest ID from session
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Guest not found' } },
        { status: 404 }
      );
    }

    // 2. Get all RSVPs for this guest
    const rsvpsResult = await rsvpService.getByGuest(guest.id);

    if (!rsvpsResult.success) {
      return NextResponse.json(rsvpsResult, { status: 500 });
    }

    const rsvps = rsvpsResult.data;

    // 3. Calculate summary statistics
    const summary = {
      total_rsvps: rsvps.length,
      events: {
        total: rsvps.filter(r => r.event_id).length,
        attending: rsvps.filter(r => r.event_id && r.status === 'attending').length,
        declined: rsvps.filter(r => r.event_id && r.status === 'declined').length,
        maybe: rsvps.filter(r => r.event_id && r.status === 'maybe').length,
        pending: rsvps.filter(r => r.event_id && r.status === 'pending').length,
      },
      activities: {
        total: rsvps.filter(r => r.activity_id).length,
        attending: rsvps.filter(r => r.activity_id && r.status === 'attending').length,
        declined: rsvps.filter(r => r.activity_id && r.status === 'declined').length,
        maybe: rsvps.filter(r => r.activity_id && r.status === 'maybe').length,
        pending: rsvps.filter(r => r.activity_id && r.status === 'pending').length,
      },
      overall: {
        attending: rsvps.filter(r => r.status === 'attending').length,
        declined: rsvps.filter(r => r.status === 'declined').length,
        maybe: rsvps.filter(r => r.status === 'maybe').length,
        pending: rsvps.filter(r => r.status === 'pending').length,
      },
      response_rate: rsvps.length > 0 
        ? Math.round((rsvps.filter(r => r.status !== 'pending').length / rsvps.length) * 100)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
