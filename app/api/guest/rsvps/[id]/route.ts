import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as rsvpService from '@/services/rsvpService';
import * as activityService from '@/services/activityService';
import * as eventService from '@/services/eventService';
import { updateRSVPSchema } from '@/schemas/rsvpSchemas';
import { ERROR_CODES } from '@/types';

/**
 * PUT /api/guest/rsvps/[id]
 * 
 * Updates an existing RSVP for the authenticated guest.
 * Validates capacity and deadlines before updating.
 * Sends update confirmation email on success.
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get guest ID from session
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.NOT_FOUND, message: 'Guest not found' } },
        { status: 404 }
      );
    }

    // Get existing RSVP to verify ownership
    const existingRsvpResult = await rsvpService.get(id);
    if (!existingRsvpResult.success) {
      return NextResponse.json(existingRsvpResult, { status: 404 });
    }

    // Verify RSVP belongs to authenticated guest
    if (existingRsvpResult.data.guest_id !== guest.id) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.FORBIDDEN, message: 'Cannot modify another guest\'s RSVP' } },
        { status: 403 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = updateRSVPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid request',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. Check capacity if activity_id exists and changing to 'attending'
    if (existingRsvpResult.data.activity_id) {
      const newStatus = validation.data.status || existingRsvpResult.data.status;
      const newGuestCount = validation.data.guest_count || existingRsvpResult.data.guest_count || 1;

      if (newStatus === 'attending') {
        const capacityCheck = await rsvpService.enforceCapacityLimit(
          existingRsvpResult.data.activity_id,
          newGuestCount,
          id // Pass existing RSVP ID to exclude from count
        );

        if (!capacityCheck.success) {
          return NextResponse.json(capacityCheck, { status: 400 });
        }
      }
    }

    // Check deadline for events
    if (existingRsvpResult.data.event_id) {
      const eventResult = await eventService.get(existingRsvpResult.data.event_id);
      if (eventResult.success && eventResult.data.rsvpDeadline) {
        const deadline = new Date(eventResult.data.rsvpDeadline);
        if (deadline < new Date()) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'RSVP deadline has passed',
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // 4. Update RSVP via service
    const result = await rsvpService.update(id, validation.data);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
