import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * API Helper utilities for consistent route handling
 * 
 * Provides:
 * - Authentication verification
 * - Standard error responses
 * - Pagination support
 * - Filtering support
 */

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: { code: string; message: string };
}

/**
 * Verify authentication for API routes
 * 
 * @returns AuthResult with userId if authenticated, error otherwise
 */
export async function verifyAuth(): Promise<AuthResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[verifyAuth] Missing Supabase environment variables');
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication configuration error',
        },
      };
    }

    const cookieStore = await cookies();
    
    // Use createServerClient (same as middleware) instead of createRouteHandlerClient
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value);
            });
          },
        },
      }
    );
    
    // Use getUser() instead of getSession() for more reliable auth check
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('[verifyAuth] Authentication failed:', error?.message || 'No user');
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
    }

    console.log('[verifyAuth] User authenticated:', user.id);
    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error('[verifyAuth] Unexpected error:', error);
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
    };
  }
}

/**
 * Create standard error response
 * 
 * @param code - Error code
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional error details
 * @returns NextResponse with error
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Create validation error response with field-level details
 * 
 * Requirement 13.6: Return HTTP 400 with VALIDATION_ERROR code and field-level error details
 * Requirement 18.1: Display specific field and validation rule that failed
 * 
 * @param message - Error message
 * @param fieldErrors - Array of field-level errors
 * @returns NextResponse with validation error
 * 
 * @example
 * return validationErrorResponse('Validation failed', [
 *   { field: 'email', message: 'Invalid email format', code: 'invalid_string' },
 *   { field: 'firstName', message: 'Required', code: 'required' }
 * ]);
 */
export function validationErrorResponse(
  message: string = 'Validation failed',
  fieldErrors: Array<{ field: string; message: string; code?: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: {
          fields: fieldErrors,
        },
      },
    },
    { status: 400 }
  );
}

/**
 * Create standard success response
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Parse pagination parameters from URL search params
 * 
 * @param searchParams - URL search params
 * @returns Pagination parameters with defaults
 */
export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const result = paginationSchema.safeParse({
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
  });

  if (result.success) {
    return result.data;
  }

  // Return defaults if parsing fails
  return { page: 1, pageSize: 50 };
}

/**
 * Calculate pagination range for Supabase queries
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Object with from and to indices for Supabase range()
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Parse filter parameters from URL search params
 * 
 * @param searchParams - URL search params
 * @param allowedFilters - Array of allowed filter keys
 * @returns Object with filter key-value pairs
 */
export function parseFilters(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};

  allowedFilters.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      filters[key] = value;
    }
  });

  return filters;
}

/**
 * Validate request body with Zod schema
 * 
 * Returns field-level error details for validation failures.
 * Requirement 13.6: Return HTTP 400 with VALIDATION_ERROR code and field-level error details
 * Requirement 18.1: Display specific field and validation rule that failed
 * 
 * @param body - Request body
 * @param schema - Zod schema
 * @returns Validation result with field-level error details
 * 
 * @example
 * const validation = validateBody(body, createGuestSchema);
 * if (!validation.success) {
 *   // validation.error.details contains field-level errors:
 *   // [{ field: 'email', message: 'Invalid email format', code: 'invalid_string' }]
 *   return errorResponse(validation.error.code, validation.error.message, 400, validation.error.details);
 * }
 */
export function validateBody<T extends z.ZodTypeAny>(
  body: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: { code: string; message: string; details: any } } {
  const validation = schema.safeParse(body);

  if (!validation.success) {
    // Format field-level errors for better client consumption
    const fieldErrors = validation.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: {
          fields: fieldErrors,
          raw: validation.error.issues, // Keep raw issues for debugging
        },
      },
    };
  }

  return {
    success: true,
    data: validation.data,
  };
}

/**
 * Handle API errors consistently
 * 
 * @param error - Error object
 * @returns NextResponse with appropriate error
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('not found')) {
      return errorResponse('NOT_FOUND', error.message, 404);
    }
    if (error.message.includes('duplicate') || error.message.includes('conflict')) {
      return errorResponse('CONFLICT', error.message, 409);
    }
    if (error.message.includes('unauthorized') || error.message.includes('permission')) {
      return errorResponse('FORBIDDEN', error.message, 403);
    }

    return errorResponse('INTERNAL_ERROR', error.message, 500);
  }

  return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Standard API route handler wrapper
 * 
 * Handles authentication, error handling, and response formatting
 * 
 * @param handler - Async handler function that receives userId
 * @returns NextResponse
 */
export async function withAuth(
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const auth = await verifyAuth();

    if (!auth.success || !auth.userId) {
      return errorResponse(
        auth.error?.code || 'UNAUTHORIZED',
        auth.error?.message || 'Authentication required',
        401
      );
    }

    return await handler(auth.userId);
  } catch (error) {
    return handleApiError(error);
  }
}
