import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import * as adminUserService from '@/services/adminUserService';

/**
 * POST /api/admin/admin-users/[id]/invite
 * Resend invitation email to admin user
 * 
 * Requirements: 3.2
 */
export async function POST(
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

    // 2. Check if user is an admin (any admin can resend invitations)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!adminUser || adminUser.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        },
        { status: 403 }
      );
    }

    // 3. Resend invitation
    const result = await adminUserService.resendInvitation(id);

    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 4. Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'admin_user_invitation_resent',
      entity_type: 'admin_user',
      entity_id: id,
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
