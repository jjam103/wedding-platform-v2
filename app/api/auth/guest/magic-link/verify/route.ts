import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Magic Link Verification API Route
 * 
 * Verifies a magic link token, marks it as used, creates a guest session,
 * and sets an HTTP-only session cookie.
 * 
 * Requirements: 5.3, 5.9
 * Task: 6.2
 */

const verifyTokenSchema = z.object({
  token: z.string().min(64).max(64), // 32 bytes = 64 hex characters
});

/**
 * GET /api/auth/guest/magic-link/verify?token=...
 * 
 * Verifies a magic link token and creates a guest session.
 * 
 * @param request - Request containing token in query params
 * @returns Success response with guest data, or error response
 */
export async function GET(request: Request) {
  try {
    // 1. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    const validation = verifyTokenSchema.safeParse({ token });
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid token format',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    // 2. Create Supabase client
    const supabase = createSupabaseClient();
    
    // 3. Find token in database
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('magic_link_tokens')
      .select('id, guest_id, token, expires_at, used, guests(id, email, first_name, last_name, group_id)')
      .eq('token', validation.data.token)
      .single();
    
    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Invalid or expired magic link',
          },
        },
        { status: 404 }
      );
    }
    
    // 4. Check if token has already been used
    if (tokenRecord.used) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_USED',
            message: 'This magic link has already been used',
          },
        },
        { status: 409 }
      );
    }
    
    // 5. Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'This magic link has expired',
          },
        },
        { status: 410 }
      );
    }
    
    // 6. Mark token as used
    const { error: updateError } = await supabase
      .from('magic_link_tokens')
      .update({ 
        used: true,
        used_at: now.toISOString(),
      })
      .eq('id', tokenRecord.id);
    
    if (updateError) {
      console.error('Failed to mark token as used:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_ERROR',
            message: 'Failed to verify magic link',
          },
        },
        { status: 500 }
      );
    }
    
    // 7. Generate session token (32 bytes)
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 8. Create session record in database
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({
        guest_id: tokenRecord.guest_id,
        token: sessionToken,
        expires_at: sessionExpiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single();
    
    if (sessionError || !session) {
      console.error('Failed to create guest session:', sessionError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_ERROR',
            message: 'Failed to create session',
          },
        },
        { status: 500 }
      );
    }
    
    // 9. Set HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set('guest_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    // 10. Log authentication event
    await supabase.from('audit_logs').insert({
      action: 'guest_login',
      entity_type: 'guest',
      entity_id: tokenRecord.guest_id,
      details: {
        auth_method: 'magic_link',
        email: (tokenRecord.guests as any).email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });
    
    // 11. Return success response
    const guest = tokenRecord.guests as any;
    return NextResponse.json(
      {
        success: true,
        data: {
          guestId: guest.id,
          groupId: guest.group_id,
          firstName: guest.first_name,
          lastName: guest.last_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      },
      { status: 500 }
    );
  }
}
