import { getAuthenticatedUser } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

const updateTransportationSchema = z.object({
  airport_code: z.enum(['SJO', 'LIR', 'Other']),
  flight_number: z.string().max(20).optional(),
  arrival_date: z.string().optional(),
  departure_date: z.string().optional(),
});

/**
 * PATCH /api/guest/transportation
 * 
 * Updates guest transportation information.
 * 
 * Requirements: 13.7, 10.1
 */
export async function PATCH(request: Request) {
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
    const validation = updateTransportationSchema.safeParse(body);
    
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
    
    // Sanitize input
    const sanitized: any = {
      airport_code: validation.data.airport_code,
      updated_at: new Date().toISOString(),
    };
    
    if (validation.data.flight_number) {
      sanitized.flight_number = sanitizeInput(validation.data.flight_number);
    }
    if (validation.data.arrival_date) {
      sanitized.arrival_date = validation.data.arrival_date;
    }
    if (validation.data.departure_date) {
      sanitized.departure_date = validation.data.departure_date;
    }
    
    // Update guest transportation information
    const { data: updated, error: updateError } = await supabase
      .from('guests')
      .update(sanitized)
      .eq('id', currentGuest.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: updateError.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: updated });
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
