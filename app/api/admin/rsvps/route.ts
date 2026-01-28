import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { listRSVPsSchema } from '@/schemas/rsvpSchemas';

/**
 * GET /api/admin/rsvps
 * List RSVPs with optional filters
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      guest_id: searchParams.get('guest_id') || undefined,
      event_id: searchParams.get('event_id') || undefined,
      activity_id: searchParams.get('activity_id') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      page_size: searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 50,
    };

    // 3. Validate parameters
    const validation = listRSVPsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request parameters', 
            details: validation.error.issues 
          } 
        },
        { status: 400 }
      );
    }

    // 4. Build query
    let query = supabase
      .from('rsvps')
      .select('*', { count: 'exact' });

    if (validation.data.guest_id) {
      query = query.eq('guest_id', validation.data.guest_id);
    }
    if (validation.data.event_id) {
      query = query.eq('event_id', validation.data.event_id);
    }
    if (validation.data.activity_id) {
      query = query.eq('activity_id', validation.data.activity_id);
    }
    if (validation.data.status) {
      query = query.eq('status', validation.data.status);
    }

    // 5. Execute query with pagination
    const from = (validation.data.page - 1) * validation.data.page_size;
    const to = from + validation.data.page_size - 1;
    
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: validation.data.page,
        page_size: validation.data.page_size,
        total_pages: Math.ceil((count || 0) / validation.data.page_size),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Internal server error' 
        } 
      },
      { status: 500 }
    );
  }
}
