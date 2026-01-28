import { createClient } from '@supabase/supabase-js';
import { sanitizeInput } from '@/utils/sanitization';
import { 
  createRSVPSchema, 
  updateRSVPSchema, 
  listRSVPsSchema,
  type CreateRSVPDTO,
  type UpdateRSVPDTO,
  type ListRSVPsDTO,
} from '@/schemas/rsvpSchemas';
import type { Result, RSVP } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Creates a new RSVP for a guest to an event or activity.
 * 
 * @param data - RSVP data including guest_id and either event_id or activity_id
 * @returns Result containing the created RSVP or error details
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 * 
 * @example
 * const result = await rsvpService.create({
 *   guest_id: '123e4567-e89b-12d3-a456-426614174000',
 *   event_id: '123e4567-e89b-12d3-a456-426614174001',
 *   status: 'attending',
 *   guest_count: 2,
 * });
 */
export async function create(data: CreateRSVPDTO): Promise<Result<RSVP>> {
  try {
    // 1. Validate
    const validation = createRSVPSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize user input
    const sanitized = {
      ...validation.data,
      dietary_notes: validation.data.dietary_notes 
        ? sanitizeInput(validation.data.dietary_notes) 
        : undefined,
      special_requirements: validation.data.special_requirements 
        ? sanitizeInput(validation.data.special_requirements) 
        : undefined,
      notes: validation.data.notes 
        ? sanitizeInput(validation.data.notes) 
        : undefined,
    };

    // Set responded_at if status is not pending
    const rsvpData = {
      ...sanitized,
      responded_at: sanitized.status !== 'pending' ? new Date().toISOString() : undefined,
    };

    // 3. Database operation
    const { data: result, error } = await supabase
      .from('rsvps')
      .insert(rsvpData)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: {
            code: ERROR_CODES.DUPLICATE_ENTRY,
            message: 'RSVP already exists for this guest and event/activity',
            details: error,
          },
        };
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: result };
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
 * Retrieves a single RSVP by ID.
 * 
 * @param id - RSVP ID
 * @returns Result containing the RSVP or error details
 */
export async function get(id: string): Promise<Result<RSVP>> {
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'RSVP not found',
            details: error,
          },
        };
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data };
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
 * Updates an existing RSVP.
 * 
 * @param id - RSVP ID
 * @param data - Updated RSVP data
 * @returns Result containing the updated RSVP or error details
 * 
 * Requirements: 6.3, 6.4
 */
export async function update(id: string, data: UpdateRSVPDTO): Promise<Result<RSVP>> {
  try {
    // 1. Validate
    const validation = updateRSVPSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize user input
    const sanitized = {
      ...validation.data,
      dietary_notes: validation.data.dietary_notes 
        ? sanitizeInput(validation.data.dietary_notes) 
        : undefined,
      special_requirements: validation.data.special_requirements 
        ? sanitizeInput(validation.data.special_requirements) 
        : undefined,
      notes: validation.data.notes 
        ? sanitizeInput(validation.data.notes) 
        : undefined,
    };

    // Set responded_at if status is being changed from pending
    const updateData: any = { ...sanitized };
    if (sanitized.status && sanitized.status !== 'pending') {
      updateData.responded_at = new Date().toISOString();
    }

    // 3. Database operation
    const { data: result, error } = await supabase
      .from('rsvps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'RSVP not found',
            details: error,
          },
        };
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: result };
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
 * Deletes an RSVP by ID.
 * 
 * @param id - RSVP ID
 * @returns Result indicating success or error details
 */
export async function deleteRSVP(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('id', id);

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

    return { success: true, data: undefined };
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
 * Lists RSVPs with optional filtering and pagination.
 * 
 * @param filters - Filter criteria including guest_id, event_id, activity_id, status
 * @returns Result containing array of RSVPs or error details
 * 
 * Requirements: 6.1, 6.2
 */
export async function list(filters: Partial<ListRSVPsDTO> = { page: 1, page_size: 50 }): Promise<Result<{ rsvps: RSVP[]; total: number }>> {
  try {
    // Validate filters
    const filtersWithDefaults = { page: 1, page_size: 50, ...filters };
    const validation = listRSVPsSchema.safeParse(filtersWithDefaults);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid filter parameters',
          details: validation.error.issues,
        },
      };
    }

    const { guest_id, event_id, activity_id, status, page, page_size } = validation.data;

    // Build query
    let query = supabase.from('rsvps').select('*', { count: 'exact' });

    if (guest_id) {
      query = query.eq('guest_id', guest_id);
    }
    if (event_id) {
      query = query.eq('event_id', event_id);
    }
    if (activity_id) {
      query = query.eq('activity_id', activity_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;
    query = query.range(from, to);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

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

    return {
      success: true,
      data: {
        rsvps: data || [],
        total: count || 0,
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
 * Gets all RSVPs for a specific guest.
 * 
 * @param guestId - Guest ID
 * @returns Result containing array of RSVPs or error details
 */
export async function getByGuest(guestId: string): Promise<Result<RSVP[]>> {
  const result = await list({ guest_id: guestId, page: 1, page_size: 100 });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data.rsvps,
  };
}

/**
 * Gets all RSVPs for a specific event.
 * 
 * @param eventId - Event ID
 * @returns Result containing array of RSVPs or error details
 */
export async function getByEvent(eventId: string): Promise<Result<RSVP[]>> {
  const result = await list({ event_id: eventId, page: 1, page_size: 1000 });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data.rsvps,
  };
}

/**
 * Gets all RSVPs for a specific activity.
 * 
 * @param activityId - Activity ID
 * @returns Result containing array of RSVPs or error details
 */
export async function getByActivity(activityId: string): Promise<Result<RSVP[]>> {
  const result = await list({ activity_id: activityId, page: 1, page_size: 1000 });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data.rsvps,
  };
}

/**
 * Capacity alert information for an activity.
 * Requirements: 6.5, 6.7
 */
export interface CapacityAlert {
  activity_id: string;
  activity_name: string;
  capacity: number;
  attending_count: number;
  utilization_percentage: number;
  alert_level: 'warning' | 'critical' | 'full';
  message: string;
}

/**
 * Calculates the current capacity utilization for an activity.
 * 
 * @param activityId - Activity ID
 * @returns Result containing capacity information or error details
 * 
 * Requirements: 6.5
 */
export async function calculateActivityCapacity(
  activityId: string
): Promise<Result<{ capacity: number | null; attending_count: number; available: number | null }>> {
  try {
    // Get activity capacity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('capacity, name')
      .eq('id', activityId)
      .single();

    if (activityError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: activityError.message,
          details: activityError,
        },
      };
    }

    // Count attending RSVPs
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('guest_count')
      .eq('activity_id', activityId)
      .eq('status', 'attending');

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

    // Calculate total attending count
    const attending_count = rsvps.reduce((sum, rsvp) => sum + (rsvp.guest_count || 1), 0);

    // Calculate available capacity
    const available = activity.capacity !== null ? activity.capacity - attending_count : null;

    return {
      success: true,
      data: {
        capacity: activity.capacity,
        attending_count,
        available,
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
 * Generates capacity alerts for activities that are approaching or at capacity.
 * 
 * @param threshold - Percentage threshold for warning (default: 0.9 for 90%)
 * @returns Result containing array of capacity alerts or error details
 * 
 * Requirements: 6.5, 6.7
 */
export async function generateCapacityAlerts(
  threshold: number = 0.9
): Promise<Result<CapacityAlert[]>> {
  try {
    // Get all activities with capacity limits
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, capacity')
      .not('capacity', 'is', null)
      .eq('status', 'published');

    if (activitiesError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: activitiesError.message,
          details: activitiesError,
        },
      };
    }

    const alerts: CapacityAlert[] = [];

    // Check capacity for each activity
    for (const activity of activities) {
      const capacityResult = await calculateActivityCapacity(activity.id);

      if (!capacityResult.success) {
        continue; // Skip activities with errors
      }

      const { capacity, attending_count } = capacityResult.data;

      if (capacity === null) {
        continue; // Skip activities without capacity limits
      }

      const utilization = attending_count / capacity;

      // Generate alert if threshold is met or exceeded
      if (utilization >= threshold) {
        let alert_level: 'warning' | 'critical' | 'full';
        let message: string;

        if (attending_count >= capacity) {
          alert_level = 'full';
          message = `Activity "${activity.name}" is at full capacity (${attending_count}/${capacity})`;
        } else if (utilization >= 0.95) {
          alert_level = 'critical';
          message = `Activity "${activity.name}" is critically full (${attending_count}/${capacity}, ${Math.round(utilization * 100)}%)`;
        } else {
          alert_level = 'warning';
          message = `Activity "${activity.name}" is approaching capacity (${attending_count}/${capacity}, ${Math.round(utilization * 100)}%)`;
        }

        alerts.push({
          activity_id: activity.id,
          activity_name: activity.name,
          capacity,
          attending_count,
          utilization_percentage: Math.round(utilization * 100),
          alert_level,
          message,
        });
      }
    }

    return {
      success: true,
      data: alerts,
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
 * Checks if an activity has available capacity for additional guests.
 * 
 * @param activityId - Activity ID
 * @param additionalGuests - Number of additional guests (default: 1)
 * @returns Result indicating if capacity is available or error details
 * 
 * Requirements: 6.7
 */
export async function checkCapacityAvailable(
  activityId: string,
  additionalGuests: number = 1
): Promise<Result<{ available: boolean; message: string }>> {
  try {
    const capacityResult = await calculateActivityCapacity(activityId);

    if (!capacityResult.success) {
      return capacityResult;
    }

    const { capacity, attending_count, available } = capacityResult.data;

    // If no capacity limit, always available
    if (capacity === null) {
      return {
        success: true,
        data: {
          available: true,
          message: 'No capacity limit set for this activity',
        },
      };
    }

    // Check if additional guests would exceed capacity
    if (available !== null && available >= additionalGuests) {
      return {
        success: true,
        data: {
          available: true,
          message: `Capacity available: ${available} spots remaining`,
        },
      };
    }

    return {
      success: true,
      data: {
        available: false,
        message: `Capacity exceeded: ${attending_count}/${capacity} attending, cannot add ${additionalGuests} more guest(s)`,
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
 * Enforces capacity limits when creating or updating an RSVP.
 * Returns an error if the RSVP would exceed activity capacity.
 * 
 * @param activityId - Activity ID
 * @param guestCount - Number of guests for the RSVP
 * @param existingRsvpId - ID of existing RSVP if updating (to exclude from count)
 * @returns Result indicating if capacity check passed or error details
 * 
 * Requirements: 6.7
 */
export async function enforceCapacityLimit(
  activityId: string,
  guestCount: number,
  existingRsvpId?: string
): Promise<Result<void>> {
  try {
    const capacityResult = await calculateActivityCapacity(activityId);

    if (!capacityResult.success) {
      return capacityResult;
    }

    const { capacity, attending_count } = capacityResult.data;

    // If no capacity limit, allow
    if (capacity === null) {
      return { success: true, data: undefined };
    }

    // If updating existing RSVP, get current guest count to subtract
    let currentGuestCount = 0;
    if (existingRsvpId) {
      const { data: existingRsvp, error } = await supabase
        .from('rsvps')
        .select('guest_count, status')
        .eq('id', existingRsvpId)
        .single();

      if (!error && existingRsvp && existingRsvp.status === 'attending') {
        currentGuestCount = existingRsvp.guest_count || 1;
      }
    }

    // Calculate new total
    const newTotal = attending_count - currentGuestCount + guestCount;

    if (newTotal > capacity) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.CAPACITY_EXCEEDED,
          message: `Activity capacity exceeded: ${newTotal}/${capacity}`,
          details: {
            capacity,
            current_attending: attending_count,
            requested_guests: guestCount,
            available: capacity - attending_count + currentGuestCount,
          },
        },
      };
    }

    return { success: true, data: undefined };
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
