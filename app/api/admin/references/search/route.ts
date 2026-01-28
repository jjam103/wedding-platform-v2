import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  slug?: string;
  status?: string;
  preview?: string;
}

/**
 * Search across multiple entity types for reference linking
 * 
 * @param request - Request with query params: q (query), type (comma-separated entity types)
 * @returns Search results ordered by relevance
 */
export async function GET(request: Request): Promise<NextResponse> {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const typeParam = searchParams.get('type') || '';

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: { results: [], total: 0 },
      });
    }

    const entityTypes = typeParam.split(',').filter(Boolean);
    if (entityTypes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one entity type is required',
          },
        },
        { status: 400 }
      );
    }

    // 3. Search across entity types
    const results: SearchResult[] = [];
    const searchPattern = `%${query.toLowerCase()}%`;

    // Search events
    if (entityTypes.includes('event')) {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, slug, is_active, start_time')
        .or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`)
        .limit(20);

      if (events) {
        results.push(
          ...events.map((event) => ({
            id: event.id,
            name: event.name,
            type: 'event',
            slug: event.slug,
            status: event.is_active ? 'active' : 'inactive',
            preview: event.start_time
              ? `${new Date(event.start_time).toLocaleDateString()} • ${
                  event.is_active ? 'Active' : 'Inactive'
                }`
              : event.is_active
              ? 'Active'
              : 'Inactive',
          }))
        );
      }
    }

    // Search activities
    if (entityTypes.includes('activity')) {
      const { data: activities } = await supabase
        .from('activities')
        .select('id, name, slug, capacity, start_time')
        .or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`)
        .limit(20);

      if (activities) {
        // Get RSVP counts for capacity display
        const activityIds = activities.map((a) => a.id);
        const { data: rsvpCounts } = await supabase
          .from('rsvps')
          .select('activity_id')
          .in('activity_id', activityIds)
          .eq('status', 'attending');

        const rsvpCountMap = new Map<string, number>();
        rsvpCounts?.forEach((rsvp) => {
          rsvpCountMap.set(rsvp.activity_id, (rsvpCountMap.get(rsvp.activity_id) || 0) + 1);
        });

        results.push(
          ...activities.map((activity) => {
            const attendees = rsvpCountMap.get(activity.id) || 0;
            const capacityText = activity.capacity
              ? `${attendees}/${activity.capacity} capacity`
              : `${attendees} attendees`;

            return {
              id: activity.id,
              name: activity.name,
              type: 'activity',
              slug: activity.slug,
              preview: activity.start_time
                ? `${new Date(activity.start_time).toLocaleDateString()} • ${capacityText}`
                : capacityText,
            };
          })
        );
      }
    }

    // Search accommodations
    if (entityTypes.includes('accommodation')) {
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('id, name, slug, check_in_date, check_out_date')
        .or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`)
        .limit(20);

      if (accommodations) {
        results.push(
          ...accommodations.map((accommodation) => ({
            id: accommodation.id,
            name: accommodation.name,
            type: 'accommodation',
            slug: accommodation.slug,
            preview:
              accommodation.check_in_date && accommodation.check_out_date
                ? `${new Date(accommodation.check_in_date).toLocaleDateString()} - ${new Date(
                    accommodation.check_out_date
                  ).toLocaleDateString()}`
                : undefined,
          }))
        );
      }
    }

    // Search room types
    if (entityTypes.includes('room_type')) {
      const { data: roomTypes } = await supabase
        .from('room_types')
        .select('id, name, accommodation_id, capacity, price_per_night, accommodations(name)')
        .or(`name.ilike.${searchPattern}`)
        .limit(20);

      if (roomTypes) {
        results.push(
          ...roomTypes.map((roomType) => ({
            id: roomType.id,
            name: roomType.name,
            type: 'room_type',
            preview: `${(roomType.accommodations as any)?.name || 'Unknown'} • Capacity: ${
              roomType.capacity
            } • $${roomType.price_per_night}/night`,
          }))
        );
      }
    }

    // Search content pages
    if (entityTypes.includes('content_page')) {
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id, title, slug, status')
        .or(`title.ilike.${searchPattern},slug.ilike.${searchPattern}`)
        .limit(20);

      if (pages) {
        results.push(
          ...pages.map((page) => ({
            id: page.id,
            name: page.title,
            type: 'content_page',
            slug: page.slug,
            status: page.status,
            preview: `${page.status === 'published' ? 'Published' : 'Draft'} • /${page.slug}`,
          }))
        );
      }
    }

    // 4. Sort results by relevance (exact matches first, then partial)
    // Add index to each result for stable sorting
    const indexedResults = results.map((result, index) => ({ result, index }));
    
    indexedResults.sort((a, b) => {
      const aExact = a.result.name.toLowerCase() === query.toLowerCase();
      const bExact = b.result.name.toLowerCase() === query.toLowerCase();

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then sort alphabetically with normalization for consistent ordering
      // Trim whitespace for comparison
      const aName = a.result.name.trim().toLowerCase();
      const bName = b.result.name.trim().toLowerCase();
      
      // Handle empty strings after trimming - sort them to the end
      if (aName === '' && bName !== '') return 1;
      if (aName !== '' && bName === '') return -1;
      
      // Use simple string comparison for deterministic ordering
      // This is more predictable than localeCompare for special characters
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      
      // If names are equal after normalization, maintain original order (stable sort)
      return a.index - b.index;
    });
    
    const sortedResults = indexedResults.map(({ result }) => result);

    // 5. Return results
    return NextResponse.json({
      success: true,
      data: {
        results: sortedResults,
        total: sortedResults.length,
      },
    });
  } catch (error) {
    console.error('Reference search error:', error);
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
