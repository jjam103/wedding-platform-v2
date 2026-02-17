import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';
import { ERROR_CODES } from '@/types';

/**
 * Email Matching Authentication API Route
 * 
 * Authenticates guests by matching their login email to their guest record email.
 * Creates a guest session on successful match and sets an HTTP-only session cookie.
 * 
 * Uses service role to bypass RLS when checking credentials (standard auth pattern).
 * 
 * Requirements: 5.2, 22.4
 * Task: 5.1
 */

const emailMatchSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/guest-auth/email-match
 * 
 * Authenticates a guest using email matching.
 * 
 * @param request - Request containing email in body
 * @returns Success response with guest ID and group ID, or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Parse request body (support both FormData and JSON)
    const contentType = request.headers.get('content-type') || '';
    let email: string;
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Form submission from browser
      const formData = await request.formData();
      email = formData.get('email') as string;
    } else {
      // JSON from API/tests
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid JSON body',
            },
          },
          { status: 400 }
        );
      }
      email = body.email;
    }
    
    // 2. Validate email
    const validation = emailMatchSchema.safeParse({ email });
    
    if (!validation.success) {
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'invalid_email');
        url.searchParams.set('message', 'Invalid email format');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
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
    }
    
    // 3. Sanitize email input
    const sanitizedEmail = sanitizeInput(validation.data.email.toLowerCase());
    
    // DEBUG: Log email lookup
    console.log('[API] Looking for guest with email:', sanitizedEmail);
    
    // 4. Create Supabase client with service role (bypasses RLS for auth)
    // Use standard createClient for service role - NOT createServerClient
    // Service role bypasses ALL RLS policies and doesn't need cookies
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
    
    // 5. Find guest by email with email_matching auth method
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, email, group_id, first_name, last_name, auth_method')
      .eq('email', sanitizedEmail)
      .eq('auth_method', 'email_matching')
      .maybeSingle();
    
    // DEBUG: Log query result
    console.log('[API] Guest query result:', {
      found: !!guest,
      email: guest?.email,
      authMethod: guest?.auth_method,
      error: guestError?.message,
    });
    
    if (guestError || !guest) {
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'not_found');
        url.searchParams.set('message', 'Email not found or not configured for email matching authentication');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
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
    }
    
    // 6. Generate session token (32 bytes)
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 7. Create session record in database
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
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'session_error');
        url.searchParams.set('message', 'Failed to create session');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
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
    }
    
    // 8. Set HTTP-only session cookie
    const response = NextResponse.json({ success: true, data: { guestId: guest.id, groupId: guest.group_id } }, { status: 200 });
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    };
    
    response.cookies.set('guest_session', sessionToken, cookieOptions);
    
    // DEBUG: Log cookie setting
    console.log('[API] Setting guest session cookie:', {
      tokenPrefix: sessionToken.substring(0, 8),
      cookieOptions,
      guestId: guest.id,
      sessionId: session.id,
    });
    
    // 9. Log authentication event (fire and forget - don't block response)
    supabase.from('audit_logs').insert({
      action: 'guest_login',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        auth_method: 'email_matching',
        email: guest.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    }).then(({ error: auditError }) => {
      if (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    });
    
    // 10. Return redirect response (browser will follow with cookie)
    return response;
  } catch (error) {
    console.error('Email matching authentication error:', error);
    // Check content type for error response
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Redirect back with error for form submissions
      const url = new URL('/auth/guest-login', request.url);
      url.searchParams.set('error', 'unknown');
      url.searchParams.set('message', 'An unexpected error occurred');
      return NextResponse.redirect(url);
    } else {
      // JSON response for API calls
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
}
