import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getContentPageBySlug } from '@/services/contentPagesService';

/**
 * Guest Content Page by Slug API Route
 * 
 * Returns a single published content page by slug with sections and columns.
 * 
 * Requirements: 8.1, 8.2
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { slug } = await params;
    
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Get guest ID from session
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // 3. Get content page by slug
    const result = await getContentPageBySlug(slug);
    
    if (!result.success) {
      return NextResponse.json(result, { status: result.error.code === 'NOT_FOUND' ? 404 : 500 });
    }
    
    // 4. Verify page is published
    if (result.data.status !== 'published') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Content page not found' } },
        { status: 404 }
      );
    }
    
    // 5. Get sections and columns for the page
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        *,
        columns (*)
      `)
      .eq('page_type', 'custom')
      .eq('page_id', result.data.id)
      .order('display_order', { ascending: true });
    
    if (sectionsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: sectionsError.message } },
        { status: 500 }
      );
    }
    
    // 6. Return response with sections
    return NextResponse.json(
      {
        success: true,
        data: {
          ...result.data,
          sections: sections || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
