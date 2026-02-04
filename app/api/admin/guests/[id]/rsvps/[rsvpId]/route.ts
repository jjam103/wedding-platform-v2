import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateRSVPSchema = z.object({
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional(),
  guestCount: z.number().int().min(1).max(10).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
});

/**
 * PUT /api/admin/guests/[id]/rsvps/[rsvpId]
 * 
 * Update an RSVP status, guest count, or dietary restrictions
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing guest ID and RSVP ID
 * @returns Updated RSVP with capacity information
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; rsvpId: string }> }
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

    // 2. Get params
    const { id: guestId, rsvpId } = await params;

    if (!guestId || !rsvpId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Guest ID and RSVP ID are required',
          },
        },
        { status: 400 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validation = updateRSVPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { status, guestCount, dietaryRestrictions } = validation.data;

    // 4. Get the RSVP to determine type (activity or event)
    // Try activity_rsvps first
    const { data: activityRSVP, error: activityError } = await supabase
      .from('activity_rsvps')
      .select('*, activities(id, capacity)')
      .eq('id', rsvpId)
      .eq('guest_id', guestId)
      .single();

    if (!activityError && activityRSVP) {
      // This is an activity RSVP
      const activity = activityRSVP.activities;

      // 5. Capacity validation for activities
      if (status === 'attending' && activity?.capacity) {
        // Count current attending RSVPs (excluding this one)
        const { count, error: countError } = await supabase
          .from('activity_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('activity_id', activity.id)
          .eq('status', 'attending')
          .neq('id', rsvpId);

        if (countError) {
          console.error('Error counting RSVPs:', countError);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'DATABASE_ERROR',
                message: 'Failed to check capacity',
                details: countError,
              },
            },
            { status: 500 }
          );
        }

        const capacityRemaining = activity.capacity - (count || 0);

        if (capacityRemaining <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CAPACITY_EXCEEDED',
                message: 'Activity is at full capacity',
              },
            },
            { status: 409 }
          );
        }
      }

      // 6. Update activity RSVP
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (guestCount !== undefined) updateData.guest_count = guestCount;
      if (dietaryRestrictions !== undefined)
        updateData.dietary_restrictions = dietaryRestrictions;

      const { data: updatedRSVP, error: updateError } = await supabase
        .from('activity_rsvps')
        .update(updateData)
        .eq('id', rsvpId)
        .eq('guest_id', guestId)
        .select('*, activities(id, title, capacity)')
        .single();

      if (updateError) {
        console.error('Error updating activity RSVP:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to update RSVP',
              details: updateError,
            },
          },
          { status: 500 }
        );
      }

      // 7. Calculate updated capacity
      const { count: newCount, error: newCountError } = await supabase
        .from('activity_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('activity_id', updatedRSVP.activities.id)
        .eq('status', 'attending');

      if (newCountError) {
        console.error('Error counting RSVPs:', newCountError);
      }

      const capacityRemaining = updatedRSVP.activities.capacity
        ? updatedRSVP.activities.capacity - (newCount || 0)
        : undefined;

      return NextResponse.json({
        success: true,
        data: {
          id: updatedRSVP.id,
          status: updatedRSVP.status,
          guestCount: updatedRSVP.guest_count,
          dietaryRestrictions: updatedRSVP.dietary_restrictions,
          capacity: updatedRSVP.activities.capacity,
          capacityRemaining,
        },
      });
    }

    // Try event_rsvps
    const { data: eventRSVP, error: eventError } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('id', rsvpId)
      .eq('guest_id', guestId)
      .single();

    if (!eventError && eventRSVP) {
      // This is an event RSVP
      // Events don't have capacity constraints or guest counts

      if (status === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Status is required for event RSVPs',
            },
          },
          { status: 400 }
        );
      }

      const { data: updatedRSVP, error: updateError } = await supabase
        .from('event_rsvps')
        .update({ status })
        .eq('id', rsvpId)
        .eq('guest_id', guestId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating event RSVP:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to update RSVP',
              details: updateError,
            },
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: updatedRSVP.id,
          status: updatedRSVP.status,
        },
      });
    }

    // RSVP not found
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'RSVP not found',
        },
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in PUT /api/admin/guests/[id]/rsvps/[rsvpId]:', error);
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
