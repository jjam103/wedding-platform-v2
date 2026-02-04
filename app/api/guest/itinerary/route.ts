import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as itineraryService from '@/services/itineraryService';

/**
 * GET /api/guest/itinerary
 * 
 * Returns the personalized itinerary for the authenticated guest.
 * Only includes activities the guest is attending, sorted chronologically.
 * 
 * Query Parameters:
 * - from: ISO date string (optional) - Filter activities from this date
 * - to: ISO date string (optional) - Filter activities to this date
 * 
 * Requirements: 26.1, 26.2, 26.6
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
      .select('id, first_name, last_name, group_id')
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    
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
    
    // 3. SERVICE CALL - Generate personalized itinerary
    const itineraryResult = await itineraryService.generateItinerary(guest.id);
    
    if (!itineraryResult.success) {
      return NextResponse.json(itineraryResult, { status: 500 });
    }
    
    // Filter by date range if provided
    let filteredItinerary = itineraryResult.data;
    if (from || to) {
      filteredItinerary = {
        ...itineraryResult.data,
        events: itineraryResult.data.events.filter(event => {
          const eventDate = new Date(event.date);
          if (from && eventDate < new Date(from)) return false;
          if (to && eventDate > new Date(to)) return false;
          return true;
        })
      };
    }
    
    // 4. RESPONSE
    return NextResponse.json({
      success: true,
      data: {
        guest: {
          id: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
        },
        activities: filteredItinerary,
        generatedAt: new Date().toISOString(),
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
