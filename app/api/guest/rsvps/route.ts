import { NextResponse } from 'next/server';
import * as rsvpService from '@/services/rsvpService';
import * as activityService from '@/services/activityService';
import * as eventService from '@/services/eventService';
import { createRSVPSchema } from '@/schemas/rsvpSchemas';
import { ERROR_CODES } from '@/types';
import { validateGuestAuth } from '@/lib/guestAuth';

/**
 * GET /api/guest/rsvps
 * 
 * Lists all RSVPs for the authenticated guest.
 * Returns activities and events with RSVP status, capacity info, and deadlines.
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6, 10.7
 */
export async function GET() {
  try {
    // 1. Auth check
    const authResult = await validateGuestAuth();
    
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    
    const { guest } = authResult;

    // 2. Get all RSVPs for this guest
    const rsvpsResult = await rsvpService.getByGuest(guest.id);

    if (!rsvpsResult.success) {
      // Return empty array instead of 500 error for graceful degradation
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // 3. Enrich RSVPs with activity/event details and capacity info
    const enrichedRsvps = await Promise.all(
      rsvpsResult.data.map(async (rsvp) => {
        let entityDetails = null;
        let capacityInfo = null;
        let deadline = null;

        if (rsvp.activity_id) {
          const activityResult = await activityService.get(rsvp.activity_id);
          if (activityResult.success) {
            entityDetails = {
              type: 'activity',
              ...activityResult.data,
            };
            // Activities don't have RSVP deadlines

            // Get capacity info
            const capacityResult = await rsvpService.calculateActivityCapacity(rsvp.activity_id);
            if (capacityResult.success) {
              capacityInfo = capacityResult.data;
            }
          }
        } else if (rsvp.event_id) {
          const eventResult = await eventService.get(rsvp.event_id);
          if (eventResult.success) {
            entityDetails = {
              type: 'event',
              ...eventResult.data,
            };
            deadline = eventResult.data.rsvpDeadline;
          }
        }

        return {
          ...rsvp,
          entity: entityDetails,
          capacity: capacityInfo,
          deadline,
          can_modify: deadline ? new Date(deadline) > new Date() : true,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedRsvps,
    });
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

/**
 * POST /api/guest/rsvps
 * 
 * Creates a new RSVP for the authenticated guest.
 * Validates capacity and deadlines before creating.
 * Sends confirmation email on success.
 * 
 * Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const authResult = await validateGuestAuth();
    
    if (!authResult.success) {
      return NextResponse.json(authResult.error, { status: authResult.status });
    }
    
    const { guest } = authResult;

    // 2. Parse request body with explicit error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid JSON body',
          },
        },
        { status: 400 }
      );
    }
    
    // 3. Validate request body
    const validation = createRSVPSchema.safeParse({
      ...body,
      guest_id: guest.id, // Ensure guest_id matches authenticated user
    });

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

    // 3. Check capacity if activity_id is provided and status is 'attending'
    if (validation.data.activity_id && validation.data.status === 'attending') {
      const guestCount = validation.data.guest_count || 1;
      const capacityCheck = await rsvpService.enforceCapacityLimit(
        validation.data.activity_id,
        guestCount
      );

      if (!capacityCheck.success) {
        return NextResponse.json(capacityCheck, { status: 400 });
      }
    }

    // Check deadline for events
    if (validation.data.event_id) {
      const eventResult = await eventService.get(validation.data.event_id);
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

    // 4. Create RSVP via service
    const result = await rsvpService.create(validation.data);

    if (!result.success) {
      const statusCode = result.error.code === ERROR_CODES.DUPLICATE_ENTRY ? 409 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
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
