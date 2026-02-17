import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Guest Logout API Route
 * 
 * Logs out a guest by deleting their session and clearing the session cookie.
 * 
 * Requirements: 5.10
 * Task: 7.4
 */

/**
 * POST /api/guest-auth/logout
 * 
 * Logs out the current guest session.
 * 
 * @param request - Request with guest_session cookie
 * @returns Success response or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Get session token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...values] = c.split('=');
        return [key, values.join('=')];
      })
    );
    
    const sessionToken = cookies['guest_session'];
    
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No active session found',
          },
        },
        { status: 401 }
      );
    }
    
    // 2. Create Supabase client with service role to delete session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // 3. Get guest ID from session before deleting
    const { data: session } = await supabase
      .from('guest_sessions')
      .select('guest_id')
      .eq('token', sessionToken)
      .single();
    
    const guestId = session?.guest_id;
    
    // 4. Delete session from database
    const { error: deleteError } = await supabase
      .from('guest_sessions')
      .delete()
      .eq('token', sessionToken);
    
    if (deleteError) {
      console.error('Failed to delete guest session:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete session',
          },
        },
        { status: 500 }
      );
    }
    
    // 5. Log logout event (fire and forget - don't block response)
    if (guestId) {
      supabase.from('audit_logs').insert({
        action: 'guest_logout',
        entity_type: 'guest',
        entity_id: guestId,
        details: {
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
        },
      }).then(({ error: auditError }) => {
        if (auditError) {
          console.error('Failed to log audit event:', auditError);
        }
      });
    }
    
    // 6. Clear session cookie and return success
    const response = NextResponse.json(
      { success: true, data: { message: 'Logged out successfully' } },
      { status: 200 }
    );
    
    // Clear the cookie by setting it with maxAge: 0
    response.cookies.set('guest_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Guest logout error:', error);
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
