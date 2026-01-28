import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Result type for consistent error handling
 */
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Audit log entry structure
 */
export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  entity_type: string;
  entity_id: string;
  operation_type: 'create' | 'update' | 'delete';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Input for creating an audit log entry
 */
export interface CreateAuditLogInput {
  user_id?: string | null;
  user_email?: string | null;
  entity_type: string;
  entity_id: string;
  operation_type: 'create' | 'update' | 'delete';
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  user_id?: string;
  entity_type?: string;
  entity_id?: string;
  operation_type?: 'create' | 'update' | 'delete';
  start_date?: Date;
  end_date?: Date;
  page?: number;
  page_size?: number;
}

/**
 * Paginated audit log results
 */
export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Creates an audit log entry for a data modification operation.
 * 
 * @param supabase - Supabase client instance
 * @param input - Audit log data
 * @returns Result containing the created audit log or error details
 * 
 * @example
 * const result = await auditLogService.create(supabase, {
 *   user_id: 'user-123',
 *   user_email: 'admin@example.com',
 *   entity_type: 'guest',
 *   entity_id: 'guest-456',
 *   operation_type: 'update',
 *   old_data: { first_name: 'John' },
 *   new_data: { first_name: 'Jane' },
 * });
 */
export async function create(
  supabase: SupabaseClient,
  input: CreateAuditLogInput
): Promise<Result<AuditLog>> {
  try {
    // Validate required fields
    if (!input.entity_type || !input.entity_id || !input.operation_type) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: entity_type, entity_id, and operation_type are required',
        },
      };
    }

    // Validate operation_type
    if (!['create', 'update', 'delete'].includes(input.operation_type)) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid operation_type. Must be one of: create, update, delete',
        },
      };
    }

    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: input.user_id || null,
        user_email: input.user_email || null,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        operation_type: input.operation_type,
        old_data: input.old_data || null,
        new_data: input.new_data || null,
        ip_address: input.ip_address || null,
        user_agent: input.user_agent || null,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create audit log',
          details: error,
        },
      };
    }

    return { success: true, data: data as AuditLog };
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
 * Retrieves audit logs with optional filtering and pagination.
 * Only accessible to super admins via RLS policies.
 * 
 * @param supabase - Supabase client instance
 * @param filters - Optional filters for querying audit logs
 * @returns Result containing paginated audit logs or error details
 * 
 * @example
 * const result = await auditLogService.list(supabase, {
 *   entity_type: 'guest',
 *   operation_type: 'update',
 *   page: 1,
 *   page_size: 50,
 * });
 */
export async function list(
  supabase: SupabaseClient,
  filters: AuditLogFilters = {}
): Promise<Result<PaginatedAuditLogs>> {
  try {
    const page = filters.page || 1;
    const page_size = filters.page_size || 50;
    const from = (page - 1) * page_size;
    const to = from + page_size - 1;

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }
    if (filters.operation_type) {
      query = query.eq('operation_type', filters.operation_type);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve audit logs',
          details: error,
        },
      };
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / page_size);

    return {
      success: true,
      data: {
        logs: (data as AuditLog[]) || [],
        total,
        page,
        page_size,
        total_pages,
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
 * Retrieves a single audit log entry by ID.
 * Only accessible to super admins via RLS policies.
 * 
 * @param supabase - Supabase client instance
 * @param id - Audit log ID
 * @returns Result containing the audit log or error details
 */
export async function get(
  supabase: SupabaseClient,
  id: string
): Promise<Result<AuditLog>> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit log not found',
          },
        };
      }
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to retrieve audit log',
          details: error,
        },
      };
    }

    return { success: true, data: data as AuditLog };
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
 * Helper function to log a create operation.
 * 
 * @param supabase - Supabase client instance
 * @param entity_type - Type of entity (e.g., 'guest', 'event', 'activity')
 * @param entity_id - ID of the created entity
 * @param new_data - The created entity data
 * @param user_id - Optional user ID
 * @param user_email - Optional user email
 * @returns Result containing the created audit log or error details
 */
export async function logCreate(
  supabase: SupabaseClient,
  entity_type: string,
  entity_id: string,
  new_data: Record<string, unknown>,
  user_id?: string,
  user_email?: string
): Promise<Result<AuditLog>> {
  return create(supabase, {
    user_id,
    user_email,
    entity_type,
    entity_id,
    operation_type: 'create',
    new_data,
  });
}

/**
 * Helper function to log an update operation.
 * 
 * @param supabase - Supabase client instance
 * @param entity_type - Type of entity (e.g., 'guest', 'event', 'activity')
 * @param entity_id - ID of the updated entity
 * @param old_data - The entity data before update
 * @param new_data - The entity data after update
 * @param user_id - Optional user ID
 * @param user_email - Optional user email
 * @returns Result containing the created audit log or error details
 */
export async function logUpdate(
  supabase: SupabaseClient,
  entity_type: string,
  entity_id: string,
  old_data: Record<string, unknown>,
  new_data: Record<string, unknown>,
  user_id?: string,
  user_email?: string
): Promise<Result<AuditLog>> {
  return create(supabase, {
    user_id,
    user_email,
    entity_type,
    entity_id,
    operation_type: 'update',
    old_data,
    new_data,
  });
}

/**
 * Helper function to log a delete operation.
 * 
 * @param supabase - Supabase client instance
 * @param entity_type - Type of entity (e.g., 'guest', 'event', 'activity')
 * @param entity_id - ID of the deleted entity
 * @param old_data - The entity data before deletion
 * @param user_id - Optional user ID
 * @param user_email - Optional user email
 * @returns Result containing the created audit log or error details
 */
export async function logDelete(
  supabase: SupabaseClient,
  entity_type: string,
  entity_id: string,
  old_data: Record<string, unknown>,
  user_id?: string,
  user_email?: string
): Promise<Result<AuditLog>> {
  return create(supabase, {
    user_id,
    user_email,
    entity_type,
    entity_id,
    operation_type: 'delete',
    old_data,
  });
}

export const auditLogService = {
  create,
  list,
  get,
  logCreate,
  logUpdate,
  logDelete,
};
