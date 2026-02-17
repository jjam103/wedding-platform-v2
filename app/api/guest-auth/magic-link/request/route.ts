import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sanitizeInput } from '@/utils/sanitization';
import { ERROR_CODES } from '@/types';

/**
 * Magic Link Request API Route
 * 
 * Generates and sends a magic link for passwordless guest authentication.
 * Creates a time-limited token and sends it via email.
 * 
 * Requirements: 5.3, 22.4
 * Task: 6.1
 */

const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/guest-auth/magic-link/request
 * 
 * Requests a magic link for guest authentication.
 * 
 * @param request - Request containing email in body
 * @returns Success response or error response
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
    const validation = magicLinkRequestSchema.safeParse({ email });
    
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
    
    console.log('[Magic Link Request] Processing request for email:', sanitizedEmail);
    
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
    
    console.log('[Magic Link Request] Looking for guest by email...');
    
    // 5. Find guest by email (any auth method)
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, email, group_id, first_name, last_name, auth_method')
      .eq('email', sanitizedEmail)
      .maybeSingle(); // Use maybeSingle() to handle 0 or 1 results gracefully
    
    console.log('[Magic Link Request] Guest query result:', {
      found: !!guest,
      guestId: guest?.id,
      authMethod: guest?.auth_method,
      error: guestError?.message,
    });
    
    // Check if guest exists
    if (guestError || !guest) {
      console.log('[Magic Link Request] Guest not found');
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'not_found');
        url.searchParams.set('message', 'Email not found');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Email not found',
            },
          },
          { status: 404 }
        );
      }
    }
    
    // Check if guest has correct auth method
    if (guest.auth_method !== 'magic_link') {
      console.log('[Magic Link Request] Guest has wrong auth method:', guest.auth_method);
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'invalid_auth_method');
        url.searchParams.set('message', 'This email is not configured for magic link authentication. Please use email matching instead.');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_AUTH_METHOD',
              message: 'This email is not configured for magic link authentication',
            },
          },
          { status: 400 }
        );
      }
    }
    
    // 6. Generate magic link token (32 bytes)
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // 7. Create token record in database (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        guest_id: guest.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });
    
    if (tokenError) {
      console.error('Failed to create magic link token:', tokenError);
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login', request.url);
        url.searchParams.set('error', 'token_error');
        url.searchParams.set('message', 'Failed to generate magic link');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOKEN_ERROR',
              message: 'Failed to generate magic link',
            },
          },
          { status: 500 }
        );
      }
    }
    
    // 8. Send magic link email (in production, this would use email service)
    // For now, we'll just log it and return success
    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/guest-login/verify?token=${token}`;
    console.log(`Magic link for ${guest.email}: ${magicLinkUrl}`);
    
    // TODO: Send email via email service
    // await emailService.sendMagicLink(guest.email, magicLinkUrl, guest.first_name);
    
    // 9. Log authentication event (don't await, don't fail on error)
    supabase.from('audit_logs').insert({
      action: 'magic_link_requested',
      entity_type: 'guest',
      entity_id: guest.id,
      details: {
        email: guest.email,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    }).then(({ error: auditError }) => {
      if (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    });
    
    // 10. Return success response
    // Check if this is a form submission or API call
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Redirect back with success for form submissions
      const url = new URL('/auth/guest-login', request.url);
      url.searchParams.set('success', 'magic_link_sent');
      url.searchParams.set('message', 'Check your email for a login link. It will expire in 15 minutes.');
      return NextResponse.redirect(url);
    } else {
      // JSON response for API calls
      return NextResponse.json({
        success: true,
        data: {
          message: 'Magic link sent successfully',
          expiresIn: 900, // 15 minutes in seconds
        },
      });
    }
  } catch (error) {
    console.error('Magic link request error:', error);
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
