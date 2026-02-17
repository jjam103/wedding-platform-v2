#!/usr/bin/env node

/**
 * Simple test to verify RLS fix is working
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

console.log('Testing RLS Fix\n');

// Create service client
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Sign in as admin
console.log('1. Signing in as admin...');
const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'test-password-123',
});

if (authError) {
  console.log('❌ Auth failed:', authError.message);
  process.exit(1);
}

console.log('✅ Auth successful');
console.log('   User ID:', authData.user.id);
console.log('   Email:', authData.user.email);
console.log('');

// Create a NEW client with the session
console.log('2. Creating authenticated client...');
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${authData.session.access_token}`,
    },
  },
});

// Test query
console.log('3. Querying guests table...');
const { data: guests, error: guestsError } = await authClient
  .from('guests')
  .select('id, first_name, last_name, email')
  .limit(5);

if (guestsError) {
  console.log('❌ Query failed:', guestsError);
  process.exit(1);
}

console.log('✅ Query successful!');
console.log(`   Found ${guests.length} guests`);
if (guests.length > 0) {
  console.log('   Sample:', guests[0]);
}

console.log('\n✅ RLS fix is working!');
process.exit(0);
