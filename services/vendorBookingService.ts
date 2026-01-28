/**
 * Vendor Booking Service
 * 
 * Handles vendor-to-activity/event associations and cost propagation
 * when vendor information changes.
 * 
 * Requirements: 8.2, 8.4, 8.9, 8.10
 */

import { createClient } from '@supabase/supabase-js';
import {
  createVendorBookingSchema,
  updateVendorBookingSchema,
  vendorBookingFilterSchema,
  type CreateVendorBookingDTO,
  type UpdateVendorBookingDTO,
  type VendorBookingFilterDTO,
  type VendorBooking,
  type PaginatedVendorBookings,
  type VendorBookingWithDetails,
} from '../schemas/vendorBookingSchemas';
import { sanitizeInput } from '../utils/sanitization';

// Result type for consistent error handling
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Creates a new vendor booking linking a vendor to an activity or event.
 * 
 * @param data - Booking data including vendor ID, activity/event ID, and booking date
 * @returns Result containing the created booking or error details
 * 
 * @example
 * const result = await vendorBookingService.create({
 *   vendorId: 'vendor-uuid',
 *   activityId: 'activity-uuid',
 *   bookingDate: '2025-06-15',
 * });
 */
export async function create(data: CreateVendorBookingDTO): Promise<Result<VendorBooking>> {
  try {
    // 1. Validate
    const validation = createVendorBookingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize user input
    const sanitized = {
      ...validation.data,
      notes: validation.data.notes ? sanitizeInput(validation.data.notes) : null,
    };

    // 3. Database operation
    const { data: booking, error } = await supabase
      .from('vendor_bookings')
      .insert({
        vendor_id: sanitized.vendorId,
        activity_id: sanitized.activityId,
        event_id: sanitized.eventId,
        booking_date: sanitized.bookingDate,
        notes: sanitized.notes,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: true,
      data: mapBookingFromDb(booking),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Retrieves a vendor booking by ID.
 * 
 * @param id - Booking UUID
 * @returns Result containing the booking or error details
 */
export async function get(id: string): Promise<Result<VendorBooking>> {
  try {
    const { data: booking, error } = await supabase
      .from('vendor_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Vendor booking not found',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: true,
      data: mapBookingFromDb(booking),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Updates an existing vendor booking.
 * 
 * @param id - Booking UUID
 * @param data - Partial booking data to update
 * @returns Result containing the updated booking or error details
 */
export async function update(id: string, data: UpdateVendorBookingDTO): Promise<Result<VendorBooking>> {
  try {
    // 1. Validate
    const validation = updateVendorBookingSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize user input
    const sanitized: Record<string, unknown> = {};
    if (validation.data.notes !== undefined) {
      sanitized.notes = validation.data.notes ? sanitizeInput(validation.data.notes) : null;
    }
    if (validation.data.vendorId !== undefined) {
      sanitized.vendor_id = validation.data.vendorId;
    }
    if (validation.data.activityId !== undefined) {
      sanitized.activity_id = validation.data.activityId;
    }
    if (validation.data.eventId !== undefined) {
      sanitized.event_id = validation.data.eventId;
    }
    if (validation.data.bookingDate !== undefined) {
      sanitized.booking_date = validation.data.bookingDate;
    }

    // 3. Database operation
    const { data: booking, error } = await supabase
      .from('vendor_bookings')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Vendor booking not found',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    return {
      success: true,
      data: mapBookingFromDb(booking),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Deletes a vendor booking from the system.
 * 
 * @param id - Booking UUID
 * @returns Result indicating success or error details
 */
export async function deleteBooking(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('vendor_bookings')
      .delete()
      .eq('id', id);

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
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
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Lists vendor bookings with optional filtering and pagination.
 * 
 * @param filters - Optional filters for vendor, activity, event, and pagination
 * @returns Result containing paginated booking list or error details
 */
export async function list(filters: VendorBookingFilterDTO = {}): Promise<Result<PaginatedVendorBookings>> {
  try {
    // Validate filters
    const validation = vendorBookingFilterSchema.safeParse(filters);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filters',
          details: validation.error.issues,
        },
      };
    }

    const { vendorId, activityId, eventId, page = 1, pageSize = 50 } = validation.data;

    // Build query
    let query = supabase.from('vendor_bookings').select('*', { count: 'exact' });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('booking_date', { ascending: true });

    const { data: bookings, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        bookings: bookings.map(mapBookingFromDb),
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Gets vendor bookings with full details including vendor and activity/event names.
 * 
 * @param filters - Optional filters for vendor, activity, event
 * @returns Result containing bookings with details or error details
 */
export async function listWithDetails(filters: VendorBookingFilterDTO = {}): Promise<Result<VendorBookingWithDetails[]>> {
  try {
    // Validate filters
    const validation = vendorBookingFilterSchema.safeParse(filters);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid filters',
          details: validation.error.issues,
        },
      };
    }

    const { vendorId, activityId, eventId } = validation.data;

    // Build query with joins
    let query = supabase
      .from('vendor_bookings')
      .select(`
        *,
        vendors (id, name, category),
        activities (id, name),
        events (id, name)
      `);

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: bookings, error } = await query.order('booking_date', { ascending: true });

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }

    const bookingsWithDetails: VendorBookingWithDetails[] = bookings.map((booking: any) => ({
      id: booking.id,
      vendorId: booking.vendor_id,
      vendorName: booking.vendors?.name || 'Unknown',
      vendorCategory: booking.vendors?.category || 'other',
      activityId: booking.activity_id,
      activityName: booking.activities?.name || null,
      eventId: booking.event_id,
      eventName: booking.events?.name || null,
      bookingDate: booking.booking_date,
      notes: booking.notes,
      createdAt: booking.created_at,
    }));

    return {
      success: true,
      data: bookingsWithDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Gets all bookings for a specific vendor.
 * 
 * @param vendorId - Vendor UUID
 * @returns Result containing vendor's bookings or error details
 */
export async function getVendorBookings(vendorId: string): Promise<Result<VendorBookingWithDetails[]>> {
  return listWithDetails({ vendorId });
}

/**
 * Gets all bookings for a specific activity.
 * 
 * @param activityId - Activity UUID
 * @returns Result containing activity's bookings or error details
 */
export async function getActivityBookings(activityId: string): Promise<Result<VendorBookingWithDetails[]>> {
  return listWithDetails({ activityId });
}

/**
 * Gets all bookings for a specific event.
 * 
 * @param eventId - Event UUID
 * @returns Result containing event's bookings or error details
 */
export async function getEventBookings(eventId: string): Promise<Result<VendorBookingWithDetails[]>> {
  return listWithDetails({ eventId });
}

/**
 * Propagates vendor cost changes to all related bookings.
 * This is called when a vendor's cost is updated to ensure
 * budget calculations reflect the new cost.
 * 
 * @param vendorId - Vendor UUID
 * @returns Result indicating success or error details
 */
export async function propagateVendorCostChange(vendorId: string): Promise<Result<void>> {
  try {
    // Get all bookings for this vendor
    const bookingsResult = await getVendorBookings(vendorId);
    if (!bookingsResult.success) {
      return bookingsResult as Result<void>;
    }

    // Note: In a real implementation, this would trigger recalculation
    // of budget totals for all activities/events associated with this vendor.
    // For now, we just return success as the budget service will
    // recalculate on-demand when requested.

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Maps database booking record to VendorBooking type.
 */
function mapBookingFromDb(dbBooking: any): VendorBooking {
  return {
    id: dbBooking.id,
    vendorId: dbBooking.vendor_id,
    activityId: dbBooking.activity_id,
    eventId: dbBooking.event_id,
    bookingDate: dbBooking.booking_date,
    notes: dbBooking.notes,
    createdAt: dbBooking.created_at,
  };
}
