import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side operations with service role privileges.
 * 
 * IMPORTANT: This client bypasses Row Level Security (RLS).
 * Only use in server-side code after proper authentication checks.
 * 
 * Uses environment variables for configuration.
 * 
 * @returns Configured Supabase client with service role privileges
 * @throws Error if required environment variables are missing
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Singleton Supabase client instance for server-side use with service role privileges.
 * 
 * IMPORTANT: This bypasses RLS. Only use after authentication checks.
 */
export const supabase = createSupabaseClient();
