import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createAccommodationSchema,
  updateAccommodationSchema,
  accommodationFilterSchema,
  accommodationSearchSchema,
  createRoomTypeSchema,
  updateRoomTypeSchema,
  createRoomAssignmentSchema,
  updateRoomAssignmentSchema,
  calculateCostSchema,
  type CreateAccommodationDTO,
  type UpdateAccommodationDTO,
  type AccommodationFilterDTO,
  type AccommodationSearchDTO,
  type CreateRoomTypeDTO,
  type UpdateRoomTypeDTO,
  type CreateRoomAssignmentDTO,
  type UpdateRoomAssignmentDTO,
  type CalculateCostDTO,
  type Accommodation,
  type RoomType,
  type RoomAssignment,
  type PaginatedAccommodations,
  type RoomCost,
  type AccommodationWithRoomTypes,
  type RoomTypeWithAvailability,
} from '../schemas/accommodationSchemas';

/**
 * Result type for consistent error handling.
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

// Initialize Supabase client - Pattern A (testable)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// ============================================================================
// ACCOMMODATION CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new accommodation in the system.
 */
export async function createAccommodation(data: CreateAccommodationDTO): Promise<Result<Accommodation>> {
  try {
    const validation = createAccommodationSchema.safeParse(data);
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

    const sanitized = {
      ...validation.data,
      name: sanitizeInput(validation.data.name),
      address: validation.data.address ? sanitizeInput(validation.data.address) : null,
      description: validation.data.description ? sanitizeRichText(validation.data.description) : null,
    };


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('accommodations')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Accommodation };
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
 * Retrieves a single accommodation by ID.
 */
export async function getAccommodation(id: string): Promise<Result<Accommodation>> {
  try {

    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Accommodation not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as Accommodation };
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
 * Retrieves a single accommodation by slug.
 * Requirements: 24.10 (Slug Management - slug-based routing)
 */
export async function getAccommodationBySlug(slug: string): Promise<Result<Accommodation>> {
  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Accommodation not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as Accommodation };
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

// Alias for backward compatibility
export const get = getAccommodation;
export const getBySlug = getAccommodationBySlug;

/**
 * Updates an existing accommodation.
 */
export async function updateAccommodation(id: string, data: UpdateAccommodationDTO): Promise<Result<Accommodation>> {
  try {
    const validation = updateAccommodationSchema.safeParse(data);
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

    const sanitized: any = { ...validation.data };
    if (sanitized.name) {
      sanitized.name = sanitizeInput(sanitized.name);
    }
    if (sanitized.address) {
      sanitized.address = sanitizeInput(sanitized.address);
    }
    if (sanitized.description) {
      sanitized.description = sanitizeRichText(sanitized.description);
    }


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('accommodations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Accommodation not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Accommodation };
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
 * Deletes an accommodation by ID.
 */
export async function deleteAccommodation(id: string): Promise<Result<void>> {
  try {

    const { error } = await supabase.from('accommodations').delete().eq('id', id);

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
 * Lists accommodations with optional filtering and pagination.
 */
export async function listAccommodations(filters: Partial<AccommodationFilterDTO> = { page: 1, pageSize: 50 }): Promise<Result<PaginatedAccommodations>> {
  try {
    const filtersWithDefaults = { page: 1, pageSize: 50, ...filters };
    const validation = accommodationFilterSchema.safeParse(filtersWithDefaults);
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


    let query = supabase.from('accommodations').select('*', { count: 'exact' });

    if (filterParams.locationId !== undefined) {
      if (filterParams.locationId === null) {
        query = query.is('location_id', null);
      } else {
        query = query.eq('location_id', filterParams.locationId);
      }
    }
    if (filterParams.status) {
      query = query.eq('status', filterParams.status);
    }

    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const accommodations = data.map((accommodation) => toCamelCase(accommodation) as Accommodation);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        accommodations,
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
 * Searches accommodations by name, address, or description.
 */
export async function searchAccommodations(searchParams: AccommodationSearchDTO): Promise<Result<PaginatedAccommodations>> {
  try {
    const validation = accommodationSearchSchema.safeParse(searchParams);
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

    const sanitizedQuery = sanitizeInput(query);


    const { data, error, count } = await supabase
      .from('accommodations')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${sanitizedQuery}%,address.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
      .order('name', { ascending: true })
      .range(from, to);

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const accommodations = data.map((accommodation) => toCamelCase(accommodation) as Accommodation);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        accommodations,
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

// ============================================================================
// ROOM TYPE CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new room type for an accommodation.
 */
export async function createRoomType(data: CreateRoomTypeDTO): Promise<Result<RoomType>> {
  try {
    const validation = createRoomTypeSchema.safeParse(data);
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

    const sanitized = {
      ...validation.data,
      name: sanitizeInput(validation.data.name),
      description: validation.data.description ? sanitizeRichText(validation.data.description) : null,
    };


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('room_types')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as RoomType };
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
 * Retrieves a single room type by ID.
 */
export async function getRoomType(id: string): Promise<Result<RoomType>> {
  try {

    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Room type not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as RoomType };
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
 * Updates an existing room type.
 */
export async function updateRoomType(id: string, data: UpdateRoomTypeDTO): Promise<Result<RoomType>> {
  try {
    const validation = updateRoomTypeSchema.safeParse(data);
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

    const sanitized: any = { ...validation.data };
    if (sanitized.name) {
      sanitized.name = sanitizeInput(sanitized.name);
    }
    if (sanitized.description) {
      sanitized.description = sanitizeRichText(sanitized.description);
    }


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('room_types')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Room type not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as RoomType };
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
 * Deletes a room type by ID.
 */
export async function deleteRoomType(id: string): Promise<Result<void>> {
  try {

    const { error } = await supabase.from('room_types').delete().eq('id', id);

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
 * Lists room types for a specific accommodation.
 */
export async function listRoomTypes(accommodationId: string): Promise<Result<RoomType[]>> {
  try {

    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('accommodation_id', accommodationId)
      .order('name', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const roomTypes = data.map((roomType) => toCamelCase(roomType) as RoomType);
    return { success: true, data: roomTypes };
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
 * Gets an accommodation with all its room types.
 */
export async function getAccommodationWithRoomTypes(id: string): Promise<Result<AccommodationWithRoomTypes>> {
  try {
    const accommodationResult = await getAccommodation(id);
    if (!accommodationResult.success) {
      return accommodationResult as Result<AccommodationWithRoomTypes>;
    }

    const roomTypesResult = await listRoomTypes(id);
    if (!roomTypesResult.success) {
      return roomTypesResult as Result<AccommodationWithRoomTypes>;
    }

    return {
      success: true,
      data: {
        ...accommodationResult.data,
        roomTypes: roomTypesResult.data,
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

// ============================================================================
// ROOM ASSIGNMENT OPERATIONS
// ============================================================================

/**
 * Creates a new room assignment for a guest.
 */
export async function createRoomAssignment(data: CreateRoomAssignmentDTO): Promise<Result<RoomAssignment>> {
  try {
    const validation = createRoomAssignmentSchema.safeParse(data);
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

    const sanitized = {
      ...validation.data,
      notes: validation.data.notes ? sanitizeInput(validation.data.notes) : null,
    };


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('room_assignments')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Guest already has a room assignment for these dates',
          },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as RoomAssignment };
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
 * Retrieves a single room assignment by ID.
 */
export async function getRoomAssignment(id: string): Promise<Result<RoomAssignment>> {
  try {

    const { data, error } = await supabase
      .from('room_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Room assignment not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as RoomAssignment };
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
 * Updates an existing room assignment.
 */
export async function updateRoomAssignment(id: string, data: UpdateRoomAssignmentDTO): Promise<Result<RoomAssignment>> {
  try {
    const validation = updateRoomAssignmentSchema.safeParse(data);
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

    const sanitized: any = { ...validation.data };
    if (sanitized.notes) {
      sanitized.notes = sanitizeInput(sanitized.notes);
    }


    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('room_assignments')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Room assignment not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as RoomAssignment };
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
 * Deletes a room assignment by ID.
 */
export async function deleteRoomAssignment(id: string): Promise<Result<void>> {
  try {

    const { error } = await supabase.from('room_assignments').delete().eq('id', id);

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
 * Lists room assignments for a specific guest.
 */
export async function listGuestRoomAssignments(guestId: string): Promise<Result<RoomAssignment[]>> {
  try {

    const { data, error } = await supabase
      .from('room_assignments')
      .select('*')
      .eq('guest_id', guestId)
      .order('check_in', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const assignments = data.map((assignment) => toCamelCase(assignment) as RoomAssignment);
    return { success: true, data: assignments };
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
 * Lists room assignments for a specific room type.
 */
export async function listRoomTypeAssignments(roomTypeId: string): Promise<Result<RoomAssignment[]>> {
  try {

    const { data, error } = await supabase
      .from('room_assignments')
      .select('*')
      .eq('room_type_id', roomTypeId)
      .order('check_in', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const assignments = data.map((assignment) => toCamelCase(assignment) as RoomAssignment);
    return { success: true, data: assignments };
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

// ============================================================================
// COST CALCULATION OPERATIONS
// ============================================================================

/**
 * Calculates the cost for a room assignment including subsidies.
 */
export async function calculateRoomCost(params: CalculateCostDTO): Promise<Result<RoomCost>> {
  try {
    const validation = calculateCostSchema.safeParse(params);
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

    const { roomTypeId, checkIn, checkOut } = validation.data;

    // Get room type details
    const roomTypeResult = await getRoomType(roomTypeId);
    if (!roomTypeResult.success) {
      return roomTypeResult as Result<RoomCost>;
    }

    const roomType = roomTypeResult.data;

    // Calculate number of nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate costs
    const pricePerNight = roomType.pricePerNight;
    const subsidyPerNight = roomType.hostSubsidyPerNight || 0;
    const totalCost = pricePerNight * numberOfNights;
    const totalSubsidy = subsidyPerNight * numberOfNights;
    const guestCost = totalCost - totalSubsidy;

    return {
      success: true,
      data: {
        totalCost,
        totalSubsidy,
        guestCost,
        numberOfNights,
        pricePerNight,
        subsidyPerNight,
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
 * Gets room type with availability information.
 */
export async function getRoomTypeWithAvailability(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<Result<RoomTypeWithAvailability>> {
  try {
    const roomTypeResult = await getRoomType(roomTypeId);
    if (!roomTypeResult.success) {
      return roomTypeResult as Result<RoomTypeWithAvailability>;
    }

    const roomType = roomTypeResult.data;


    // Count overlapping assignments
    const { data, error } = await supabase
      .from('room_assignments')
      .select('id')
      .eq('room_type_id', roomTypeId)
      .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`);

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const assignedRooms = data.length;
    const availableRooms = Math.max(0, roomType.totalRooms - assignedRooms);

    return {
      success: true,
      data: {
        ...roomType,
        assignedRooms,
        availableRooms,
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
