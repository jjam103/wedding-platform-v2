import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as eventService from '@/services/eventService';
import * as rsvpService from '@/services/rsvpService';

/**
 * GET /api/guest/events
 * 
 * Lists all events the authenticated guest is invited to with RSVP status.
 * 
 * Query Parameters:
 * - from: ISO date string (optional) - Filter events from this date
 * - to: ISO date string (optional) - Filter events to this date
 * 
 * Requirements: 9.1, 9.2, 9.5, 9.6
 */
export async function GET(request: Request) {
  try {
    // 1. AUTHENTICATION
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Get guest ID from session
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, group_id')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // 2. VALIDATION (query parameters)
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    // Validate date formats if provided
    if (from && isNaN(Date.parse(from))) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid from date format' } },
        { status: 400 }
      );
    }
    
    if (to && isNaN(Date.parse(to))) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid to date format' } },
        { status: 400 }
      );
    }
    
    // 3. SERVICE CALL - Get published events
    const eventsResult = await eventService.list({
      status: 'published',
      startDateFrom: from || undefined,
      startDateTo: to || undefined,
    });
    
    if (!eventsResult.success) {
      return NextResponse.json(eventsResult, { status: 500 });
    }
    
    // Get RSVP status for each event
    const eventsWithRsvp = await Promise.all(
      eventsResult.data.events.map(async (event) => {
        const rsvpResult = await rsvpService.list({ 
          guest_id: guest.id, 
          event_id: event.id,
          page: 1,
          page_size: 1
        });
        
        const rsvpStatus = rsvpResult.success && rsvpResult.data.rsvps.length > 0
          ? rsvpResult.data.rsvps[0].status
          : 'pending';
        
        return {
          ...event,
          rsvpStatus,
        };
      })
    );
    
    // 4. RESPONSE
    return NextResponse.json({
      success: true,
      data: eventsWithRsvp,
    });
    
  } catch (error) {
    console.error('API Error:', { path: request.url, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
