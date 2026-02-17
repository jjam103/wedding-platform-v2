import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { getSetting, upsertHomePageConfig } from '@/services/settingsService';
import { homePageConfigSchema } from '@/schemas/settingsSchemas';
import { sanitizeRichText } from '@/utils/sanitization';

/**
 * Map error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    DATABASE_ERROR: 500,
    INTERNAL_ERROR: 500,
    UNKNOWN_ERROR: 500,
  };
  return statusMap[errorCode] || 500;
}

/**
 * GET /api/admin/home-page
 * Get home page configuration
 */
export async function GET() {
  try {
    // 1. Authenticate
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Get individual home page settings
    const [titleResult, subtitleResult, welcomeMessageResult, heroImageResult] = await Promise.all([
      getSetting('home_page_title'),
      getSetting('home_page_subtitle'),
      getSetting('home_page_welcome_message'),
      getSetting('home_page_hero_image_url'),
    ]);
    
    // 3. Build home page config (handle NOT_FOUND gracefully)
    const homePageConfig = {
      title: titleResult.success ? titleResult.data : null,
      subtitle: subtitleResult.success ? subtitleResult.data : null,
      welcomeMessage: welcomeMessageResult.success ? welcomeMessageResult.data : null,
      heroImageUrl: heroImageResult.success ? heroImageResult.data : null,
    };
    
    return NextResponse.json({ success: true, data: homePageConfig }, { status: 200 });
  } catch (error) {
    console.error('Home page GET API error:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    });
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'UNKNOWN_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/home-page
 * Update home page configuration
 */
export async function PUT(request: Request) {
  try {
    // 1. AUTHENTICATION
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. VALIDATION
    const body = await request.json();
    const validation = homePageConfigSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid home page configuration', 
            details: validation.error.issues 
          } 
        },
        { status: 400 }
      );
    }
    
    // Sanitize rich text content
    const sanitizedConfig = {
      ...validation.data,
      welcomeMessage: validation.data.welcomeMessage 
        ? sanitizeRichText(validation.data.welcomeMessage) 
        : validation.data.welcomeMessage,
    };
    
    // 3. SERVICE CALL - Use upsert pattern
    const result = await upsertHomePageConfig(sanitizedConfig);
    
    // 4. RESPONSE
    if (!result.success) {
      return NextResponse.json(result, { status: getStatusCode(result.error.code) });
    }
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Home page PUT API error:', { 
      path: request.url, 
      method: request.method, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}
