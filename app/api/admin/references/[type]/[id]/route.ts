import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface EntityPreview {
  id: string;
  name: string;
  type: string;
  slug?: string;
  status?: string;
  details: Record<string, any>;
}

/**
 * Get entity preview details for reference cards
 * 
 * @param request - Request object
 * @param params - Route params with type and id
 * @returns Entity preview details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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

    // 2. Validate parameters
    const { type, id } = params;
    const validTypes = ['event', 'activity', 'accommodation', 'room_type', 'content_page'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid entity type. Must be one of: ${validTypes.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // 3. Fetch entity based on type
    let preview: EntityPreview | null = null;

    switch (type) {
      case 'event': {
        const { data: event, error } = await supabase
          .from('events')
          .select('id, name, slug, is_active, start_time, end_time, description, event_type, locations(name)')
          .eq('id', id)
          .single();

        if (error || !event) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Event not found' },
            },
            { status: 404 }
          );
        }

        preview = {
          id: event.id,
          name: event.name,
          type: 'event',
          slug: event.slug,
          status: event.is_active ? 'active' : 'inactive',
          details: {
            eventType: event.event_type,
            startTime: event.start_time,
            endTime: event.end_time,
            description: event.description,
            location: (event.locations as any)?.name,
          },
        };
        break;
      }

      case 'activity': {
        const { data: activity, error } = await supabase
          .from('activities')
          .select('id, name, slug, capacity, start_time, end_time, description, activity_type, cost_per_person, locations(name)')
          .eq('id', id)
          .single();

        if (error || !activity) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Activity not found' },
            },
            { status: 404 }
          );
        }

        // Get RSVP count
        const { count: rsvpCount } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', id)
          .eq('status', 'attending');

        preview = {
          id: activity.id,
          name: activity.name,
          type: 'activity',
          slug: activity.slug,
          details: {
            activityType: activity.activity_type,
            startTime: activity.start_time,
            endTime: activity.end_time,
            description: activity.description,
            capacity: activity.capacity,
            attendees: rsvpCount || 0,
            costPerPerson: activity.cost_per_person,
            location: (activity.locations as any)?.name,
          },
        };
        break;
      }

      case 'accommodation': {
        const { data: accommodation, error } = await supabase
          .from('accommodations')
          .select('id, name, slug, check_in_date, check_out_date, description, address, locations(name)')
          .eq('id', id)
          .single();

        if (error || !accommodation) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Accommodation not found' },
            },
            { status: 404 }
          );
        }

        // Get room type count
        const { count: roomTypeCount } = await supabase
          .from('room_types')
          .select('*', { count: 'exact', head: true })
          .eq('accommodation_id', id);

        preview = {
          id: accommodation.id,
          name: accommodation.name,
          type: 'accommodation',
          slug: accommodation.slug,
          details: {
            checkInDate: accommodation.check_in_date,
            checkOutDate: accommodation.check_out_date,
            description: accommodation.description,
            address: accommodation.address,
            location: (accommodation.locations as any)?.name,
            roomTypeCount: roomTypeCount || 0,
          },
        };
        break;
      }

      case 'room_type': {
        const { data: roomType, error } = await supabase
          .from('room_types')
          .select('id, name, capacity, price_per_night, description, check_in_date, check_out_date, accommodations(name)')
          .eq('id', id)
          .single();

        if (error || !roomType) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Room type not found' },
            },
            { status: 404 }
          );
        }

        // Get guest assignment count
        const { count: guestCount } = await supabase
          .from('room_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('room_type_id', id);

        preview = {
          id: roomType.id,
          name: roomType.name,
          type: 'room_type',
          details: {
            accommodationName: (roomType.accommodations as any)?.name,
            capacity: roomType.capacity,
            pricePerNight: roomType.price_per_night,
            description: roomType.description,
            checkInDate: roomType.check_in_date,
            checkOutDate: roomType.check_out_date,
            guestCount: guestCount || 0,
          },
        };
        break;
      }

      case 'content_page': {
        const { data: page, error } = await supabase
          .from('content_pages')
          .select('id, title, slug, status, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error || !page) {
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Content page not found' },
            },
            { status: 404 }
          );
        }

        // Get section count
        const { count: sectionCount } = await supabase
          .from('content_sections')
          .select('*', { count: 'exact', head: true })
          .eq('page_type', 'custom')
          .eq('page_id', id);

        preview = {
          id: page.id,
          name: page.title,
          type: 'content_page',
          slug: page.slug,
          status: page.status,
          details: {
            createdAt: page.created_at,
            updatedAt: page.updated_at,
            sectionCount: sectionCount || 0,
          },
        };
        break;
      }
    }

    // 4. Return preview
    return NextResponse.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    console.error('Entity preview error:', error);
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
