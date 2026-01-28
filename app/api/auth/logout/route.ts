import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user by terminating their session
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOGOUT_FAILED',
            message: 'Failed to logout',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, data: { message: 'Logged out successfully' } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout exception:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during logout',
        },
      },
      { status: 500 }
    );
  }
}
