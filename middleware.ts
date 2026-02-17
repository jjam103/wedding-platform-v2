import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware for protecting routes with authentication and role-based access control.
 * 
 * Protected routes:
 * - /admin/* - Requires owner or admin role (from admin_users table)
 * - /api/admin/* - Requires owner or admin role (from admin_users table)
 * - /guest/* - Requires valid guest session
 * - /api/guest/* - Requires valid guest session
 * 
 * Public routes:
 * - /auth/* - Authentication pages
 * - / - Home page
 * - /api/auth/* - Authentication API endpoints
 */

/**
 * Handles guest authentication by validating guest session cookie
 */
async function handleGuestAuth(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return redirectToGuestLogin(request);
    }

    // Get guest session token from cookie
    const sessionToken = request.cookies.get('guest_session')?.value;
    
    // DEBUG: Log cookie presence
    console.log('[Middleware] Guest auth check:', {
      path: pathname,
      hasCookie: !!sessionToken,
      cookieValue: sessionToken ? `${sessionToken.substring(0, 8)}...` : 'none',
      allCookies: request.cookies.getAll().map(c => c.name),
    });

    if (!sessionToken) {
      console.log('[Middleware] No guest session cookie found - redirecting to login');
      return redirectToGuestLogin(request);
    }

    // Create Supabase client with SERVICE ROLE for middleware
    // This bypasses RLS to validate sessions (standard auth pattern)
    // Use standard client (not SSR) for better connection pooling
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate session token in database
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('guest_id, expires_at')
      .eq('token', sessionToken)
      .maybeSingle();

    // DEBUG: Log database query results
    console.log('[Middleware] Session query result:', {
      sessionFound: !!session,
      hasError: !!sessionError,
      errorMessage: sessionError?.message,
      tokenPrefix: sessionToken.substring(0, 8),
    });

    if (sessionError) {
      console.log('[Middleware] Session query error:', sessionError);
      return redirectToGuestLogin(request);
    }

    // Check if session exists
    if (!session) {
      console.log('[Middleware] No session found in database for token');
      return redirectToGuestLogin(request);
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      return redirectToGuestLogin(request);
    }

    // Guest is authorized, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Guest middleware error:', error);
    return redirectToGuestLogin(request);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes (including ALL auth routes)
  // CRITICAL: /api/auth and /api/guest-auth checks must come BEFORE /api/guest check
  // because /api/auth/guest/* and /api/guest-auth/* should be public (not protected)
  if (
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||  // ✅ Allows /api/auth/* to be public
    pathname.startsWith('/api/guest-auth') ||  // ✅ Allows /api/guest-auth/* to be public (guest authentication endpoints)
    pathname.startsWith('/api/guest/references') ||  // ✅ Allows /api/guest/references/* to be public (reference previews)
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Check if route requires guest access
  // Note: /api/auth/guest/* is already allowed above, so this only catches /api/guest/* (non-auth)
  const requiresGuest = pathname.startsWith('/guest') || pathname.startsWith('/api/guest');
  
  // Check if route requires admin access
  const requiresAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // Handle guest routes
  if (requiresGuest) {
    return handleGuestAuth(request);
  }

  if (requiresAdmin) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        return redirectToLogin(request);
      }

      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      // Create Supabase client for middleware (SSR client for auth cookies)
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('[Middleware] No user found:', error?.message);
        return redirectToLogin(request);
      }

      console.log('[Middleware] User authenticated:', user.id);

      // Fetch user role from admin_users table
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('role, status')
        .eq('id', user.id)
        .single();

      console.log('[Middleware] Admin user data query result:', { userData, userError });

      if (userError || !userData) {
        console.log('[Middleware] Failed to fetch admin user role:', userError?.message);
        return redirectToUnauthorized(request);
      }

      // Check if user is active
      if (userData.status !== 'active') {
        console.log('[Middleware] Admin user is not active:', userData.status);
        return redirectToUnauthorized(request);
      }

      // Check if user has required role for admin routes
      const allowedRoles = ['owner', 'admin'];
      if (!allowedRoles.includes(userData.role)) {
        console.log('[Middleware] Admin user role not allowed:', userData.role);
        return redirectToUnauthorized(request);
      }

      console.log('[Middleware] Access granted for admin role:', userData.role);

      // User is authorized, return response with updated cookies
      return response;
    } catch (error) {
      console.error('Middleware error:', error);
      return redirectToLogin(request);
    }
  }

  // For non-admin routes, just continue
  return NextResponse.next();
}

/**
 * Redirects to login page with return URL (for page requests).
 * Returns JSON error for API requests.
 */
function redirectToLogin(request: NextRequest): NextResponse {
  // For API routes, return JSON error instead of redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Redirects to unauthorized page (for page requests).
 * Returns JSON error for API requests.
 */
function redirectToUnauthorized(request: NextRequest): NextResponse {
  // For API routes, return JSON error instead of redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    );
  }
  
  const unauthorizedUrl = new URL('/auth/unauthorized', request.url);
  return NextResponse.redirect(unauthorizedUrl);
}

/**
 * Redirects to guest login page (for page requests).
 * Returns JSON error for API requests.
 */
function redirectToGuestLogin(request: NextRequest): NextResponse {
  // For API routes, return JSON error instead of redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Guest authentication required' } },
      { status: 401 }
    );
  }
  
  const loginUrl = new URL('/auth/guest-login', request.url);
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
