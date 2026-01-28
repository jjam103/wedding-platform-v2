import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware for protecting routes with authentication and role-based access control.
 * 
 * Protected routes:
 * - /admin/* - Requires super_admin or host role
 * - /api/admin/* - Requires super_admin or host role
 * 
 * Public routes:
 * - /auth/* - Authentication pages
 * - / - Home page
 * - /api/auth/* - Authentication API endpoints
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Check if route requires admin access
  const requiresAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

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

      // Create Supabase client for middleware
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

      // Fetch user role from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      console.log('[Middleware] User data query result:', { userData, userError });

      if (userError || !userData) {
        console.log('[Middleware] Failed to fetch user role:', userError?.message);
        return redirectToUnauthorized(request);
      }

      // Check if user has required role for admin routes
      const allowedRoles = ['super_admin', 'host'];
      if (!allowedRoles.includes(userData.role)) {
        console.log('[Middleware] User role not allowed:', userData.role);
        return redirectToUnauthorized(request);
      }

      console.log('[Middleware] Access granted for role:', userData.role);

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
 * Redirects to login page with return URL.
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Redirects to unauthorized page.
 */
function redirectToUnauthorized(request: NextRequest): NextResponse {
  const unauthorizedUrl = new URL('/auth/unauthorized', request.url);
  return NextResponse.redirect(unauthorizedUrl);
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
