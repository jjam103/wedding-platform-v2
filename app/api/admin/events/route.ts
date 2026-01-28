import { NextResponse } from 'next/server';
import * as eventService from '@/services/eventService';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

/**
 * GET /api/admin/events
 * 
 * Lists all events with optional filtering.
 * 
 * Requirements: 4.1, 4.2
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: any = {};
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('eventType')) {
      filters.eventType = searchParams.get('eventType');
    }
    if (searchParams.get('locationId')) {
      filters.locationId = searchParams.get('locationId');
    }
    if (searchParams.get('page')) {
      filters.page = parseInt(searchParams.get('page')!, 10);
    }
    if (searchParams.get('pageSize')) {
      filters.pageSize = parseInt(searchParams.get('pageSize')!, 10);
    }

    // 3. Call service
    const result = await eventService.list(filters);

    // 4. Return response
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/events
 * 
 * Creates a new event.
 * 
 * Requirements: 4.5, 4.6
 */
export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();

    // 3. Call service
    const result = await eventService.create(body);

    // 4. Return response with proper status
    if (!result.success) {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
