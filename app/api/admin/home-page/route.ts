import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/services/settingsService';
import { sanitizeRichText } from '@/utils/sanitization';

/**
 * GET /api/admin/home-page
 * Get home page configuration
 */
export async function GET() {
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Get settings
    const result = await getSettings();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    // 3. Extract home page config
    const homePageConfig = {
      title: result.data.home_page_title,
      subtitle: result.data.home_page_subtitle,
      welcomeMessage: result.data.home_page_welcome_message,
      heroImageUrl: result.data.home_page_hero_image_url,
    };
    
    return NextResponse.json({ success: true, data: homePageConfig });
  } catch (error) {
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Parse request body
    const body = await request.json();
    
    // 3. Sanitize rich text content
    const sanitizedData = {
      home_page_title: body.title,
      home_page_subtitle: body.subtitle,
      home_page_welcome_message: body.welcomeMessage ? sanitizeRichText(body.welcomeMessage) : null,
      home_page_hero_image_url: body.heroImageUrl,
    };
    
    // 4. Update settings
    const result = await updateSettings(sanitizedData);
    
    if (!result.success) {
      if (result.error.code === 'VALIDATION_ERROR') {
        return NextResponse.json(result, { status: 400 });
      }
      return NextResponse.json(result, { status: 500 });
    }
    
    // 5. Return updated config
    const homePageConfig = {
      title: result.data.home_page_title,
      subtitle: result.data.home_page_subtitle,
      welcomeMessage: result.data.home_page_welcome_message,
      heroImageUrl: result.data.home_page_hero_image_url,
    };
    
    return NextResponse.json({ success: true, data: homePageConfig });
  } catch (error) {
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
