import type { Result } from '@/types';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/utils/storage';

// Lazy load supabase to avoid initialization issues in tests
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const { supabase } = require('@/lib/supabase');
    _supabase = supabase;
  }
  return _supabase;
}

interface ItineraryEvent {
  id: string;
  name: string;
  type: 'event' | 'activity';
  date: string;
  time: string;
  location?: string;
  description?: string;
  rsvp_status?: string;
}

interface AccommodationDetails {
  accommodation_name?: string;
  room_type?: string;
  check_in?: string;
  check_out?: string;
  address?: string;
}

interface TransportationDetails {
  airport_code?: string;
  flight_number?: string;
  arrival_date?: string;
  departure_date?: string;
}

interface Itinerary {
  guest_id: string;
  guest_name: string;
  events: ItineraryEvent[];
  accommodation?: AccommodationDetails;
  transportation?: TransportationDetails;
  generated_at: string;
}

/**
 * Itinerary Service
 * 
 * Handles personalized itinerary generation and caching for guests.
 * 
 * Requirements: 13.10, 18.3, 18.4
 */

/**
 * Generates a personalized itinerary for a guest.
 * 
 * @param guestId - The guest's ID
 * @returns Result containing the generated itinerary
 * 
 * Requirements: 13.10
 */
export async function generateItinerary(guestId: string): Promise<Result<Itinerary>> {
  try {
    const supabase = getSupabase();
    
    // Get guest information
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      return {
        success: false,
        error: {
          code: 'GUEST_NOT_FOUND',
          message: 'Guest not found',
          details: guestError,
        },
      };
    }
    
    // Get events visible to this guest
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, event_type, start_date, end_date, location_id, description')
      .eq('status', 'published')
      .or(`visibility.cs.{${guest.guest_type}},visibility.eq.{}`)
      .order('start_date', { ascending: true });
    
    if (eventsError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: eventsError.message,
          details: eventsError,
        },
      };
    }
    
    // Get activities visible to this guest
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, activity_type, start_time, end_time, location_id, description')
      .eq('status', 'published')
      .or(`visibility.cs.{${guest.guest_type}},visibility.eq.{}`)
      .order('start_time', { ascending: true });
    
    if (activitiesError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: activitiesError.message,
          details: activitiesError,
        },
      };
    }
    
    // Get RSVPs for this guest
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('event_id, activity_id, status')
      .eq('guest_id', guestId);
    
    if (rsvpsError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: rsvpsError.message,
          details: rsvpsError,
        },
      };
    }
    
    // Create RSVP lookup map
    const rsvpMap = new Map<string, string>();
    rsvps?.forEach((rsvp: any) => {
      if (rsvp.event_id) {
        rsvpMap.set(`event-${rsvp.event_id}`, rsvp.status);
      }
      if (rsvp.activity_id) {
        rsvpMap.set(`activity-${rsvp.activity_id}`, rsvp.status);
      }
    });
    
    // Combine events and activities
    const itineraryEvents: ItineraryEvent[] = [
      ...(events || []).map((event: any) => ({
        id: event.id,
        name: event.name,
        type: 'event' as const,
        date: event.start_date,
        time: event.start_date,
        location: event.location_id,
        description: event.description,
        rsvp_status: rsvpMap.get(`event-${event.id}`),
      })),
      ...(activities || []).map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        type: 'activity' as const,
        date: activity.start_time,
        time: activity.start_time,
        location: activity.location_id,
        description: activity.description,
        rsvp_status: rsvpMap.get(`activity-${activity.id}`),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Get accommodation details
    const { data: roomAssignment } = await supabase
      .from('room_assignments')
      .select(`
        check_in,
        check_out,
        room_types (
          name,
          accommodations (
            name,
            address
          )
        )
      `)
      .eq('guest_id', guestId)
      .maybeSingle();
    
    const accommodation: AccommodationDetails | undefined = roomAssignment
      ? {
          accommodation_name: (roomAssignment.room_types as any)?.accommodations?.name,
          room_type: (roomAssignment.room_types as any)?.name,
          check_in: roomAssignment.check_in,
          check_out: roomAssignment.check_out,
          address: (roomAssignment.room_types as any)?.accommodations?.address,
        }
      : undefined;
    
    // Get transportation details
    const transportation: TransportationDetails = {
      airport_code: guest.airport_code,
      flight_number: guest.flight_number,
      arrival_date: guest.arrival_date,
      departure_date: guest.departure_date,
    };
    
    const itinerary: Itinerary = {
      guest_id: guestId,
      guest_name: `${guest.first_name} ${guest.last_name}`,
      events: itineraryEvents,
      accommodation,
      transportation,
      generated_at: new Date().toISOString(),
    };
    
    return { success: true, data: itinerary };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Caches an itinerary for offline access.
 * 
 * @param guestId - The guest's ID
 * @param itinerary - The itinerary to cache
 * @returns Result indicating success or failure
 * 
 * Requirements: 18.3, 18.4
 */
export async function cacheItinerary(
  guestId: string,
  itinerary: Itinerary
): Promise<Result<void>> {
  try {
    // Store in localStorage for PWA offline access
    if (typeof window !== 'undefined') {
      const cacheKey = `itinerary-${guestId}`;
      const success = safeSetItem(cacheKey, JSON.stringify(itinerary));
      
      if (success) {
        return { success: true, data: undefined };
      }
    }
    
    return {
      success: false,
      error: {
        code: 'STORAGE_UNAVAILABLE',
        message: 'Local storage is not available',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Retrieves a cached itinerary.
 * 
 * @param guestId - The guest's ID
 * @returns Result containing the cached itinerary or null if not found
 * 
 * Requirements: 18.3, 18.4
 */
export async function getCachedItinerary(
  guestId: string
): Promise<Result<Itinerary | null>> {
  try {
    // Retrieve from localStorage
    if (typeof window !== 'undefined') {
      const cacheKey = `itinerary-${guestId}`;
      const cached = safeGetItem(cacheKey);
      
      if (cached) {
        const itinerary = JSON.parse(cached) as Itinerary;
        return { success: true, data: itinerary };
      }
      
      return { success: true, data: null };
    }
    
    return {
      success: false,
      error: {
        code: 'STORAGE_UNAVAILABLE',
        message: 'Local storage is not available',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Invalidates the cached itinerary for a guest.
 * 
 * @param guestId - The guest's ID
 * @returns Result indicating success or failure
 */
export async function invalidateCache(guestId: string): Promise<Result<void>> {
  try {
    if (typeof window !== 'undefined') {
      const cacheKey = `itinerary-${guestId}`;
      const success = safeRemoveItem(cacheKey);
      
      if (success) {
        return { success: true, data: undefined };
      }
    }
    
    return {
      success: false,
      error: {
        code: 'STORAGE_UNAVAILABLE',
        message: 'Local storage is not available',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
