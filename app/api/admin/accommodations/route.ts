import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as accommodationService from '@/services/accommodationService';
import type { CreateAccommodationDTO, AccommodationFilterDTO } from '@/schemas/accommodationSchemas';

/**
 * GET /api/admin/accommodations
 * Lists accommodations with optional filtering and pagination
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 50)
 * - locationId: string (optional)
 * - status: 'available' | 'booked' | 'unavailable' (optional)
 * 
 * Requirements: 10.1-10.7
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: Partial<AccommodationFilterDTO> = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 50,
    };

    if (searchParams.get('locationId')) {
      filters.locationId = searchParams.get('locationId')!;
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as 'draft' | 'published';
    }

    // 3. Call service
    const result = await accommodationService.listAccommodations(filters);

    // 4. Return response
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/accommodations
 * Creates a new accommodation
 * 
 * Body: CreateAccommodationDTO
 * 
 * Requirements: 10.1-10.7
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Parse and validate
    const body: CreateAccommodationDTO = await request.json();

    // 3. Call service
    const result = await accommodationService.createAccommodation(body);

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
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
