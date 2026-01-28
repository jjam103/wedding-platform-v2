import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/events
 * 
 * Retrieves upcoming events and activities for the authenticated guest.
 * Returns combined list of events and activities with RSVP status.
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
      .select('id, name, event_type, start_date, end_date, location_id, rsvp_required')
      .eq('status', 'published')
      .or(`visibility.cs.{${guest.guest_type}},visibility.eq.{}`)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    if (eventsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: eventsError.message } },
        { status: 500 }
      );
    }
    
    // Fetch published activities visible to this guest type
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, activity_type, start_time, end_time, location_id, event_id')
      .eq('status', 'published')
      .or(`visibility.cs.{${guest.guest_type}},visibility.eq.{}`)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });
    
    if (activitiesError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: activitiesError.message } },
        { status: 500 }
      );
    }
    
    // Fetch RSVPs for this guest
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('event_id, activity_id, status')
      .eq('guest_id', guest.id);
    
    if (rsvpsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: rsvpsError.message } },
        { status: 500 }
      );
    }
    
    // Create RSVP lookup map
    const rsvpMap = new Map<string, string>();
    rsvps?.forEach(rsvp => {
      if (rsvp.event_id) {
        rsvpMap.set(`event-${rsvp.event_id}`, rsvp.status);
      }
      if (rsvp.activity_id) {
        rsvpMap.set(`activity-${rsvp.activity_id}`, rsvp.status);
      }
    });
    
    // Combine and format events and activities
    const combinedEvents = [
      ...(events || []).map(event => ({
        id: event.id,
        name: event.name,
        type: 'event' as const,
        date: event.start_date,
        time: event.start_date,
        location: event.location_id,
        rsvpStatus: rsvpMap.get(`event-${event.id}`) || 'pending',
      })),
      ...(activities || []).map(activity => ({
        id: activity.id,
        name: activity.name,
        type: 'activity' as const,
        date: activity.start_time,
        time: activity.start_time,
        location: activity.location_id,
        rsvpStatus: rsvpMap.get(`activity-${activity.id}`) || 'pending',
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({ success: true, data: combinedEvents });
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
