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
