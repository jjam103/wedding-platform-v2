import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { updateVendorBookingSchema } from '@/schemas/vendorBookingSchemas';
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
 * GET /api/admin/vendor-bookings/[id]
 * Get a single vendor booking
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // 2. Get ID from params
    const { id } = await params;
    
    // 3. Service call
    const result = await vendorBookingService.get(id);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('GET /api/admin/vendor-bookings/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/vendor-bookings/[id]
 * Update a vendor booking
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // 2. Get ID from params
    const { id } = await params;
    
    // 3. Validation
    const body = await request.json();
    const validation = updateVendorBookingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 4. Service call
    const result = await vendorBookingService.update(id, validation.data);
    
    // 5. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('PUT /api/admin/vendor-bookings/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vendor-bookings/[id]
 * Delete a vendor booking
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // 2. Get ID from params
    const { id } = await params;
    
    // 3. Service call
    const result = await vendorBookingService.deleteBooking(id);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('DELETE /api/admin/vendor-bookings/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
