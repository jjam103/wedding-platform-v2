import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createActivitySchema,
  updateActivitySchema,
  activityFilterSchema,
  activitySearchSchema,
  type CreateActivityDTO,
  type UpdateActivityDTO,
  type ActivityFilterDTO,
  type ActivitySearchDTO,
  type Activity,
  type PaginatedActivities,
  type ActivityCapacity,
} from '../schemas/activitySchemas';

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
 * Creates a new activity in the system.
 *
 * @param data - Activity data including name, type, time, and capacity
 * @returns Result containing the created activity or error details
 *
 * @example
 * const result = await activityService.create({
 *   name: 'Beach Volleyball',
 *   activityType: 'activity',
 *   startTime: '2025-06-15T10:00:00Z',
 *   capacity: 20,
 * });
 */
export async function create(data: CreateActivityDTO): Promise<Result<Activity>> {
  try {
    // 1. Validate
    const validation = createActivitySchema.safeParse(data);
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
      activityType: sanitizeInput(validation.data.activityType),
    };

    // 3. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('activities')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Activity };
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
 * Retrieves a single activity by ID.
 *
 * @param id - Activity UUID
 * @returns Result containing the activity or error details
 */
export async function get(id: string): Promise<Result<Activity>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as Activity };
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
 * Updates an existing activity.
 *
 * @param id - Activity UUID
 * @param data - Partial activity data to update
 * @returns Result containing the updated activity or error details
 */
export async function update(id: string, data: UpdateActivityDTO): Promise<Result<Activity>> {
  try {
    // 1. Validate
    const validation = updateActivitySchema.safeParse(data);
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
    if (sanitized.activityType) {
      sanitized.activityType = sanitizeInput(sanitized.activityType);
    }

    // 3. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('activities')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Activity };
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
 * Deletes an activity by ID.
 *
 * @param id - Activity UUID
 * @returns Result indicating success or error details
 */
export async function deleteActivity(id: string): Promise<Result<void>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('activities').delete().eq('id', id);

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
 * Lists activities with optional filtering and pagination.
 *
 * @param filters - Filter criteria and pagination options
 * @returns Result containing paginated activities or error details
 */
export async function list(filters: ActivityFilterDTO = {}): Promise<Result<PaginatedActivities>> {
  try {
    // 1. Validate
    const validation = activityFilterSchema.safeParse(filters);
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

    let query = supabase.from('activities').select('*', { count: 'exact' });

    // Apply filters
    if (filterParams.eventId !== undefined) {
      if (filterParams.eventId === null) {
        query = query.is('event_id', null);
      } else {
        query = query.eq('event_id', filterParams.eventId);
      }
    }
    if (filterParams.activityType) {
      query = query.eq('activity_type', filterParams.activityType);
    }
    if (filterParams.status) {
      query = query.eq('status', filterParams.status);
    }
    if (filterParams.locationId) {
      query = query.eq('location_id', filterParams.locationId);
    }
    if (filterParams.adultsOnly !== undefined) {
      query = query.eq('adults_only', filterParams.adultsOnly);
    }
    if (filterParams.startTimeFrom) {
      query = query.gte('start_time', filterParams.startTimeFrom);
    }
    if (filterParams.startTimeTo) {
      query = query.lte('start_time', filterParams.startTimeTo);
    }

    // Apply pagination and ordering
    query = query.order('start_time', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const activities = data.map((activity) => toCamelCase(activity) as Activity);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        activities,
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
 * Searches activities by name or description.
 *
 * @param searchParams - Search query and pagination options
 * @returns Result containing paginated search results or error details
 */
export async function search(searchParams: ActivitySearchDTO): Promise<Result<PaginatedActivities>> {
  try {
    // 1. Validate
    const validation = activitySearchSchema.safeParse(searchParams);
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
      .from('activities')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      .order('start_time', { ascending: true })
      .range(from, to);

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const activities = data.map((activity) => toCamelCase(activity) as Activity);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        activities,
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
 * Calculates capacity information for an activity.
 *
 * @param activityId - Activity UUID
 * @returns Result containing capacity information or error details
 */
export async function getCapacityInfo(activityId: string): Promise<Result<ActivityCapacity>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get activity details
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, name, capacity')
      .eq('id', activityId)
      .single();

    if (activityError) {
      if (activityError.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: activityError.message, details: activityError },
      };
    }

    // Count attending RSVPs
    const { count, error: countError } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .eq('status', 'attending');

    if (countError) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: countError.message, details: countError },
      };
    }

    const currentAttendees = count || 0;
    const capacity = activity.capacity;
    const availableSpots = capacity !== null ? capacity - currentAttendees : null;
    const utilizationPercentage = capacity !== null ? (currentAttendees / capacity) * 100 : null;
    const isNearCapacity = utilizationPercentage !== null && utilizationPercentage >= 90;
    const isAtCapacity = utilizationPercentage !== null && utilizationPercentage >= 100;

    return {
      success: true,
      data: {
        activityId: activity.id,
        activityName: activity.name,
        capacity,
        currentAttendees,
        availableSpots,
        utilizationPercentage,
        isNearCapacity,
        isAtCapacity,
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
 * Calculates cost for an activity after applying host subsidy.
 *
 * @param activityId - Activity UUID
 * @returns Result containing net cost per person or error details
 */
export async function calculateNetCost(activityId: string): Promise<Result<number>> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: activity, error } = await supabase
      .from('activities')
      .select('cost_per_person, host_subsidy')
      .eq('id', activityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Activity not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const costPerPerson = activity.cost_per_person || 0;
    const hostSubsidy = activity.host_subsidy || 0;
    const netCost = Math.max(0, costPerPerson - hostSubsidy);

    return { success: true, data: netCost };
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
