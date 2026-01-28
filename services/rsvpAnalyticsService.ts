import { createClient } from '@supabase/supabase-js';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Response rate statistics for RSVPs.
 * Requirements: 6.5, 15.1
 */
export interface ResponseRateStats {
  total_invited: number;
  total_responded: number;
  total_pending: number;
  response_rate: number; // Percentage (0-100)
  by_status: {
    attending: number;
    declined: number;
    maybe: number;
    pending: number;
  };
  by_guest_type?: Record<string, {
    total: number;
    responded: number;
    response_rate: number;
  }>;
}

/**
 * Attendance projection data.
 * Requirements: 15.1, 15.5
 */
export interface AttendanceProjection {
  confirmed_attending: number;
  maybe_attending: number;
  projected_total: number; // confirmed + (maybe * probability factor)
  pending_count: number;
  declined_count: number;
}

/**
 * Dietary restriction summary.
 * Requirements: 15.5
 */
export interface DietaryRestrictionSummary {
  total_with_restrictions: number;
  restrictions: Record<string, number>; // restriction type -> count
  notes: Array<{
    guest_id: string;
    guest_name: string;
    dietary_notes: string;
  }>;
}

/**
 * Calculates response rates for an event or activity.
 * 
 * @param targetId - Event ID or Activity ID
 * @param targetType - 'event' or 'activity'
 * @param includeGuestTypeBreakdown - Whether to include breakdown by guest type
 * @returns Result containing response rate statistics or error details
 * 
 * Requirements: 6.5, 15.1
 */
export async function calculateResponseRate(
  targetId: string,
  targetType: 'event' | 'activity',
  includeGuestTypeBreakdown: boolean = false
): Promise<Result<ResponseRateStats>> {
  try {
    // Build query based on target type
    const idField = targetType === 'event' ? 'event_id' : 'activity_id';
    
    // Get all RSVPs for this target
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('id, guest_id, status')
      .eq(idField, targetId);

    if (rsvpError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: rsvpError.message,
          details: rsvpError,
        },
      };
    }

    const total_invited = rsvps.length;
    const total_responded = rsvps.filter(r => r.status !== 'pending').length;
    const total_pending = rsvps.filter(r => r.status === 'pending').length;
    const response_rate = total_invited > 0 ? (total_responded / total_invited) * 100 : 0;

    const by_status = {
      attending: rsvps.filter(r => r.status === 'attending').length,
      declined: rsvps.filter(r => r.status === 'declined').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      pending: total_pending,
    };

    let by_guest_type: Record<string, { total: number; responded: number; response_rate: number }> | undefined;

    if (includeGuestTypeBreakdown) {
      // Get guest types for all RSVPs
      const guestIds = rsvps.map(r => r.guest_id);
      const { data: guests, error: guestError } = await supabase
        .from('guests')
        .select('id, guest_type')
        .in('id', guestIds);

      if (guestError) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: guestError.message,
            details: guestError,
          },
        };
      }

      // Create guest type map
      const guestTypeMap = new Map(guests.map(g => [g.id, g.guest_type]));

      // Calculate stats by guest type
      by_guest_type = {};
      for (const rsvp of rsvps) {
        const guestType = guestTypeMap.get(rsvp.guest_id) || 'unknown';
        if (!by_guest_type[guestType]) {
          by_guest_type[guestType] = { total: 0, responded: 0, response_rate: 0 };
        }
        by_guest_type[guestType].total++;
        if (rsvp.status !== 'pending') {
          by_guest_type[guestType].responded++;
        }
      }

      // Calculate response rates
      for (const type in by_guest_type) {
        const stats = by_guest_type[type];
        stats.response_rate = stats.total > 0 ? (stats.responded / stats.total) * 100 : 0;
      }
    }

    return {
      success: true,
      data: {
        total_invited,
        total_responded,
        total_pending,
        response_rate: Math.round(response_rate * 100) / 100, // Round to 2 decimal places
        by_status,
        by_guest_type,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Projects attendance numbers based on current RSVPs.
 * 
 * @param targetId - Event ID or Activity ID
 * @param targetType - 'event' or 'activity'
 * @param maybeProbability - Probability factor for 'maybe' responses (default: 0.5)
 * @returns Result containing attendance projection or error details
 * 
 * Requirements: 15.1, 15.5
 */
export async function projectAttendance(
  targetId: string,
  targetType: 'event' | 'activity',
  maybeProbability: number = 0.5
): Promise<Result<AttendanceProjection>> {
  try {
    const idField = targetType === 'event' ? 'event_id' : 'activity_id';

    // Get all RSVPs with guest counts
    const { data: rsvps, error } = await supabase
      .from('rsvps')
      .select('status, guest_count')
      .eq(idField, targetId);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    // Calculate totals
    const confirmed_attending = rsvps
      .filter(r => r.status === 'attending')
      .reduce((sum, r) => sum + (r.guest_count || 1), 0);

    const maybe_attending = rsvps
      .filter(r => r.status === 'maybe')
      .reduce((sum, r) => sum + (r.guest_count || 1), 0);

    const declined_count = rsvps
      .filter(r => r.status === 'declined')
      .reduce((sum, r) => sum + (r.guest_count || 1), 0);

    const pending_count = rsvps
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.guest_count || 1), 0);

    // Project total attendance
    const projected_total = confirmed_attending + Math.round(maybe_attending * maybeProbability);

    return {
      success: true,
      data: {
        confirmed_attending,
        maybe_attending,
        projected_total,
        pending_count,
        declined_count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generates a summary of dietary restrictions for an event or activity.
 * 
 * @param targetId - Event ID or Activity ID
 * @param targetType - 'event' or 'activity'
 * @returns Result containing dietary restriction summary or error details
 * 
 * Requirements: 15.5
 */
export async function summarizeDietaryRestrictions(
  targetId: string,
  targetType: 'event' | 'activity'
): Promise<Result<DietaryRestrictionSummary>> {
  try {
    const idField = targetType === 'event' ? 'event_id' : 'activity_id';

    // Get RSVPs with dietary notes for attending guests
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('guest_id, dietary_notes')
      .eq(idField, targetId)
      .eq('status', 'attending')
      .not('dietary_notes', 'is', null);

    if (rsvpError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: rsvpError.message,
          details: rsvpError,
        },
      };
    }

    // Get guest information
    const guestIds = rsvps.map(r => r.guest_id);
    const { data: guests, error: guestError } = await supabase
      .from('guests')
      .select('id, first_name, last_name, dietary_restrictions')
      .in('id', guestIds);

    if (guestError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: guestError.message,
          details: guestError,
        },
      };
    }

    // Create guest map
    const guestMap = new Map(guests.map(g => [g.id, g]));

    // Collect all dietary information
    const restrictions: Record<string, number> = {};
    const notes: Array<{ guest_id: string; guest_name: string; dietary_notes: string }> = [];

    for (const rsvp of rsvps) {
      const guest = guestMap.get(rsvp.guest_id);
      if (!guest) continue;

      // Add RSVP dietary notes
      if (rsvp.dietary_notes) {
        notes.push({
          guest_id: guest.id,
          guest_name: `${guest.first_name} ${guest.last_name}`,
          dietary_notes: rsvp.dietary_notes,
        });
      }

      // Parse and count dietary restrictions from guest profile
      if (guest.dietary_restrictions) {
        const guestRestrictions = guest.dietary_restrictions
          .split(',')
          .map((r: string) => r.trim().toLowerCase())
          .filter((r: string) => r.length > 0);

        for (const restriction of guestRestrictions) {
          restrictions[restriction] = (restrictions[restriction] || 0) + 1;
        }
      }
    }

    const total_with_restrictions = Object.keys(restrictions).length > 0 
      ? Object.values(restrictions).reduce((sum, count) => sum + count, 0) 
      : 0;

    return {
      success: true,
      data: {
        total_with_restrictions,
        restrictions,
        notes,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Gets comprehensive analytics for an event.
 * 
 * @param eventId - Event ID
 * @returns Result containing all analytics data or error details
 * 
 * Requirements: 6.5, 15.1, 15.5
 */
export async function getEventAnalytics(eventId: string): Promise<Result<{
  response_rates: ResponseRateStats;
  attendance_projection: AttendanceProjection;
  dietary_summary: DietaryRestrictionSummary;
}>> {
  try {
    const [responseResult, attendanceResult, dietaryResult] = await Promise.all([
      calculateResponseRate(eventId, 'event', true),
      projectAttendance(eventId, 'event'),
      summarizeDietaryRestrictions(eventId, 'event'),
    ]);

    if (!responseResult.success) {
      return responseResult;
    }
    if (!attendanceResult.success) {
      return attendanceResult;
    }
    if (!dietaryResult.success) {
      return dietaryResult;
    }

    return {
      success: true,
      data: {
        response_rates: responseResult.data,
        attendance_projection: attendanceResult.data,
        dietary_summary: dietaryResult.data,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Gets comprehensive analytics for an activity.
 * 
 * @param activityId - Activity ID
 * @returns Result containing all analytics data or error details
 * 
 * Requirements: 6.5, 15.1, 15.5
 */
export async function getActivityAnalytics(activityId: string): Promise<Result<{
  response_rates: ResponseRateStats;
  attendance_projection: AttendanceProjection;
  dietary_summary: DietaryRestrictionSummary;
}>> {
  try {
    const [responseResult, attendanceResult, dietaryResult] = await Promise.all([
      calculateResponseRate(activityId, 'activity', true),
      projectAttendance(activityId, 'activity'),
      summarizeDietaryRestrictions(activityId, 'activity'),
    ]);

    if (!responseResult.success) {
      return responseResult;
    }
    if (!attendanceResult.success) {
      return attendanceResult;
    }
    if (!dietaryResult.success) {
      return dietaryResult;
    }

    return {
      success: true,
      data: {
        response_rates: responseResult.data,
        attendance_projection: attendanceResult.data,
        dietary_summary: dietaryResult.data,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
