import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const driverSheetsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['arrivals', 'departures']),
});

/**
 * POST /api/admin/transportation/driver-sheets
 * Generate driver sheets for a specific date
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = driverSheetsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { date, type } = validation.data;

    // 3. Query guests
    const dateField = type === 'arrivals' ? 'arrival_date' : 'departure_date';
    const timeField = type === 'arrivals' ? 'arrival_time' : 'departure_time';

    const { data: guests, error } = await supabase
      .from('guests')
      .select(`id, first_name, last_name, ${timeField}, airport_code, flight_number, phone, shuttle_assignment`)
      .eq(dateField, date)
      .not('airport_code', 'is', null)
      .order(timeField);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: error.message, details: error },
        },
        { status: 500 }
      );
    }

    // 4. Group by shuttle assignment
    const shuttleGroups = new Map<string, any[]>();
    
    guests?.forEach((guest: any) => {
      const shuttle = guest.shuttle_assignment || 'Unassigned';
      if (!shuttleGroups.has(shuttle)) {
        shuttleGroups.set(shuttle, []);
      }
      shuttleGroups.get(shuttle)!.push(guest);
    });

    // 5. Generate HTML for driver sheets
    const html = generateDriverSheetsHTML(shuttleGroups, date, type);

    return NextResponse.json({
      success: true,
      data: { html },
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

function generateDriverSheetsHTML(
  shuttleGroups: Map<string, any[]>,
  date: string,
  type: string
): string {
  const title = type === 'arrivals' ? 'Arrival' : 'Departure';
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Driver Sheets - ${title} - ${date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        .shuttle-group { page-break-after: always; margin-bottom: 40px; }
        .shuttle-group:last-child { page-break-after: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { margin-top: 20px; font-weight: bold; }
        @media print {
          .shuttle-group { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <h1>${title} Driver Sheets - ${date}</h1>
  `;

  for (const [shuttle, guests] of shuttleGroups.entries()) {
    html += `
      <div class="shuttle-group">
        <h2>Shuttle: ${shuttle}</h2>
        <p class="summary">Total Guests: ${guests.length}</p>
        <table>
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Flight</th>
              <th>Time</th>
              <th>Airport</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
    `;

    guests.forEach((guest: any) => {
      const timeField = type === 'arrivals' ? 'arrival_time' : 'departure_time';
      const time = guest[timeField] ? guest[timeField].substring(0, 5) : '-';
      
      html += `
        <tr>
          <td>${guest.first_name} ${guest.last_name}</td>
          <td>${guest.flight_number || '-'}</td>
          <td>${time}</td>
          <td>${guest.airport_code || '-'}</td>
          <td>${guest.phone || '-'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    </body>
    </html>
  `;

  return html;
}
