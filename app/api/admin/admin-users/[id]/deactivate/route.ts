/**
 * Admin User Deactivation API Route
 * 
 * POST - Deactivate admin user
 * 
 * Requirements: 3.6, 3.8, 3.9, 3.10
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminUserService } from '@/services/adminUserService';

/**
 * POST /api/admin/admin-users/[id]/deactivate
 * Deactivate admin user
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // 2. Check if user is owner
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!adminUser || adminUser.role !== 'owner') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner role required' } },
        { status: 403 }
      );
    }

    // 3. Deactivate admin user
    const result = await adminUserService.deactivate(id);

    if (!result.success) {
      const statusCode = 
        result.error.code === 'NOT_FOUND' ? 404 :
        result.error.code === 'FORBIDDEN' ? 403 :
        500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 4. Log action in audit log
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'admin_user_deactivated',
      entity_type: 'admin_user',
      entity_id: id,
      details: { email: result.data.email },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}
