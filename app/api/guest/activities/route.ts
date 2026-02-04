import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';
import * as rsvpService from '@/services/rsvpService';
import { z } from 'zod';

/**
 * GET /api/guest/activities
 * 
 * Lists all activities the authenticated guest is invited to with RSVP status and capacity info.
 * 
 * Query Parameters:
 * - type: Activity type filter (ceremony, reception, meal, transport, activity, other)
 * - from: ISO date string (optional) - Filter activities from this date
 * - to: ISO date string (optional) - Filter activities to this date
 * 
 * Requirements: 9.3, 9.4, 9.5, 9.7
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
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
    // Validate activity type if provided
    const validTypes = ['ceremony', 'reception', 'meal', 'transport', 'activity', 'other'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid activity type' } },
        { status: 400 }
      );
    }
    
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
    
    // 3. SERVICE CALL - Get published activities
    const activitiesResult = await activityService.list({
      status: 'published',
      activityType: type || undefined,
      startTimeFrom: from || undefined,
      startTimeTo: to || undefined,
    });
    
    if (!activitiesResult.success) {
      return NextResponse.json(activitiesResult, { status: 500 });
    }
    
    // Get RSVP status and capacity info for each activity
    const activitiesWithDetails = await Promise.all(
      activitiesResult.data.activities.map(async (activity) => {
        const rsvpResult = await rsvpService.list({
          guest_id: guest.id,
          activity_id: activity.id,
          page: 1,
          page_size: 1
        });
        
        const rsvpStatus = rsvpResult.success && rsvpResult.data.rsvps.length > 0
          ? rsvpResult.data.rsvps[0].status
          : 'pending';
        
        // Get current attendee count from RSVPs
        const { data: attendingRsvps } = await supabase
          .from('rsvps')
          .select('guest_count')
          .eq('activity_id', activity.id)
          .eq('status', 'attending');
        
        const currentAttendees = attendingRsvps
          ? attendingRsvps.reduce((sum, rsvp) => sum + (rsvp.guest_count || 1), 0)
          : 0;
        
        // Calculate capacity remaining
        const capacityRemaining = activity.capacity
          ? activity.capacity - currentAttendees
          : null;
        
        // Calculate net cost (cost per person - host subsidy)
        const netCost = activity.costPerPerson
          ? Math.max(0, activity.costPerPerson - (activity.hostSubsidy || 0))
          : 0;
        
        return {
          ...activity,
          rsvpStatus,
          capacityRemaining,
          netCost,
        };
      })
    );
    
    // 4. RESPONSE
    return NextResponse.json({
      success: true,
      data: activitiesWithDetails,
    });
    
  } catch (error) {
    console.error('API Error:', { path: request.url, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
