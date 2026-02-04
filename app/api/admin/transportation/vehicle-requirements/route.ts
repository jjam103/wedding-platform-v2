import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/transportation/vehicle-requirements
 * Calculate shuttle/vehicle needs based on guest count for a specific date
 * 
 * Query params:
 * - date: YYYY-MM-DD format
 * - type: 'arrival' | 'departure' (optional, defaults to both)
 */
export async function GET(request: Request) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type') || 'both';

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date parameter is required',
          },
        },
        { status: 400 }
      );
    }

    // 3. Query guests for arrivals and/or departures
    const serviceRoleSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    let arrivalCount = 0;
    let departureCount = 0;

    if (type === 'arrival' || type === 'both') {
      const { data: arrivals, error: arrivalError } = await serviceRoleSupabase
        .from('guests')
        .select('id, first_name, last_name, arrival_date, arrival_airport')
        .eq('arrival_date', date)
        .not('arrival_airport', 'is', null);

      if (arrivalError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch arrival data',
              details: arrivalError,
            },
          },
          { status: 500 }
        );
      }

      arrivalCount = arrivals?.length || 0;
    }

    if (type === 'departure' || type === 'both') {
      const { data: departures, error: departureError } = await serviceRoleSupabase
        .from('guests')
        .select('id, first_name, last_name, departure_date, departure_airport')
        .eq('departure_date', date)
        .not('departure_airport', 'is', null);

      if (departureError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch departure data',
              details: departureError,
            },
          },
          { status: 500 }
        );
      }

      departureCount = departures?.length || 0;
    }

    // 4. Calculate vehicle requirements
    // Assumptions:
    // - Standard shuttle capacity: 12 passengers
    // - Van capacity: 7 passengers
    // - Car capacity: 4 passengers
    const SHUTTLE_CAPACITY = 12;
    const VAN_CAPACITY = 7;
    const CAR_CAPACITY = 4;

    const calculateVehicles = (guestCount: number) => {
      const shuttles = Math.floor(guestCount / SHUTTLE_CAPACITY);
      const remaining = guestCount % SHUTTLE_CAPACITY;
      
      let vans = 0;
      let cars = 0;
      let remainingAfterVans = remaining;

      if (remaining > 0) {
        vans = Math.floor(remaining / VAN_CAPACITY);
        remainingAfterVans = remaining % VAN_CAPACITY;
        
        if (remainingAfterVans > 0) {
          cars = Math.ceil(remainingAfterVans / CAR_CAPACITY);
        }
      }

      return {
        shuttles,
        vans,
        cars,
        totalVehicles: shuttles + vans + cars,
      };
    };

    const arrivalVehicles = type === 'arrival' || type === 'both' 
      ? calculateVehicles(arrivalCount) 
      : null;
    
    const departureVehicles = type === 'departure' || type === 'both'
      ? calculateVehicles(departureCount)
      : null;

    // 5. Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          date,
          arrivals: type === 'arrival' || type === 'both' ? {
            guestCount: arrivalCount,
            vehicles: arrivalVehicles,
          } : null,
          departures: type === 'departure' || type === 'both' ? {
            guestCount: departureCount,
            vehicles: departureVehicles,
          } : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/transportation/vehicle-requirements error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate vehicle requirements',
        },
      },
      { status: 500 }
    );
  }
}
