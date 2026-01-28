import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side operations.
 * Uses environment variables for configuration.
 * 
 * @returns Configured Supabase client
 * @throws Error if required environment variables are missing
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton Supabase client instance for server-side use.
 */
export const supabase = createSupabaseClient();
