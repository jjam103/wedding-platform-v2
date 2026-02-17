import { createServerClient } from '@supabase/ssr';
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
 * This endpoint is used by both admin and guest views.
 * - Admin view: Uses authenticated admin session
 * - Guest view: Uses authenticated guest session (guests log in with email)
 * 
 * @param request - Request object
 * @param params - Route params with type and id
 * @returns Entity preview details
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
): Promise<NextResponse> {
  try {
    console.log('[API] Reference preview request received');
    
    // 1. Create Supabase client with user's session (admin or guest)
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
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );

    // Check if user is authenticated (required for accessing published content)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[API] Session check:', {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      cookieCount: cookieStore.getAll().length
    });
    
    // Note: We don't enforce authentication here because the RLS policies will handle it.
    // If the user is not authenticated, the queries will return no results due to RLS.
    // This allows for graceful degradation in the UI.

    // 2. Validate parameters
    const resolvedParams = await params;
    const { type, id } = resolvedParams;
    
    console.log('[API] Request params:', { type, id });
    
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
        console.log('[API] Fetching event:', { 
          id, 
          status: 'published', 
          authenticated: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        
        const { data: event, error } = await supabase
          .from('events')
          .select('id, name, slug, status, start_date, end_date, description, event_type, location_id, locations(name)')
          .eq('id', id)
          .eq('status', 'published')
          .single();

        console.log('[API] Event fetch result:', { 
          event, 
          error,
          errorCode: error?.code,
          errorMessage: error?.message,
          errorDetails: error?.details,
          errorHint: error?.hint 
        });

        if (error || !event) {
          console.error('[API] Event fetch failed:', {
            error,
            id,
            status: 'published',
            authenticated: !!session
          });
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Event not found' },
            },
            { status: 404 }
          );
        }

        console.log('[API] Event found, building preview:', {
          eventId: event.id,
          eventName: event.name,
          hasLocation: !!event.location_id,
          locationName: (event.locations as any)?.name
        });

        preview = {
          id: event.id,
          name: event.name,
          type: 'event',
          slug: event.slug,
          status: event.status,
          details: {
            eventType: event.event_type,
            startTime: event.start_date,
            endTime: event.end_date,
            date: event.start_date,
            description: event.description,
            location: (event.locations as any)?.name,
          },
        };
        
        console.log('[API] Preview built successfully:', preview);
        break;
      }

      case 'activity': {
        console.log('[API] Fetching activity:', { 
          id, 
          status: 'published', 
          authenticated: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        
        const { data: activity, error } = await supabase
          .from('activities')
          .select('id, name, slug, capacity, start_time, end_time, description, activity_type, cost_per_person, location_id, locations(name)')
          .eq('id', id)
          .eq('status', 'published')
          .single();

        console.log('[API] Activity fetch result:', { 
          activity, 
          error,
          errorCode: error?.code,
          errorMessage: error?.message,
          errorDetails: error?.details,
          errorHint: error?.hint 
        });

        if (error || !activity) {
          console.error('[API] Activity fetch failed:', {
            error,
            id,
            status: 'published',
            authenticated: !!session
          });
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

        console.log('[API] Activity found, building preview:', {
          activityId: activity.id,
          activityName: activity.name,
          hasLocation: !!activity.location_id,
          locationName: (activity.locations as any)?.name,
          rsvpCount
        });

        preview = {
          id: activity.id,
          name: activity.name,
          type: 'activity',
          slug: activity.slug,
          details: {
            activityType: activity.activity_type,
            startTime: activity.start_time,
            endTime: activity.end_time,
            date: activity.start_time,
            description: activity.description,
            capacity: activity.capacity,
            attendees: rsvpCount || 0,
            costPerPerson: activity.cost_per_person,
            location: (activity.locations as any)?.name,
          },
        };
        
        console.log('[API] Preview built successfully:', preview);
        break;
      }

      case 'accommodation': {
        const { data: accommodation, error } = await supabase
          .from('accommodations')
          .select('id, name, slug, check_in_date, check_out_date, description, address, location_id, locations(name)')
          .eq('id', id)
          .single();

        if (error || !accommodation) {
          console.error('Accommodation fetch error:', error);
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
            room_count: roomTypeCount || 0,
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
          .eq('status', 'published')
          .single();

        if (error || !page) {
          console.error('Content page fetch error:', error);
          return NextResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Content page not found' },
            },
            { status: 404 }
          );
        }

        // Get section count - use 'sections' table, not 'content_sections'
        const { count: sectionCount } = await supabase
          .from('sections')
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
