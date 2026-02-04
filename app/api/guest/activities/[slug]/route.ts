import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as activityService from '@/services/activityService';
import * as rsvpService from '@/services/rsvpService';
import { z } from 'zod';

/**
 * GET /api/guest/activities/[slug]
 * 
 * Gets a single activity by slug with RSVP status and capacity info.
 * 
 * Requirements: 9.3, 9.4
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { slug } = await params;
    
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
    
    // 2. VALIDATION
    const slugValidation = z.string().min(1).safeParse(slug);
    
    if (!slugValidation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid slug' } },
        { status: 400 }
      );
    }
    
    // 3. SERVICE CALL - Get activity by slug
    const activityResult = await activityService.getBySlug(slugValidation.data);
    
    if (!activityResult.success) {
      return NextResponse.json(activityResult, { status: 404 });
    }
    
    // Get RSVP status for this activity
    const rsvpResult = await rsvpService.list({
      guest_id: guest.id,
      activity_id: activityResult.data.id,
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
      .eq('activity_id', activityResult.data.id)
      .eq('status', 'attending');
    
    const currentAttendees = attendingRsvps
      ? attendingRsvps.reduce((sum, rsvp) => sum + (rsvp.guest_count || 1), 0)
      : 0;
    
    // Calculate capacity remaining
    const capacityRemaining = activityResult.data.capacity
      ? activityResult.data.capacity - currentAttendees
      : null;
    
    // Calculate net cost (cost per person - host subsidy)
    const netCost = activityResult.data.costPerPerson
      ? Math.max(0, activityResult.data.costPerPerson - (activityResult.data.hostSubsidy || 0))
      : 0;
    
    // Calculate capacity percentage
    const capacityPercentage = activityResult.data.capacity
      ? (currentAttendees / activityResult.data.capacity) * 100
      : 0;
    
    // 4. RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        ...activityResult.data,
        rsvpStatus,
        capacityRemaining,
        capacityPercentage,
        netCost,
        isFull: capacityRemaining !== null && capacityRemaining <= 0,
        isAlmostFull: capacityPercentage >= 90,
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
