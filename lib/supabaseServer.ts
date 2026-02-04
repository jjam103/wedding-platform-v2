/**
 * Supabase Server Client Utilities
 * 
 * Helper functions for creating Supabase clients in Next.js 15+ API routes
 * with proper async cookies() handling.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates an authenticated Supabase client for API routes.
 * 
 * This function properly handles the Next.js 15+ async cookies() API
 * and creates a Supabase client with cookie-based authentication.
 * 
 * @returns Promise resolving to an authenticated Supabase client
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const supabase = await createAuthenticatedClient();
 *   const { data: { session } } = await supabase.auth.getSession();
 *   // ... rest of route logic
 * }
 * ```
 */
export async function createAuthenticatedClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting errors (e.g., in middleware)
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client with service role privileges.
 * 
 * IMPORTANT: This client bypasses Row Level Security (RLS) and should only be used
 * in server-side code after proper authentication and authorization checks.
 * 
 * Use this for:
 * - Admin operations that need to bypass RLS
 * - Background jobs and cron tasks
 * - Operations where RLS policies would cause circular dependencies
 * 
 * @returns Supabase client with service role privileges
 * 
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   // First verify user is authenticated and authorized
 *   const authClient = await createAuthenticatedClient();
 *   const { data: { session } } = await supabase.auth.getSession();
 *   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   
 *   // Then use service role for operations that need to bypass RLS
 *   const serviceClient = createServiceRoleClient();
 *   const { data } = await serviceClient.from('guests').select('*');
 * }
 * ```
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Service role client doesn't need cookies
      },
    },
  });
}
