/**
 * Group Service
 * 
 * Handles guest group management operations.
 */

import { createGroupSchema, updateGroupSchema } from '@/schemas/groupSchemas';
import type { CreateGroupDTO, UpdateGroupDTO, Group, GroupWithCount } from '@/schemas/groupSchemas';

type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: any } };

// Lazy load supabase to avoid initialization issues in tests
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const { supabase } = require('@/lib/supabase');
    _supabase = supabase;
  }
  return _supabase;
}

/**
 * Sanitize user input to prevent XSS attacks.
 * Server-side sanitization using basic string cleaning.
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Convert snake_case to camelCase for database results.
 */
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Creates a new guest group.
 */
export async function create(data: CreateGroupDTO): Promise<Result<Group>> {
  try {
    const supabase = getSupabase();
    
    // 1. Validate
    const validation = createGroupSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid group data',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized = {
      name: sanitizeInput(validation.data.name),
      description: validation.data.description ? sanitizeInput(validation.data.description) : null,
    };

    // 3. Database operation
    const { data: result, error } = await supabase
      .from('groups')
      .insert(sanitized)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) };
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
 * Gets a group by ID.
 */
export async function get(id: string): Promise<Result<Group>> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Group not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(data) };
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
 * Lists all groups with guest counts.
 */
export async function list(): Promise<Result<GroupWithCount[]>> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        guests:guests(count)
      `)
      .order('name', { ascending: true });

    if (error) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    const groups = data.map((group: any) => ({
      ...toCamelCase(group),
      guestCount: group.guests[0]?.count || 0,
    }));

    return { success: true, data: groups };
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
 * Updates a group.
 */
export async function update(id: string, data: UpdateGroupDTO): Promise<Result<Group>> {
  try {
    const supabase = getSupabase();
    
    // 1. Validate
    const validation = updateGroupSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid group data',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized: any = {};
    if (validation.data.name !== undefined) {
      sanitized.name = sanitizeInput(validation.data.name);
    }
    if (validation.data.description !== undefined) {
      sanitized.description = validation.data.description ? sanitizeInput(validation.data.description) : null;
    }

    // 3. Database operation
    const { data: result, error } = await supabase
      .from('groups')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Group not found' },
        };
      }
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    return { success: true, data: toCamelCase(result) };
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
 * Deletes a group.
 * Note: This will cascade delete all guests in the group.
 */
export async function deleteGroup(id: string): Promise<Result<void>> {
  try {
    const supabase = getSupabase();
    
    // Check if group has guests
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id')
      .eq('group_id', id)
      .limit(1);

    if (guestsError) {
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: guestsError.message, details: guestsError },
      };
    }

    if (guests && guests.length > 0) {
      return {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete group with guests. Please delete or reassign guests first.',
        },
      };
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

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
