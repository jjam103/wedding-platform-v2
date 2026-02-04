import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/admin-users/current
 * 
 * Returns the current admin user's role
 */
export async function GET() {
  try {
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

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user role from admin_users table
    const { data: adminUser, error: dbError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !adminUser) {
      // Default to 'admin' if not found in admin_users table
      return NextResponse.json({
        success: true,
        data: { role: 'admin' },
      });
    }

    return NextResponse.json({
      success: true,
      data: { role: adminUser.role },
    });
  } catch (error) {
    console.error('Current Admin User API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get current user' } },
      { status: 500 }
    );
  }
}
