import { NextResponse } from 'next/server';
import { createGroupSchema } from '@/schemas/groupSchemas';
import * as groupService from '@/services/groupService';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

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
 * GET /api/admin/guest-groups
 * List all guest groups
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
    const result = await groupService.list();
    
    // 3. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('GET /api/admin/guest-groups error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/guest-groups
 * Create a new guest group
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
    const validation = createGroupSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 3. Service call
    const result = await groupService.create(validation.data);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 201 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('POST /api/admin/guest-groups error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
