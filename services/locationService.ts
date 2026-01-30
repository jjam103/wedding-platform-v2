import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import {
  createLocationSchema,
  updateLocationSchema,
  locationFilterSchema,
  locationSearchSchema,
  type CreateLocationDTO,
  type UpdateLocationDTO,
  type LocationFilterDTO,
  type LocationSearchDTO,
  type Location,
  type PaginatedLocations,
  type LocationWithChildren,
} from '../schemas/locationSchemas';

/**
 * Result type for consistent error handling.
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

/**
 * Module-level Supabase client (Pattern A)
 */
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

/**
 * Creates a new location in the system.
 *
 * @param data - Location data including name, parent location, and address
 * @returns Result containing the created location or error details
 *
 * @example
 * const result = await locationService.create({
 *   name: 'Tamarindo Beach',
 *   parentLocationId: '123e4567-e89b-12d3-a456-426614174000',
 *   address: 'Tamarindo, Guanacaste, Costa Rica',
 * });
 */
export async function create(data: CreateLocationDTO): Promise<Result<Location>> {
  try {
    // 1. Validate
    const validation = createLocationSchema.safeParse(data);
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
      address: validation.data.address ? sanitizeInput(validation.data.address) : null,
      description: validation.data.description ? sanitizeRichText(validation.data.description) : null,
    };

    // 3. Check for circular reference if parent is specified
    if (sanitized.parentLocationId) {
      const parentExists = await get(sanitized.parentLocationId);
      if (!parentExists.success) {
        return {
          success: false,
          error: {
            code: 'INVALID_PARENT',
            message: 'Parent location does not exist',
          },
        };
      }
    }

    // 4. Database operation
    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('locations')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Location };
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
 * Retrieves a single location by ID.
 *
 * @param id - Location UUID
 * @returns Result containing the location or error details
 */
export async function get(id: string): Promise<Result<Location>> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Location not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) as Location };
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
 * Updates an existing location.
 *
 * @param id - Location UUID
 * @param data - Partial location data to update
 * @returns Result containing the updated location or error details
 */
export async function update(id: string, data: UpdateLocationDTO): Promise<Result<Location>> {
  try {
    // 1. Validate
    const validation = updateLocationSchema.safeParse(data);
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
    if (sanitized.address) {
      sanitized.address = sanitizeInput(sanitized.address);
    }
    if (sanitized.description) {
      sanitized.description = sanitizeRichText(sanitized.description);
    }

    // 3. Check for circular reference if parent is being updated
    if (sanitized.parentLocationId) {
      // Prevent setting self as parent
      if (sanitized.parentLocationId === id) {
        return {
          success: false,
          error: {
            code: 'CIRCULAR_REFERENCE',
            message: 'Location cannot be its own parent',
          },
        };
      }

      // Check if parent exists
      const parentExists = await get(sanitized.parentLocationId);
      if (!parentExists.success) {
        return {
          success: false,
          error: {
            code: 'INVALID_PARENT',
            message: 'Parent location does not exist',
          },
        };
      }

      // Check for circular reference in hierarchy
      const wouldCreateCycle = await checkCircularReference(id, sanitized.parentLocationId);
      if (wouldCreateCycle) {
        return {
          success: false,
          error: {
            code: 'CIRCULAR_REFERENCE',
            message: 'This would create a circular reference in the location hierarchy',
          },
        };
      }
    }

    // 4. Database operation
    const dbData = toSnakeCase(sanitized);
    const { data: result, error } = await supabase
      .from('locations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Location not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) as Location };
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
 * Deletes a location by ID.
 * Note: Child locations will have their parent_location_id set to NULL (not deleted).
 *
 * @param id - Location UUID
 * @returns Result indicating success or error details
 */
export async function deleteLocation(id: string): Promise<Result<void>> {
  try {
    const { error } = await supabase.from('locations').delete().eq('id', id);

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
 * Lists locations with optional filtering and pagination.
 *
 * @param filters - Filter criteria and pagination options
 * @returns Result containing paginated locations or error details
 */
export async function list(filters: Partial<LocationFilterDTO> = { page: 1, pageSize: 50 }): Promise<Result<PaginatedLocations>> {
  try {
    // 1. Validate
    const filtersWithDefaults = { page: 1, pageSize: 50, ...filters };
    const validation = locationFilterSchema.safeParse(filtersWithDefaults);
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
    let query = supabase.from('locations').select('*', { count: 'exact' });

    // Apply filters
    if (filterParams.parentLocationId !== undefined) {
      if (filterParams.parentLocationId === null) {
        query = query.is('parent_location_id', null);
      } else {
        query = query.eq('parent_location_id', filterParams.parentLocationId);
      }
    }

    // Apply pagination and ordering
    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const locations = data.map((location) => toCamelCase(location) as Location);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        locations,
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
 * Searches locations by name, address, or description.
 *
 * @param searchParams - Search query and pagination options
 * @returns Result containing paginated search results or error details
 */
export async function search(searchParams: LocationSearchDTO): Promise<Result<PaginatedLocations>> {
  try {
    // 1. Validate
    const validation = locationSearchSchema.safeParse(searchParams);
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
    const { data, error, count } = await supabase
      .from('locations')
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

    const locations = data.map((location) => toCamelCase(location) as Location);
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        locations,
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
 * Gets the hierarchical tree of locations starting from root locations.
 *
 * @returns Result containing the location hierarchy or error details
 */
export async function getHierarchy(): Promise<Result<LocationWithChildren[]>> {
  try {
    // Get all locations
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const locations = data.map((location) => toCamelCase(location) as Location);

    // Build hierarchy
    const locationMap = new Map<string, LocationWithChildren>();
    const rootLocations: LocationWithChildren[] = [];

    // Initialize all locations with empty children arrays
    locations.forEach((location) => {
      locationMap.set(location.id, { ...location, children: [] });
    });

    // Build parent-child relationships
    locations.forEach((location) => {
      const locationWithChildren = locationMap.get(location.id)!;
      if (location.parentLocationId) {
        const parent = locationMap.get(location.parentLocationId);
        if (parent) {
          parent.children.push(locationWithChildren);
        } else {
          // Parent doesn't exist, treat as root
          rootLocations.push(locationWithChildren);
        }
      } else {
        rootLocations.push(locationWithChildren);
      }
    });

    return { success: true, data: rootLocations };
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
 * Gets all child locations of a specific location (recursive).
 *
 * @param parentId - Parent location UUID
 * @returns Result containing the location with all descendants or error details
 */
export async function getWithChildren(parentId: string): Promise<Result<LocationWithChildren>> {
  try {
    // Get the parent location
    const parentResult = await get(parentId);
    if (!parentResult.success) {
      return parentResult as Result<LocationWithChildren>;
    }

    // Get all locations to build the tree
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const locations = data.map((location) => toCamelCase(location) as Location);

    // Build location map
    const locationMap = new Map<string, LocationWithChildren>();
    locations.forEach((location) => {
      locationMap.set(location.id, { ...location, children: [] });
    });

    // Build parent-child relationships
    locations.forEach((location) => {
      if (location.parentLocationId) {
        const parent = locationMap.get(location.parentLocationId);
        const child = locationMap.get(location.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    const result = locationMap.get(parentId);
    if (!result) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found' },
      };
    }

    return { success: true, data: result };
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
 * Checks if setting a parent would create a circular reference.
 * Returns true if it would create a cycle, false otherwise.
 *
 * @param locationId - The location being updated
 * @param newParentId - The proposed new parent
 * @returns Promise<boolean> - True if circular reference would be created
 */
async function checkCircularReference(locationId: string, newParentId: string): Promise<boolean> {
  // Get all locations
  const { data, error } = await supabase.from('locations').select('id, parent_location_id');

  if (error || !data) {
    return false; // If we can't check, allow the operation
  }

  // Build parent map
  const parentMap = new Map<string, string | null>();
  data.forEach((location) => {
    parentMap.set(location.id, location.parent_location_id);
  });

  // Walk up the tree from newParentId to see if we encounter locationId
  let currentId: string | null = newParentId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === locationId) {
      return true; // Circular reference detected
    }
    if (visited.has(currentId)) {
      return true; // Already visited, circular reference exists
    }
    visited.add(currentId);
    currentId = parentMap.get(currentId) || null;
  }

  return false; // No circular reference
}
