#!/usr/bin/env node

/**
 * Check what cookies Supabase SSR actually uses
 */

import { createServerClient } from '@supabase/ssr';

console.log('Checking Supabase SSR cookie implementation...\n');

// Create a mock request/response to see what cookies are expected
const mockCookies = new Map();

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      getAll() {
        const cookies = Array.from(mockCookies.entries()).map(([name, value]) => ({
          name,
          value,
        }));
        console.log('getAll() called, returning:', cookies);
        return cookies;
      },
      setAll(cookiesToSet) {
        console.log('setAll() called with:', cookiesToSet);
        cookiesToSet.forEach(({ name, value }) => {
          mockCookies.set(name, value);
        });
      },
    },
  }
);

// Try to get the session (will fail but show us what cookies it's looking for)
console.log('\nAttempting to get session...\n');
const { data, error } = await supabase.auth.getSession();

console.log('\nResult:');
console.log('- Data:', data);
console.log('- Error:', error);

console.log('\nCookies in map:', Array.from(mockCookies.keys()));
