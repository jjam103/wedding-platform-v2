import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const typesParam = searchParams.get('types') || 'event,activity,content_page,accommodation';
    const types = typesParam.split(',').filter(Boolean);

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          events: [],
          activities: [],
          content_pages: [],
          accommodations: [],
        },
      });
    }

    // 3. Search across entity types
    const results: {
      events: any[];
      activities: any[];
      content_pages: any[];
      accommodations: any[];
    } = {
      events: [],
      activities: [],
      content_pages: [],
      accommodations: [],
    };

    // Search events
    if (types.includes('event')) {
      try {
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, name, slug, start_date, location_id, locations(name)')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .is('deleted_at', null)
          .order('start_date', { ascending: true })
          .limit(10);

        if (eventsError) {
          console.error('Events search error:', eventsError);
        } else if (events) {
          results.events = events.map((event: any) => ({
            id: event.id,
            name: event.name,
            slug: event.slug,
            date: event.start_date,
            location: event.locations?.name,
          }));
        }
      } catch (err) {
        console.error('Events search exception:', err);
      }
    }

    // Search activities
    if (types.includes('activity')) {
      try {
        const { data: activities, error: activitiesError } = await supabase
          .from('activities')
          .select('id, name, slug, start_time, capacity, location_id, locations(name)')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .is('deleted_at', null)
          .order('start_time', { ascending: true })
          .limit(10);

        if (activitiesError) {
          console.error('Activities search error:', activitiesError);
        } else if (activities) {
          results.activities = activities.map((activity: any) => ({
            id: activity.id,
            name: activity.name,
            slug: activity.slug,
            date: activity.start_time,
            capacity: activity.capacity,
            location: activity.locations?.name,
          }));
        }
      } catch (err) {
        console.error('Activities search exception:', err);
      }
    }

    // Search content pages
    if (types.includes('content_page')) {
      try {
        const { data: pages, error: pagesError } = await supabase
          .from('content_pages')
          .select('id, title, slug, type')
          .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
          .eq('status', 'published')
          .is('deleted_at', null)
          .order('title', { ascending: true })
          .limit(10);

        if (pagesError) {
          console.error('Content pages search error:', pagesError);
        } else if (pages) {
          results.content_pages = pages.map((page: any) => ({
            id: page.id,
            title: page.title,
            slug: page.slug,
            type: page.type,
          }));
        }
      } catch (err) {
        console.error('Content pages search exception:', err);
      }
    }

    // Search accommodations (no deleted_at column)
    if (types.includes('accommodation')) {
      try {
        const { data: accommodations, error: accommodationsError } = await supabase
          .from('accommodations')
          .select('id, name, slug, location_id, locations(name)')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('name', { ascending: true })
          .limit(10);

        if (accommodationsError) {
          console.error('Accommodations search error:', accommodationsError);
        } else if (accommodations) {
          // Get room counts separately for each accommodation
          const accommodationsWithRoomCounts = await Promise.all(
            accommodations.map(async (accommodation: any) => {
              try {
                const { count } = await supabase
                  .from('room_types')
                  .select('*', { count: 'exact', head: true })
                  .eq('accommodation_id', accommodation.id);
                
                return {
                  id: accommodation.id,
                  name: accommodation.name,
                  slug: accommodation.slug,
                  location: accommodation.locations?.name,
                  room_count: count || 0,
                };
              } catch (err) {
                console.error(`Error fetching room count for accommodation ${accommodation.id}:`, err);
                return {
                  id: accommodation.id,
                  name: accommodation.name,
                  slug: accommodation.slug,
                  location: accommodation.locations?.name,
                  room_count: 0,
                };
              }
            })
          );
          
          results.accommodations = accommodationsWithRoomCounts;
        }
      } catch (err) {
        console.error('Accommodations search exception:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Reference search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Search failed',
        },
      },
      { status: 500 }
    );
  }
}
