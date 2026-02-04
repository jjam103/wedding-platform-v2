import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as settingsService from '@/services/settingsService';

/**
 * PUT /api/admin/settings/[key]
 * 
 * Update a single setting value
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
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

    // 2. Get key from params
    const { key } = await params;

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Setting key is required' },
        },
        { status: 400 }
      );
    }

    // 3. Parse body
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Value is required' },
        },
        { status: 400 }
      );
    }

    // 4. Update setting
    const result = await settingsService.updateSetting(key, value);

    // 5. Return response
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/admin/settings/[key]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}
