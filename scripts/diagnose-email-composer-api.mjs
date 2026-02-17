#!/usr/bin/env node

/**
 * Diagnostic script to test email composer guest loading
 * Tests the /api/admin/guests?format=simple endpoint
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment
dotenv.config({ path: join(__dirname, '../.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Email Composer API Diagnostic\n');
console.log('Environment Check:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');
console.log('- Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING');
console.log('');

// Test 1: Direct database query with service role
console.log('Test 1: Direct database query (service role)');
console.log('='.repeat(50));

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const { data: guestsService, error: errorService, count: countService } = await serviceClient
  .from('guests')
  .select('*', { count: 'exact' });

console.log('Result:');
console.log('- Error:', errorService);
console.log('- Count:', countService);
console.log('- Guests:', guestsService ? guestsService.length : 0);
if (guestsService && guestsService.length > 0) {
  console.log('- Sample guest:', {
    id: guestsService[0].id,
    first_name: guestsService[0].first_name,
    last_name: guestsService[0].last_name,
    email: guestsService[0].email,
  });
}
console.log('');

// Test 2: Authenticated query (simulating admin user)
console.log('Test 2: Authenticated query (admin user)');
console.log('='.repeat(50));

// Sign in as admin
const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'test-password-123',
});

if (authError) {
  console.log('❌ Auth failed:', authError.message);
} else {
  console.log('✅ Auth successful');
  console.log('- User ID:', authData.user.id);
  console.log('- Email:', authData.user.email);
  
  // Create authenticated client
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });
  
  const { data: guestsAuth, error: errorAuth, count: countAuth } = await authClient
    .from('guests')
    .select('*', { count: 'exact' });
  
  console.log('Result:');
  console.log('- Error:', errorAuth);
  console.log('- Count:', countAuth);
  console.log('- Guests:', guestsAuth ? guestsAuth.length : 0);
  if (guestsAuth && guestsAuth.length > 0) {
    console.log('- Sample guest:', {
      id: guestsAuth[0].id,
      first_name: guestsAuth[0].first_name,
      last_name: guestsAuth[0].last_name,
      email: guestsAuth[0].email,
    });
  }
}
console.log('');

// Test 3: Check RLS policies
console.log('Test 3: RLS Policy Check');
console.log('='.repeat(50));

const { data: policies, error: policiesError } = await serviceClient
  .from('pg_policies')
  .select('*')
  .eq('tablename', 'guests');

if (policiesError) {
  console.log('❌ Failed to fetch policies:', policiesError.message);
} else {
  console.log(`Found ${policies.length} RLS policies for guests table:`);
  policies.forEach(policy => {
    console.log(`- ${policy.policyname} (${policy.cmd}): ${policy.qual || 'N/A'}`);
  });
}
console.log('');

// Test 4: Simulate API call
console.log('Test 4: Simulate API Call');
console.log('='.repeat(50));

try {
  const response = await fetch('http://localhost:3000/api/admin/guests?format=simple', {
    headers: {
      'Cookie': authData?.session ? `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}` : '',
    },
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const data = await response.json();
  console.log('Response body:', JSON.stringify(data, null, 2));
  
  if (data.success && Array.isArray(data.data)) {
    console.log(`✅ API returned ${data.data.length} guests`);
  } else {
    console.log('❌ API did not return guests array');
  }
} catch (error) {
  console.log('❌ API call failed:', error.message);
  console.log('Note: Make sure Next.js dev server is running on http://localhost:3000');
}
console.log('');

console.log('Diagnostic complete!');
process.exit(0);
