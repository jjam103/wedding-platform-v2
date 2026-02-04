import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { moderatePhoto } from '@/services/photoService';
import { z } from 'zod';

const moderateSchema = z.object({
  moderation_status: z.enum(['approved', 'rejected']),
  moderation_reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/photos/[id]/moderate
 * 
 * Moderate a photo (approve or reject)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. Authenticate
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

    // 2. Validate ID
    const idValidation = z.string().uuid().safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid photo ID',
          },
        },
        { status: 400 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json();
    const validation = moderateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid moderation data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 4. Call service
    const result = await moderatePhoto(id, validation.data);

    // 5. Return response
    if (!result.success) {
      const statusMap: Record<string, number> = {
        VALIDATION_ERROR: 400,
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
    console.error('Photo moderation error:', error);
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
