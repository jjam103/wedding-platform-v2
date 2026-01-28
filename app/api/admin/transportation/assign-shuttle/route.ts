import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

const assignShuttleSchema = z.object({
  guestId: z.string().uuid(),
  shuttleName: z.string().min(0).max(100),
});

/**
 * POST /api/admin/transportation/assign-shuttle
 * Assign a guest to a shuttle
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

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = assignShuttleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 3. Sanitize input
    const sanitizedShuttleName = sanitizeInput(validation.data.shuttleName);

    // 4. Update guest shuttle assignment
    const { error } = await supabase
      .from('guests')
      .update({
        shuttle_assignment: sanitizedShuttleName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validation.data.guestId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message, details: error },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: undefined });
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
