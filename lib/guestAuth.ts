import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase';
import type { Guest } from '@/types';

export interface GuestAuthResult {
  success: true;
  guest: Guest;
  sessionId: string;
}

export interface GuestAuthError {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'SESSION_EXPIRED' | 'NOT_FOUND';
    message: string;
  };
  status: 401 | 404;
}

/**
 * Validates guest authentication using custom guest session cookies.
 * 
 * This function:
 * 1. Checks for guest_session cookie
 * 2. Validates session in guest_sessions table
 * 3. Checks session expiration
 * 4. Retrieves guest data
 * 
 * @returns Guest data if authenticated, error object if not
 * 
 * @example
 * const authResult = await validateGuestAuth();
 * if (!authResult.success) {
 *   return NextResponse.json(authResult.error, { status: authResult.status });
 * }
 * const guest = authResult.guest;
 */
export async function validateGuestAuth(): Promise<GuestAuthResult | GuestAuthError> {
  try {
    // 1. Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('guest_session')?.value;
    
    if (!sessionToken) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        status: 401,
      };
    }
    
    // 2. Create service role client (bypasses RLS)
    const supabase = createSupabaseClient();
    
    // 3. Validate session in database
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('guest_id, expires_at, id')
      .eq('token', sessionToken)
      .single();
    
    if (sessionError || !session) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid session',
        },
        status: 401,
      };
    }
    
    // 4. Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session expired',
        },
        status: 401,
      };
    }
    
    // 5. Get guest data
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', session.guest_id)
      .single();
    
    if (guestError || !guest) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Guest not found',
        },
        status: 404,
      };
    }
    
    return {
      success: true,
      guest: guest as Guest,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Guest auth validation error:', error);
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
      status: 401,
    };
  }
}
