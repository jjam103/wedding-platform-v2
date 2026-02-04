import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/transportation/driver-sheets
 * Generate printable driver sheet with guest details for a specific shuttle
 * 
 * Query params:
 * - shuttleId: string - Shuttle identifier
 * - date: YYYY-MM-DD format
 * - type: 'arrival' | 'departure'
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
    const shuttleId = searchParams.get('shuttleId');
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    if (!shuttleId || !date || !type) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'shuttleId, date, and type parameters are required',
          },
        },
        { status: 400 }
      );
    }

    if (!['arrival', 'departure'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'type must be arrival or departure',
          },
        },
        { status: 400 }
      );
    }

    // 3. Use service role for database operations
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

    // 4. Query guests assigned to this shuttle
    const dateField = type === 'arrival' ? 'arrival_date' : 'departure_date';
    const shuttleField = type === 'arrival' ? 'arrival_shuttle' : 'departure_shuttle';
    const timeField = type === 'arrival' ? 'arrival_time' : 'departure_time';
    const airportField = type === 'arrival' ? 'arrival_airport' : 'departure_airport';
    const flightField = type === 'arrival' ? 'arrival_flight' : 'departure_flight';

    const { data: guests, error: guestError } = await serviceRoleSupabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        ${timeField},
        ${airportField},
        ${flightField},
        accommodation_id,
        accommodations (
          name,
          address
        )
      `)
      .eq(shuttleField, shuttleId)
      .eq(dateField, date)
      .order('last_name', { ascending: true });

    if (guestError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch guests for shuttle',
            details: guestError,
          },
        },
        { status: 500 }
      );
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No guests found for this shuttle',
          },
        },
        { status: 404 }
      );
    }

    // 5. Format data for driver sheet
    const driverSheet = {
      shuttleId,
      date,
      type,
      guestCount: guests.length,
      guests: guests.map(guest => ({
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        phone: guest.phone,
        time: (guest as any)[timeField],
        airport: (guest as any)[airportField],
        flight: (guest as any)[flightField],
        accommodation: guest.accommodations ? {
          name: (guest.accommodations as any).name,
          address: (guest.accommodations as any).address,
        } : null,
      })),
      // Group by time for easier scheduling
      byTime: guests.reduce((acc: any, guest: any) => {
        const time = guest[timeField] || 'No time specified';
        if (!acc[time]) {
          acc[time] = [];
        }
        acc[time].push({
          name: `${guest.first_name} ${guest.last_name}`,
          airport: guest[airportField],
          flight: guest[flightField],
          accommodation: guest.accommodations?.name || 'Not specified',
        });
        return acc;
      }, {} as Record<string, any[]>),
      // Group by airport for route planning
      byAirport: guests.reduce((acc: any, guest: any) => {
        const airport = guest[airportField] || 'No airport specified';
        if (!acc[airport]) {
          acc[airport] = [];
        }
        acc[airport].push({
          name: `${guest.first_name} ${guest.last_name}`,
          time: guest[timeField],
          flight: guest[flightField],
        });
        return acc;
      }, {} as Record<string, any[]>),
    };

    // 6. Return formatted driver sheet
    return NextResponse.json(
      {
        success: true,
        data: driverSheet,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/transportation/driver-sheets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate driver sheet',
        },
      },
      { status: 500 }
    );
  }
}
