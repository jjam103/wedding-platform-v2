import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as adminUserService from '@/services/adminUserService';

/**
 * PUT /api/admin/admin-users/[id]
 * Update an admin user
 * 
 * Requirements: 3.4, 3.9
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Check authentication
    const supabase = createRouteHandlerClient({ cookies });
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

    // 2. Check if user is an owner
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!adminUser || adminUser.role !== 'owner' || adminUser.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Owner access required' },
        },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();

    // 4. Update admin user
    const result = await adminUserService.update(id, body);

    if (!result.success) {
      const statusCode =
        result.error.code === 'VALIDATION_ERROR'
          ? 400
          : result.error.code === 'NOT_FOUND'
          ? 404
          : result.error.code === 'FORBIDDEN'
          ? 403
          : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 5. Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'admin_user_updated',
      entity_type: 'admin_user',
      entity_id: id,
      details: body,
    });

    return NextResponse.json(result);
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

/**
 * DELETE /api/admin/admin-users/[id]
 * Delete an admin user
 * 
 * Requirements: 3.7, 3.9, 3.10
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const { id } = await params;
    
    // 1. Check authentication
    const supabase = createRouteHandlerClient({ cookies });
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

    // 2. Check if user is an owner
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!adminUser || adminUser.role !== 'owner' || adminUser.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Owner access required' },
        },
        { status: 403 }
      );
    }

    // 3. Get user being deleted for audit log
    const userResult = await adminUserService.get(id);
    const deletedUserEmail = userResult.success ? userResult.data.email : 'unknown';

    // 4. Delete admin user
    const result = await adminUserService.deleteUser(id);

    if (!result.success) {
      const statusCode =
        result.error.code === 'NOT_FOUND'
          ? 404
          : result.error.code === 'FORBIDDEN'
          ? 403
          : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 5. Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'admin_user_deleted',
      entity_type: 'admin_user',
      entity_id: id,
      details: {
        email: deletedUserEmail,
      },
    });

    return NextResponse.json(result);
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
