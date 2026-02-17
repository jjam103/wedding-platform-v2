import { NextResponse } from 'next/server';
import * as rsvpService from '@/services/rsvpService';
import { ERROR_CODES } from '@/types';
import { validateGuestAuth } from '@/lib/guestAuth';

/**
 * GET /api/guest/rsvps/summary
 * 
 * Returns RSVP summary for the authenticated guest.
 * Includes event and activity counts, and status breakdown.
 * 
 * Requirements: 7.5
 */
export async function GET() {
  try {
    // 1. Auth check
    const authResult = await validateGuestAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    const guest = authResult.guest;

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
