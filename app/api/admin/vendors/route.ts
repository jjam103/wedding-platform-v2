import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import * as vendorService from '@/services/vendorService';

/**
 * GET /api/admin/vendors
 * 
 * Fetches all vendors with optional filtering.
 * Requires authentication.
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

    // 2. Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const pricingModel = searchParams.get('pricingModel') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 3. Call service
    const result = await vendorService.list({
      category: category as any,
      pricingModel: pricingModel as any,
      paymentStatus: paymentStatus as any,
      page,
      pageSize,
    });

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
 * POST /api/admin/vendors
 * 
 * Creates a new vendor.
 * Requires authentication.
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
    const result = await vendorService.create(body);

    // 4. Return response with proper status
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
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
