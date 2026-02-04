import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * PUT /api/admin/guests/[id]/auth-method
 * 
 * Updates authentication method for a specific guest
 * 
 * Requirements: 22.3
 */

const updateAuthMethodSchema = z.object({
  auth_method: z.enum(['email_matching', 'magic_link']),
});

function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'GUEST_NOT_FOUND': 404,
    'DATABASE_ERROR': 500,
    'INTERNAL_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // 1. AUTHENTICATION
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. VALIDATION
    // Validate guest ID
    const idValidation = z.string().uuid().safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid guest ID format' } },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = updateAuthMethodSchema.safeParse(body);

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

    // 3. SERVICE CALL
    const { data: guest, error: updateError } = await supabase
      .from('guests')
      .update({ auth_method: validation.data.auth_method })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'Guest not found' } },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to update guest', details: updateError },
        },
        { status: 500 }
      );
    }

    // 4. RESPONSE
    return NextResponse.json(
      {
        success: true,
        data: {
          id: guest.id,
          auth_method: guest.auth_method,
          email: guest.email,
          first_name: guest.first_name,
          last_name: guest.last_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', { path: request.url, method: request.method, error });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
