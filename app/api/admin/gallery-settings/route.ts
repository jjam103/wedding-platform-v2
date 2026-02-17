import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import * as gallerySettingsService from '@/services/gallerySettingsService';

/**
 * GET /api/admin/gallery-settings
 * 
 * Get gallery settings for a page
 * 
 * Query params:
 * - page_type: Type of page (event, activity, accommodation, etc.)
 * - page_id: Page ID
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Get query params
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get('page_type');
    const pageId = searchParams.get('page_id');

    if (!pageType || !pageId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'page_type and page_id are required' } },
        { status: 400 }
      );
    }

    // 3. Get settings
    const result = await gallerySettingsService.getSettings(pageType, pageId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gallery-settings
 * 
 * Create or update gallery settings
 * 
 * Body:
 * - page_type: Type of page
 * - page_id: Page ID
 * - display_mode: Display mode (gallery, carousel, loop)
 * - photos_per_row: Photos per row (optional)
 * - show_captions: Show captions (optional)
 * - autoplay_interval: Autoplay interval in ms (optional)
 * - transition_effect: Transition effect (optional)
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json();

    // 3. Upsert settings
    const result = await gallerySettingsService.upsertSettings(body);

    if (!result.success) {
      const status = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
