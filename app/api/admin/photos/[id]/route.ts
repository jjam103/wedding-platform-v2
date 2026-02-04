import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPhoto, updatePhoto, deletePhoto } from '@/services/photoService';
import { z } from 'zod';

/**
 * GET /api/admin/photos/[id]
 * 
 * Get a single photo by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params
    const { id } = await params;

    // 2. Authenticate
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
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 3. Call service
    const result = await getPhoto(id);

    // 4. Return response
    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        DATABASE_ERROR: 500,
        UNKNOWN_ERROR: 500,
      };
      return NextResponse.json(result, {
        status: statusMap[result.error.code] || 500,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/photos/[id]
 * 
 * Update photo metadata (caption, alt_text, display_order)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params
    const { id } = await params;

    // 2. Authenticate
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
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 3. Validate input
    const body = await request.json();
    const updateSchema = z.object({
      caption: z.string().max(500).optional(),
      alt_text: z.string().max(200).optional(),
      display_order: z.number().int().optional(),
    });

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 4. Call service
    const result = await updatePhoto(id, validation.data);

    // 5. Return response
    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        VALIDATION_ERROR: 400,
        DATABASE_ERROR: 500,
        UNKNOWN_ERROR: 500,
      };
      return NextResponse.json(result, {
        status: statusMap[result.error.code] || 500,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/photos/[id]
 * 
 * Delete a photo
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params
    const { id } = await params;

    // 2. Authenticate
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
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // 3. Call service
    const result = await deletePhoto(id);

    // 4. Return response
    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        DATABASE_ERROR: 500,
        STORAGE_UNAVAILABLE: 503,
        UNKNOWN_ERROR: 500,
      };
      return NextResponse.json(result, {
        status: statusMap[result.error.code] || 500,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
