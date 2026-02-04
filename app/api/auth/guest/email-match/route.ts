import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';

/**
 * Email Matching Authentication API Route
 * 
 * Authenticates guests by matching their login email to their guest record email.
 * Creates a guest session on successful match and sets an HTTP-only session cookie.
 * 
 * Requirements: 5.2, 22.4
 * Task: 5.1
 */

const emailMatchSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/auth/guest/email-match
 * 
 * Authenticates a guest using email matching.
 * 
 * @param request - Request containing email in body
 * @returns Success response with guest ID and group ID, or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = emailMatchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }
    
    // 2. Sanitize email input
    const email = sanitizeInput(validation.data.email.toLowerCase());
    
    // 3. Create Supabase client
    const supabase = createSupabaseClient();
    
    // 4. Find guest by email with email_matching auth method
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, email, group_id, first_name, last_name, auth_method')
      .eq('email', email)
      .eq('auth_method', 'email_matching')
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Email not found or not configured for email matching authentication',
          },
        },
        { status: 404 }
      );
    }
    
    // 5. Generate session token (32 bytes)
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 6. Create session record in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({
        guest_id: guest.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
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
    
    // 7. Set HTTP-only session cookie
    const cookieStore = await cookies();
    cookieStore.set('guest_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    // 8. Log authentication event
    await supabase.from('audit_logs').insert({
      action: 'guest_login',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        auth_method: 'email_matching',
        email: guest.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });
    
    // 9. Return success response
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
    console.error('Email matching authentication error:', error);
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
