import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as locationService from '@/services/locationService';
import { createLocationSchema } from '@/schemas/locationSchemas';

/**
 * GET /api/admin/locations - Get location tree
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Get hierarchy
    const result = await locationService.getHierarchy();

    // 3. Return response
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('GET /api/admin/locations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch locations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/locations - Create location
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body = await request.json();
    const validation = createLocationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. Call service
    const result = await locationService.create(validation.data);

    // 4. Return response with proper status
    if (!result.success) {
      const statusCode =
        result.error.code === 'VALIDATION_ERROR'
          ? 400
          : result.error.code === 'INVALID_PARENT'
          ? 400
          : result.error.code === 'CIRCULAR_REFERENCE'
          ? 409
          : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/locations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create location',
        },
      },
      { status: 500 }
    );
  }
}
