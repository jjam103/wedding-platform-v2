import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { listContentPages } from '@/services/contentPagesService';

/**
 * Guest Content Pages API Route
 * 
 * Returns only published content pages for guest viewing.
 * 
 * Requirements: 8.1, 8.2
 */
export async function GET(request: Request) {
  try {
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
    
    // 3. Get published content pages
    const result = await listContentPages({ status: 'published' });
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    // 4. Return response
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
