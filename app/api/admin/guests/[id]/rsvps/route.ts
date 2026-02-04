import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/guests/[id]/rsvps
 * 
 * Get all RSVPs for a guest (activities, events, accommodations)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing guest ID
 * @returns Guest RSVPs with capacity information
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
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

    // 2. Get guest ID from params
    const { id: guestId } = await params;

    if (!guestId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Guest ID is required' },
        },
        { status: 400 }
      );
    }

    // 3. Fetch activity RSVPs with capacity info
    const { data: activityRSVPs, error: activityError } = await supabase
      .from('activity_rsvps')
      .select(
        `
        id,
        status,
        guest_count,
        dietary_restrictions,
        activities (
          id,
          title,
          date,
          time,
          location,
          capacity,
          requires_guest_count,
          requires_dietary_info
        )
      `
      )
      .eq('guest_id', guestId);

    if (activityError) {
      console.error('Error fetching activity RSVPs:', activityError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch activity RSVPs',
            details: activityError,
          },
        },
        { status: 500 }
      );
    }

    // 4. Fetch event RSVPs
    const { data: eventRSVPs, error: eventError } = await supabase
      .from('event_rsvps')
      .select(
        `
        id,
        status,
        events (
          id,
          title,
          date,
          time,
          location
        )
      `
      )
      .eq('guest_id', guestId);

    if (eventError) {
      console.error('Error fetching event RSVPs:', eventError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch event RSVPs',
            details: eventError,
          },
        },
        { status: 500 }
      );
    }

    // 5. Fetch accommodation assignments
    const { data: accommodations, error: accommodationError } = await supabase
      .from('guest_accommodations')
      .select(
        `
        id,
        check_in_date,
        check_out_date,
        room_types (
          id,
          name,
          accommodations (
            id,
            name,
            location
          )
        )
      `
      )
      .eq('guest_id', guestId);

    if (accommodationError) {
      console.error('Error fetching accommodations:', accommodationError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch accommodations',
            details: accommodationError,
          },
        },
        { status: 500 }
      );
    }

    // 6. Calculate capacity remaining for each activity
    const activitiesWithCapacity = await Promise.all(
      (activityRSVPs || []).map(async (rsvp: any) => {
        const activity = rsvp.activities;
        if (!activity || !activity.capacity) {
          return {
            id: rsvp.id,
            name: activity?.title || 'Unknown Activity',
            type: 'activity' as const,
            status: rsvp.status || 'pending',
            guestCount: rsvp.guest_count,
            dietaryRestrictions: rsvp.dietary_restrictions,
            requiresGuestCount: activity?.requires_guest_count || false,
            requiresDietaryInfo: activity?.requires_dietary_info || false,
            date: activity?.date,
            time: activity?.time,
            location: activity?.location,
          };
        }

        // Count attending RSVPs for this activity
        const { count, error: countError } = await supabase
          .from('activity_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .eq('status', 'attending');

        if (countError) {
          console.error('Error counting RSVPs:', countError);
        }

        const capacityRemaining = activity.capacity - (count || 0);

        return {
          id: rsvp.id,
          name: activity.title,
          type: 'activity' as const,
          status: rsvp.status || 'pending',
          guestCount: rsvp.guest_count,
          dietaryRestrictions: rsvp.dietary_restrictions,
          capacity: activity.capacity,
          capacityRemaining,
          requiresGuestCount: activity.requires_guest_count || false,
          requiresDietaryInfo: activity.requires_dietary_info || false,
          date: activity.date,
          time: activity.time,
          location: activity.location,
        };
      })
    );

    // 7. Format event RSVPs
    const formattedEvents = (eventRSVPs || []).map((rsvp: any) => ({
      id: rsvp.id,
      name: rsvp.events?.title || 'Unknown Event',
      type: 'event' as const,
      status: rsvp.status || 'pending',
      date: rsvp.events?.date,
      time: rsvp.events?.time,
      location: rsvp.events?.location,
    }));

    // 8. Format accommodations
    const formattedAccommodations = (accommodations || []).map((acc: any) => ({
      id: acc.id,
      name: `${acc.room_types?.accommodations?.name || 'Unknown'} - ${acc.room_types?.name || 'Unknown Room'}`,
      type: 'accommodation' as const,
      status: 'attending' as const, // Accommodations are always "attending" if assigned
      date: acc.check_in_date,
      location: acc.room_types?.accommodations?.location,
    }));

    // 9. Return formatted data
    return NextResponse.json({
      success: true,
      data: {
        activities: activitiesWithCapacity,
        events: formattedEvents,
        accommodations: formattedAccommodations,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/guests/[id]/rsvps:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}
