import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyMagicLinkToken } from '@/services/magicLinkService';
import { createSupabaseClient } from '@/lib/supabase';
import { ERROR_CODES } from '@/types';

/**
 * Magic Link Verification API Route
 * 
 * Verifies a magic link token and creates a guest session.
 * 
 * Requirements: 5.3, 5.9
 * Task: 6.2
 */

const verifySchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid token format'),
});

/**
 * POST /api/guest-auth/magic-link/verify
 * 
 * Verifies a magic link token and creates a session.
 * 
 * @param request - Request containing token in body
 * @returns Success response with guest data or error response
 */
export async function POST(request: Request) {
  try {
    // 1. Parse request body (support both FormData and JSON)
    const contentType = request.headers.get('content-type') || '';
    let token: string;
    
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Form submission from browser
      const formData = await request.formData();
      token = formData.get('token') as string;
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
      token = body.token;
    }
    
    // 2. VALIDATE token format
    const validation = verifySchema.safeParse({ token });
    
    if (!validation.success) {
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login/verify', request.url);
        url.searchParams.set('error', 'invalid_token');
        url.searchParams.set('message', 'Invalid token format');
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
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
    }

    // 3. DELEGATE to service - Verify token
    const verifyResult = await verifyMagicLinkToken(validation.data.token);

    if (!verifyResult.success) {
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        // Keep error codes as-is (uppercase) for proper mapping on frontend
        const url = new URL('/auth/guest-login/verify', request.url);
        url.searchParams.set('error', verifyResult.error.code);
        url.searchParams.set('message', verifyResult.error.message);
        return NextResponse.redirect(url);
      } else {
        // JSON response for API calls
        const statusCode = getStatusCode(verifyResult.error.code);
        return NextResponse.json(verifyResult, { status: statusCode });
      }
    }

    // 4. Create guest session
    const supabase = createSupabaseClient();
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({
        guest_id: verifyResult.data.guestId,
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Failed to create guest session:', sessionError);
      // Check if this is a form submission or API call
      if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Redirect back with error for form submissions
        const url = new URL('/auth/guest-login/verify', request.url);
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

    // 5. Set HTTP-only session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/guest/dashboard', request.url));
    
    response.cookies.set('guest_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // 6. Log successful login (don't await, don't fail on error)
    supabase.from('audit_logs').insert({
      action: 'guest_login',
      entity_type: 'guest',
      entity_id: verifyResult.data.guestId,
      details: {
        auth_method: 'magic_link',
        email: verifyResult.data.email,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    }).then(({ error: auditError }) => {
      if (auditError) {
        console.error('Failed to log audit event:', auditError);
      }
    });

    // 7. RESPOND with redirect (browser will follow with cookie)
    return response;
  } catch (error) {
    console.error('Magic link verification error:', {
      path: request.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Check content type for error response
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      // Redirect back with error for form submissions
      const url = new URL('/auth/guest-login/verify', request.url);
      url.searchParams.set('error', 'unknown');
      url.searchParams.set('message', 'An unexpected error occurred');
      return NextResponse.redirect(url);
    } else {
      // JSON response for API calls
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
}

/**
 * Generates a cryptographically secure session token
 */
function generateSessionToken(): string {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(tokenBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCode(errorCode: string): number {
  const statusMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'INVALID_TOKEN': 400,
    'TOKEN_USED': 400,
    'TOKEN_EXPIRED': 400,
    'NOT_FOUND': 404,
    'DATABASE_ERROR': 500,
    'SESSION_ERROR': 500,
    'UNKNOWN_ERROR': 500,
  };
  
  return statusMap[errorCode] || 500;
}
