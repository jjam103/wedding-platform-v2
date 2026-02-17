import { NextResponse } from 'next/server';
import * as eventService from '@/services/eventService';
import * as activityService from '@/services/activityService';
import * as rsvpService from '@/services/rsvpService';
import { z } from 'zod';
import { validateGuestAuth } from '@/lib/guestAuth';

/**
 * GET /api/guest/events/[slug]
 * 
 * Gets a single event by slug with RSVP status and activities list.
 * 
 * Requirements: 9.1, 9.2
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { slug } = await params;
    
    // 1. AUTHENTICATION
    const authResult = await validateGuestAuth();
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    const guest = authResult.guest;
    
    // 2. VALIDATION
    const slugValidation = z.string().min(1).safeParse(slug);
    
    if (!slugValidation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid slug' } },
        { status: 400 }
      );
    }
    
    // 3. SERVICE CALL - Get event by slug
    const eventResult = await eventService.getBySlug(slugValidation.data);
    
    if (!eventResult.success) {
      return NextResponse.json(eventResult, { status: 404 });
    }
    
    // Get RSVP status for this event
    const rsvpResult = await rsvpService.list({
      guest_id: guest.id,
      event_id: eventResult.data.id,
      page: 1,
      page_size: 1
    });
    
    const eventRsvpStatus = rsvpResult.success && rsvpResult.data.rsvps.length > 0
      ? rsvpResult.data.rsvps[0].status
      : 'pending';
    
    // Get activities for this event
    const activitiesResult = await activityService.list({
      eventId: eventResult.data.id,
    });
    
    // Get RSVP status for each activity
    const activitiesWithRsvp = activitiesResult.success
      ? await Promise.all(
          activitiesResult.data.activities.map(async (activity) => {
            const activityRsvpResult = await rsvpService.list({
              guest_id: guest.id,
              activity_id: activity.id,
              page: 1,
              page_size: 1
            });
            
            const activityRsvpStatus = activityRsvpResult.success && activityRsvpResult.data.rsvps.length > 0
              ? activityRsvpResult.data.rsvps[0].status
              : 'pending';
            
            return {
              ...activity,
              rsvpStatus: activityRsvpStatus,
            };
          })
        )
      : [];
    
    // 4. RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        ...eventResult.data,
        rsvpStatus: eventRsvpStatus,
        activities: activitiesWithRsvp,
      },
    });
    
  } catch (error) {
    console.error('API Error:', { path: request.url, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
