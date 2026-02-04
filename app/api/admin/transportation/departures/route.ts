import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/transportation/departures
 * Get departure manifests for a specific date
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check with anon key
    const cookieStore = await cookies();
    const authClient = createServerClient(
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
    const {
      data: { session },
      error: authError,
    } = await authClient.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const airport = searchParams.get('airport');

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Date parameter is required' },
        },
        { status: 400 }
      );
    }

    // 3. Use service role client for database queries (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query guests with departure information
    let query = supabase
      .from('guests')
      .select('id, first_name, last_name, departure_date, departure_time, airport_code, flight_number')
      .eq('departure_date', date)
      .not('airport_code', 'is', null);

    // Apply airport filter if provided
    if (airport && airport !== 'all') {
      query = query.eq('airport_code', airport);
    }

    const { data: guests, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message, details: error },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { guests: guests || [] },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
