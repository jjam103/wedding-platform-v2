import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import * as settingsService from '@/services/settingsService';

/**
 * GET /api/admin/settings
 * 
 * Retrieves system settings
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */
export async function GET(request: Request) {
  // 1. Auth check
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

  // 2. Get settings
  const result = await settingsService.getSettings();

  // 3. Return response
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

/**
 * PUT /api/admin/settings
 * 
 * Updates system settings
 * 
 * Requirements: 20.5
 */
export async function PUT(request: Request) {
  // 1. Auth check
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

  // 2. Parse and validate
  const body = await request.json();

  // 3. Update settings
  const result = await settingsService.updateSettings(body);

  // 4. Return response with proper status
  if (!result.success) {
    const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
    return NextResponse.json(result, { status: statusCode });
  }

  return NextResponse.json(result, { status: 200 });
}
