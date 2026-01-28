import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import * as vendorService from '@/services/vendorService';

/**
 * GET /api/admin/vendors/[id]
 * 
 * Fetches a single vendor by ID.
 * Requires authentication.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Await params
    const { id } = await params;

    // 5. Call service
    const result = await vendorService.get(id);

    // 4. Return response with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }
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
 * PUT /api/admin/vendors/[id]
 * 
 * Updates an existing vendor.
 * Requires authentication.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Await params
    const { id } = await params;

    // 4. Parse and validate request body
    const body = await request.json();

    // 5. Call service
    const result = await vendorService.update(id, body);

    // 5. Return response with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = 
        result.error.code === 'VALIDATION_ERROR' ? 400 :
        result.error.code === 'NOT_FOUND' ? 404 :
        500;
      return NextResponse.json(result, { status: statusCode });
    }
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
 * DELETE /api/admin/vendors/[id]
 * 
 * Deletes a vendor by ID.
 * Requires authentication.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 2. Await params
    const { id } = await params;

    // 5. Call service
    const result = await vendorService.deleteVendor(id);

    // 4. Return response with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }
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
