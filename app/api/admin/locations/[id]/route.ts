import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as locationService from '@/services/locationService';
import { updateLocationSchema } from '@/schemas/locationSchemas';

/**
 * GET /api/admin/locations/:id - Get location
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth check
  const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // 2. Call service
  const resolvedParams = await params;

  const result = await locationService.get(resolvedParams.id);

  // 3. Return response
  if (!result.success) {
    const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json(result, { status: statusCode });
  }

  return NextResponse.json(result, { status: 200 });
}

/**
 * PUT /api/admin/locations/:id - Update location
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth check
  const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const resolvedParams = await params;
  const body = await request.json();
  const validation = updateLocationSchema.safeParse(body);

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
  const result = await locationService.update(resolvedParams.id, validation.data);

  // 4. Return response with proper status
  if (!result.success) {
    const statusCode =
      result.error.code === 'VALIDATION_ERROR'
        ? 400
        : result.error.code === 'NOT_FOUND'
        ? 404
        : result.error.code === 'INVALID_PARENT'
        ? 400
        : result.error.code === 'CIRCULAR_REFERENCE'
        ? 409
        : 500;
    return NextResponse.json(result, { status: statusCode });
  }

  return NextResponse.json(result, { status: 200 });
}

/**
 * DELETE /api/admin/locations/:id - Delete location
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth check
  const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // 2. Call service
  const resolvedParams = await params;
  const result = await locationService.deleteLocation(resolvedParams.id);

  // 3. Return response
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
