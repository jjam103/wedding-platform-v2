import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

const createRSVPSchema = z.object({
  guest_id: z.string().uuid(),
  event_id: z.string().uuid().optional(),
  activity_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']),
  guest_count: z.number().int().positive().optional(),
  dietary_notes: z.string().max(500).optional(),
  special_requirements: z.string().max(500).optional(),
}).refine(data => data.event_id || data.activity_id, {
  message: 'Either event_id or activity_id must be provided',
});

/**
 * POST /api/guest/rsvp
 * 
 * Creates or updates an RSVP for an event or activity.
 * 
 * Requirements: 13.6, 6.1-6.8
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    
    // Get current guest
    const { data: currentGuest, error: currentGuestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', user.email)
      .single();
    
    if (currentGuestError || !currentGuest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = createRSVPSchema.safeParse(body);
    
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
    
    // Verify guest can only RSVP for themselves
    if (validation.data.guest_id !== currentGuest.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only RSVP for yourself',
          },
        },
        { status: 403 }
      );
    }
    
    // Sanitize input
    const sanitized: any = {
      guest_id: validation.data.guest_id,
      status: validation.data.status,
      responded_at: new Date().toISOString(),
    };
    
    if (validation.data.event_id) {
      sanitized.event_id = validation.data.event_id;
    }
    if (validation.data.activity_id) {
      sanitized.activity_id = validation.data.activity_id;
    }
    if (validation.data.guest_count) {
      sanitized.guest_count = validation.data.guest_count;
    }
    if (validation.data.dietary_notes) {
      sanitized.dietary_notes = sanitizeInput(validation.data.dietary_notes);
    }
    if (validation.data.special_requirements) {
      sanitized.special_requirements = sanitizeInput(validation.data.special_requirements);
    }
    
    // Check if RSVP already exists
    const whereClause: any = { guest_id: sanitized.guest_id };
    if (sanitized.event_id) {
      whereClause.event_id = sanitized.event_id;
    }
    if (sanitized.activity_id) {
      whereClause.activity_id = sanitized.activity_id;
    }
    
    let query = supabase.from('rsvps').select('id').eq('guest_id', sanitized.guest_id);
    
    if (sanitized.event_id) {
      query = query.eq('event_id', sanitized.event_id);
    }
    if (sanitized.activity_id) {
      query = query.eq('activity_id', sanitized.activity_id);
    }
    
    const { data: existing } = await query.maybeSingle();
    
    let result;
    if (existing) {
      // Update existing RSVP
      const { data: updated, error: updateError } = await supabase
        .from('rsvps')
        .update({
          ...sanitized,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (updateError) {
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: updateError.message } },
          { status: 500 }
        );
      }
      
      result = updated;
    } else {
      // Create new RSVP
      const { data: created, error: createError } = await supabase
        .from('rsvps')
        .insert({
          ...sanitized,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (createError) {
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: createError.message } },
          { status: 500 }
        );
      }
      
      result = created;
    }
    
    return NextResponse.json({ success: true, data: result }, { status: existing ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
