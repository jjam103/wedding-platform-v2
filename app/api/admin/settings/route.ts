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

  // 3. Update each setting individually
  const updates = [];
  const errors = [];
  
  for (const [key, value] of Object.entries(body)) {
    const result = await settingsService.updateSetting(key, value);
    
    if (!result.success) {
      // If setting doesn't exist, try to create it
      if (result.error.code === 'NOT_FOUND') {
        const createResult = await settingsService.createSetting(key, value);
        if (!createResult.success) {
          errors.push({ key, error: createResult.error });
        } else {
          updates.push({ key, value });
        }
      } else {
        errors.push({ key, error: result.error });
      }
    } else {
      updates.push({ key, value });
    }
  }

  // 4. Return response
  if (errors.length > 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'PARTIAL_UPDATE_FAILURE', 
          message: `Failed to update ${errors.length} setting(s)`,
          details: errors
        } 
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updates }, { status: 200 });
}
