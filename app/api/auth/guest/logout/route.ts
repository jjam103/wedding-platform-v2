import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Guest Logout API Route
 * 
 * Logs out a guest by invalidating their session and clearing the session cookie.
 * 
 * Requirements: 5.7
 * Task: Phase 1 - Guest Authentication
 */

/**
 * POST /api/auth/guest/logout
 * 
 * Logs out the current guest session.
 * 
 * @param request - Request object
 * @returns Success response or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Get session cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('guest_session')?.value;

    if (!sessionToken) {
      // No session to logout
      return NextResponse.json(
        {
          success: true,
          data: { message: 'No active session' },
        },
        { status: 200 }
      );
    }

    // 2. Find and invalidate session
    const supabase = createSupabaseClient();
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('guest_id')
      .eq('token', sessionToken)
      .single();

    if (!sessionError && session) {
      // Delete the session
      await supabase
        .from('guest_sessions')
        .delete()
        .eq('token', sessionToken);

      // Log logout event
      try {
        await supabase.from('audit_logs').insert({
          action: 'guest_logout',
          entity_type: 'guest',
          entity_id: session.guest_id,
          details: {
            ip_address: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
          },
        });
      } catch (err) {
        console.error('Failed to log audit event:', err);
        // Don't fail the request if audit logging fails
      }
    }

    // 3. Clear session cookie
    cookieStore.delete('guest_session');

    // 4. Return success
    return NextResponse.json(
      {
        success: true,
        data: { message: 'Logged out successfully' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', {
      path: request.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
