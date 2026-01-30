import { NextResponse } from 'next/server';
import { updateGroupSchema } from '@/schemas/groupSchemas';
import * as groupService from '@/services/groupService';
import { createAuthenticatedClient } from '@/lib/supabaseServer';
import { z } from 'zod';

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
 * GET /api/admin/guest-groups/[id]
 * Get a specific guest group
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
    
    // 2. Validate ID
    const validation = z.string().uuid().safeParse(params.id);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
        { status: 400 }
      );
    }
    
    // 3. Service call
    const result = await groupService.get(supabase, params.id);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('GET /api/admin/guest-groups/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/guest-groups/[id]
 * Update a guest group
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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
    
    // 2. Validate ID
    const idValidation = z.string().uuid().safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
        { status: 400 }
      );
    }
    
    // 3. Validate body
    const body = await request.json();
    const validation = updateGroupSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 4. Service call
    const result = await groupService.update(supabase, params.id, validation.data);
    
    // 5. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('PUT /api/admin/guest-groups/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/guest-groups/[id]
 * Delete a guest group
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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
    
    // 2. Validate ID
    const validation = z.string().uuid().safeParse(params.id);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
        { status: 400 }
      );
    }
    
    // 3. Service call
    const result = await groupService.deleteGroup(supabase, params.id);
    
    // 4. Response
    return NextResponse.json(result, { status: result.success ? 200 : getStatusCode(result.error.code) });
    
  } catch (error) {
    console.error('DELETE /api/admin/guest-groups/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
