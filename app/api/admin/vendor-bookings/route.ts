import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { createVendorBookingSchema } from '@/schemas/vendorBookingSchemas';
import * as vendorBookingService from '@/services/vendorBookingService';

function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'DATABASE_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  return statusMap[errorCode] || 500;
}

/**
 * GET /api/admin/vendor-bookings
 * List all vendor bookings
 */
export async function GET(request: Request) {
  try {
    // 1. Authentication
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Service call
    const result = await vendorBookingService.list();
    
    // 3. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('GET /api/admin/vendor-bookings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vendor-bookings
 * Create a new vendor booking
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Validation
    const body = await request.json();
    const validation = createVendorBookingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 3. Service call
    const result = await vendorBookingService.create(validation.data);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 201 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('POST /api/admin/vendor-bookings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
