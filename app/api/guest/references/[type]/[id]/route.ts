import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/guest/references/[type]/[id]
 * 
 * Fetch reference details for guest view (public access)
 * Supports: events, activities, content_pages, accommodations, locations
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    // Use anon client for public access (no auth required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { type, id } = await context.params;

    // Validate type
    const validTypes = ['event', 'activity', 'content_page', 'accommodation', 'location'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid reference type' } },
        { status: 400 }
      );
    }

    // Map type to table name
    const tableMap: Record<string, string> = {
      event: 'events',
      activity: 'activities',
      content_page: 'content_pages',
      accommodation: 'accommodations',
      location: 'locations',
    };

    const tableName = tableMap[type];
    const hasDeletedAt = ['events', 'activities', 'content_pages'].includes(tableName);
    
    // Build query - only select columns that exist
    let query = supabase.from(tableName).select('*').eq('id', id);
    
    if (hasDeletedAt) {
      query = query.is('deleted_at', null);
    }
    
    // Only filter by status if the table has this column
    if (['events', 'activities', 'content_pages'].includes(tableName)) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: `${type} not found` } },
        { status: 404 }
      );
    }

    // Fetch location separately if needed
    let locationName = null;
    if (data.location_id) {
      const { data: location } = await supabase
        .from('locations')
        .select('name')
        .eq('id', data.location_id)
        .single();
      locationName = location?.name;
    }

    // Format response
    const formattedData: any = {
      id: data.id,
      name: data.name || data.title,
      type,
      slug: data.slug,
      status: data.status,
      details: {},
    };

    // Type-specific details
    switch (type) {
      case 'event':
        formattedData.details = {
          description: data.description,
          startDate: data.start_date,
          endDate: data.end_date,
          location: locationName,
          rsvpRequired: data.rsvp_required,
          rsvpDeadline: data.rsvp_deadline,
          eventType: data.event_type,
        };
        break;

      case 'activity':
        formattedData.details = {
          description: data.description,
          startTime: data.start_time,
          endTime: data.end_time,
          location: locationName,
          capacity: data.capacity,
          activityType: data.activity_type,
          costPerPerson: data.cost_per_person,
        };
        break;

      case 'content_page':
        formattedData.details = {
          description: data.description,
          pageType: data.page_type,
        };
        break;

      case 'accommodation':
        formattedData.details = {
          description: data.description,
          address: data.address,
          city: data.city,
          roomCount: data.room_type_count,
        };
        break;

      case 'location':
        formattedData.details = {
          description: data.description,
          locationType: data.type,
          address: data.address,
          city: data.city,
          country: data.country,
        };
        break;
    }

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('[Guest References API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reference' } },
      { status: 500 }
    );
  }
}
