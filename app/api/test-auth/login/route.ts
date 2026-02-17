/**
 * Test Authentication Endpoint
 * 
 * ONLY FOR E2E TESTING - Creates authenticated session for test users
 * This endpoint should be disabled in production
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Only allow in test environment
  if (process.env.NODE_ENV === 'production' && !process.env.E2E_TEST_MODE) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Test endpoint not available in production' } },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } },
        { status: 400 }
      );
    }

    // Create Supabase client with cookies (await required in Next.js 16)
    const supabase = createRouteHandlerClient({ cookies });

    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: error.message } },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'No session created' } },
        { status: 401 }
      );
    }

    // Session cookies are automatically set by createRouteHandlerClient
    // Return success with user info
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}
