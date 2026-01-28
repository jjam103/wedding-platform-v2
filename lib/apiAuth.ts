import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for API routes with proper cookie handling
 */
export async function createApiClient(): Promise<SupabaseClient> {
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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * Verifies user authentication and returns user object
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await createApiClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return { user, supabase };
}

/**
 * Verifies user has admin/host role
 * Returns null if not authorized
 */
export async function getAuthorizedAdmin() {
  const auth = await getAuthenticatedUser();
  if (!auth) return null;
  
  const { user, supabase } = auth;
  
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (error || !userData || !['super_admin', 'host'].includes(userData.role)) {
    return null;
  }
  
  return { user, supabase, role: userData.role };
}
