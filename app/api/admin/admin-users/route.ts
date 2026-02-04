import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import * as adminUserService from '@/services/adminUserService';

/**
 * GET /api/admin/admin-users
 * List all admin users
 * 
 * Requirements: 3.5
 */
export async function GET() {
  try {
    // 1. Check authentication
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

    // 2. Check if user is an admin
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

    // 3. Get all admin users
    const result = await adminUserService.list();

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

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
 * POST /api/admin/admin-users
 * Create a new admin user
 * 
 * Requirements: 3.1, 3.2, 3.4, 3.9
 */
export async function POST(request: Request) {
  try {
    // 1. Check authentication
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

    // 4. Create admin user
    const result = await adminUserService.create(body, session.user.id);

    if (!result.success) {
      const statusCode =
        result.error.code === 'VALIDATION_ERROR'
          ? 400
          : result.error.code === 'CONFLICT'
          ? 409
          : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    // 5. Log audit entry
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'admin_user_created',
      entity_type: 'admin_user',
      entity_id: result.data.id,
      details: {
        email: result.data.email,
        role: result.data.role,
      },
    });

    return NextResponse.json(result, { status: 201 });
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
