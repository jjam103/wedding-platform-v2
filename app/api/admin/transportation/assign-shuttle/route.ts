import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const assignShuttleSchema = z.object({
  guestIds: z.array(z.string().uuid()).min(1, 'At least one guest ID is required'),
  shuttleId: z.string().min(1, 'Shuttle ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['arrival', 'departure']),
});

/**
 * POST /api/admin/transportation/assign-shuttle
 * Assign guests to a shuttle for a specific date
 * 
 * Body:
 * - guestIds: string[] - Array of guest UUIDs
 * - shuttleId: string - Shuttle identifier
 * - date: string - YYYY-MM-DD format
 * - type: 'arrival' | 'departure'
 */
export async function POST(request: Request) {
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

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = assignShuttleSchema.safeParse(body);

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

    const { guestIds, shuttleId, date, type } = validation.data;

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

    // 4. Verify guests exist and have the correct date
    const dateField = type === 'arrival' ? 'arrival_date' : 'departure_date';
    const { data: guests, error: guestError } = await serviceRoleSupabase
      .from('guests')
      .select('id, first_name, last_name')
      .in('id', guestIds)
      .eq(dateField, date);

    if (guestError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to verify guests',
            details: guestError,
          },
        },
        { status: 500 }
      );
    }

    if (!guests || guests.length !== guestIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Some guests not found or do not have the specified date',
          },
        },
        { status: 400 }
      );
    }

    // 5. Check if guest_shuttles table exists, if not create assignments in metadata
    // For now, we'll store shuttle assignments in the guests table metadata
    // This is a temporary solution until guest_shuttles table is created
    
    const shuttleField = type === 'arrival' ? 'arrival_shuttle' : 'departure_shuttle';
    
    // Update each guest with shuttle assignment
    const updates = guestIds.map(guestId => 
      serviceRoleSupabase
        .from('guests')
        .update({ [shuttleField]: shuttleId })
        .eq('id', guestId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to assign some guests to shuttle',
            details: errors.map(e => e.error),
          },
        },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          shuttleId,
          date,
          type,
          assignedCount: guestIds.length,
          guestIds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/admin/transportation/assign-shuttle error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to assign shuttle',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/transportation/assign-shuttle
 * Remove shuttle assignments for guests
 * 
 * Body:
 * - guestIds: string[] - Array of guest UUIDs
 * - type: 'arrival' | 'departure'
 */
export async function DELETE(request: Request) {
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

    // 2. Parse request body
    const body = await request.json();
    const { guestIds, type } = body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Guest IDs array is required',
          },
        },
        { status: 400 }
      );
    }

    if (!type || !['arrival', 'departure'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Type must be arrival or departure',
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

    // 4. Remove shuttle assignments
    const shuttleField = type === 'arrival' ? 'arrival_shuttle' : 'departure_shuttle';
    
    const { error: updateError } = await serviceRoleSupabase
      .from('guests')
      .update({ [shuttleField]: null })
      .in('id', guestIds);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to remove shuttle assignments',
            details: updateError,
          },
        },
        { status: 500 }
      );
    }

    // 5. Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          removedCount: guestIds.length,
          guestIds,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/admin/transportation/assign-shuttle error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to remove shuttle assignments',
        },
      },
      { status: 500 }
    );
  }
}
