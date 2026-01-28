import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createEventSchema,
  updateEventSchema,
  eventFilterSchema,
  eventSearchSchema,
  conflictCheckSchema,
  type CreateEventDTO,
  type UpdateEventDTO,
  type EventFilterDTO,
  type EventSearchDTO,
  type ConflictCheckDTO,
  type Event,
  type PaginatedEvents,
  type SchedulingConflict,
} from '../schemas/eventSchemas';

/**
 * Result type for consistent error handling.
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

/**
 * Converts camelCase to snake_case for database columns.
 */
function toSnakeCase(obj: any): any {
  const snakeObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = obj[key];
  }
  return snakeObj;
}

/**
 * Converts snake_case to camelCase for TypeScript objects.
 */
function toCamelCase(obj: any): any {
  const camelObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = obj[key];
  }
  return camelObj;
}

/**
 * Creates a new event in the system.
 *
 * @param data - Event data including name, type, dates, and location
 * @returns Result containing the created event or error details
 *
 * @example
 * const result = await eventService.create({
 *   name: 'Wedding Ceremony',
 *   eventType: 'ceremony',
 *   startDate: '2025-06-15T14:00:00Z',
 *   locationId: '123e4567-e89b-12d3-a456-426614174000',
 * });
 */
export async function create(data: CreateEventDTO): Promise<Result<Event>> {
  try {
    // 1. Validate
    const validation = createEventSchema.safeParse(data);
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
      name: sanitizeInput(validation.data.name),
      description: validation.data.description ? sanitizeRichText(validation.data.description) : null,
    };

    // 3. Check for scheduling conflicts if location is specified
    if (sanitized.locationId) {
      const conflictCheck = await checkSchedulingConflicts({
        locationId: sanitized.locationId,
        startDate: sanitized.startDate,
        endDate: sanitized.endDate || null,
      });

      if (!conflictCheck.success) {
        return conflictCheck as Result<Event>;
      }

      if (conflictCheck.data.hasConflict) {
        return {
          success: false,
          error: {
            code: 'SCHEDULING_CONFLICT',
            message: 'Event conflicts with existing events at this location',
            details: conflictCheck.data.conflictingEvents,
          },
        };
      }
    }

    // 4. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('events')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Event };
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
 * Retrieves a single event by ID.
 *
 * @param id - Event UUID
 * @returns Result containing the event or error details
 */
export async function get(id: string): Promise<Result<Event>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Event not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as Event };
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
 * Updates an existing event.
 *
 * @param id - Event UUID
 * @param data - Partial event data to update
 * @returns Result containing the updated event or error details
 */
export async function update(id: string, data: UpdateEventDTO): Promise<Result<Event>> {
  try {
    // 1. Validate
    const validation = updateEventSchema.safeParse(data);
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
    const sanitized: any = { ...validation.data };
    if (sanitized.name) {
      sanitized.name = sanitizeInput(sanitized.name);
    }
    if (sanitized.description) {
      sanitized.description = sanitizeRichText(sanitized.description);
    }

    // 3. Check for scheduling conflicts if location or dates are being updated
    if (sanitized.locationId || sanitized.startDate || sanitized.endDate) {
      // Get current event data to fill in missing fields
      const currentEvent = await get(id);
      if (!currentEvent.success) {
        return currentEvent;
      }

      const locationId = sanitized.locationId || currentEvent.data.locationId;
      const startDate = sanitized.startDate || currentEvent.data.startDate;
      const endDate = sanitized.endDate !== undefined ? sanitized.endDate : currentEvent.data.endDate;

      if (locationId) {
        const conflictCheck = await checkSchedulingConflicts({
          locationId,
          startDate,
          endDate,
          excludeEventId: id,
        });

        if (!conflictCheck.success) {
          return conflictCheck as Result<Event>;
        }

        if (conflictCheck.data.hasConflict) {
          return {
            success: false,
            error: {
              code: 'SCHEDULING_CONFLICT',
              message: 'Event conflicts with existing events at this location',
              details: conflictCheck.data.conflictingEvents,
            },
          };
        }
      }
    }

    // 4. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('events')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Event not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Event };
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
 * Deletes an event by ID.
 * Note: Activities with event_id set to this event will have their event_id set to NULL (not deleted).
 *
 * @param id - Event UUID
 * @returns Result indicating success or error details
 */
export async function deleteEvent(id: string): Promise<Result<void>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: undefined };
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
 * Lists events with optional filtering and pagination.
 *
 * @param filters - Filter criteria and pagination options
 * @returns Result containing paginated events or error details
 */
export async function list(filters: EventFilterDTO = {}): Promise<Result<PaginatedEvents>> {
  try {
    // 1. Validate
    const validation = eventFilterSchema.safeParse(filters);
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

    const { page = 1, pageSize = 50, ...filterParams } = validation.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 2. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase.from('events').select('*', { count: 'exact' });

    // Apply filters
    if (filterParams.eventType) {
      query = query.eq('event_type', filterParams.eventType);
    }
    if (filterParams.status) {
      query = query.eq('status', filterParams.status);
    }
    if (filterParams.locationId) {
      query = query.eq('location_id', filterParams.locationId);
    }
    if (filterParams.startDateFrom) {
      query = query.gte('start_date', filterParams.startDateFrom);
    }
    if (filterParams.startDateTo) {
      query = query.lte('start_date', filterParams.startDateTo);
    }

    // Apply pagination and ordering
    query = query.order('start_date', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const events = data.map((event) => toCamelCase(event) as Event);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        events,
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
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Searches events by name or description.
 *
 * @param searchParams - Search query and pagination options
 * @returns Result containing paginated search results or error details
 */
export async function search(searchParams: EventSearchDTO): Promise<Result<PaginatedEvents>> {
  try {
    // 1. Validate
    const validation = eventSearchSchema.safeParse(searchParams);
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

    const { query, page = 1, pageSize = 50 } = validation.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 2. Sanitize search query
    const sanitizedQuery = sanitizeInput(query);

    // 3. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      .order('start_date', { ascending: true })
      .range(from, to);

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const events = data.map((event) => toCamelCase(event) as Event);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        events,
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
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Checks for scheduling conflicts at a specific location and time range.
 *
 * @param params - Location, date range, and optional event ID to exclude
 * @returns Result containing conflict information or error details
 */
export async function checkSchedulingConflicts(
  params: ConflictCheckDTO
): Promise<Result<SchedulingConflict>> {
  try {
    // 1. Validate
    const validation = conflictCheckSchema.safeParse(params);
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

    const { locationId, startDate, endDate, excludeEventId } = validation.data;

    // 2. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query for overlapping events at the same location
    let query = supabase
      .from('events')
      .select('id, name, start_date, end_date')
      .eq('location_id', locationId);

    // Exclude the current event if updating
    if (excludeEventId) {
      query = query.neq('id', excludeEventId);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    // Check for time overlaps
    const conflictingEvents = data.filter((event) => {
      const eventStart = new Date(event.start_date);
      const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
      const checkStart = new Date(startDate);
      const checkEnd = endDate ? new Date(endDate) : checkStart;

      // Two events overlap if:
      // (StartA <= EndB) and (EndA >= StartB)
      return eventStart <= checkEnd && eventEnd >= checkStart;
    });

    return {
      success: true,
      data: {
        hasConflict: conflictingEvents.length > 0,
        conflictingEvents: conflictingEvents.map((event) => ({
          id: event.id,
          name: event.name,
          startDate: event.start_date,
          endDate: event.end_date,
        })),
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
