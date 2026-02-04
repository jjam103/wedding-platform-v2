import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as settingsService from '@/services/settingsService';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

// Request validation schema
const updateAuthMethodSchema = z.object({
  defaultAuthMethod: z.enum(['email_matching', 'magic_link']),
  updateExistingGuests: z.boolean().optional().default(false),
});

/**
 * GET /api/admin/settings/auth-method
 * 
 * Get the current default authentication method
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
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

    // 2. Get default auth method
    const result = await settingsService.getDefaultAuthMethod();

    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 3. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          defaultAuthMethod: result.data,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get auth method error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get authentication method',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/auth-method
 * 
 * Update the default authentication method
 * Optionally update all existing guests
 */
export async function PUT(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
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

    const { defaultAuthMethod, updateExistingGuests } = validation.data;

    // 3. Update auth method
    const result = await settingsService.updateDefaultAuthMethod(
      defaultAuthMethod,
      updateExistingGuests
    );

    if (!result.success) {
      const statusCode =
        result.error.code === 'VALIDATION_ERROR'
          ? 400
          : result.error.code === 'DATABASE_ERROR'
          ? 500
          : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          defaultAuthMethod,
          updatedGuestsCount: result.data.updatedGuestsCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update auth method error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update authentication method',
        },
      },
      { status: 500 }
    );
  }
}
