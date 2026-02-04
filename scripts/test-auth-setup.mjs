#!/usr/bin/env node

/**
 * Test Authentication Setup
 * 
 * Diagnoses authentication issues in test environment
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.test
dotenv.config({ path: join(__dirname, '..', '.env.test') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Testing Authentication Setup\n');
console.log('Environment Variables:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${url ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`);

// Check key formats
if (anonKey && !anonKey.startsWith('eyJ')) {
  console.log(`  ⚠️  ANON_KEY format: Modern (${anonKey.substring(0, 15)}...) - Should be JWT format (eyJ...)`);
} else if (anonKey) {
  console.log(`  ✅ ANON_KEY format: Legacy JWT (correct)`);
}

if (serviceKey && !serviceKey.startsWith('eyJ')) {
  console.log(`  ❌ SERVICE_ROLE_KEY format: Modern (${serviceKey.substring(0, 15)}...) - WRONG!`);
  console.log(`     Auth admin API requires legacy JWT format (starts with eyJ)`);
  console.log(`     Get it from: https://app.supabase.com/project/_/settings/api`);
  console.log(`     Click "Legacy API Keys" tab and copy the "service_role" JWT`);
} else if (serviceKey) {
  console.log(`  ✅ SERVICE_ROLE_KEY format: Legacy JWT (correct)`);
}

console.log('');

if (!url || !anonKey || !serviceKey) {
  console.error('❌ Missing required environment variables');
  console.log('\nPlease update .env.test with the correct values.');
  console.log('See AUTH_TEST_SETUP_COMPLETE_GUIDE.md for detailed instructions.');
  process.exit(1);
}

if (serviceKey && !serviceKey.startsWith('eyJ')) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY must be a JWT token (starts with eyJ)');
  console.log('\nThe auth admin API only works with legacy JWT-based service_role keys.');
  console.log('Modern sb_secret_ keys do NOT work with auth.admin.createUser()');
  console.log('\nTo fix:');
  console.log('1. Go to: https://app.supabase.com/project/_/settings/api');
  console.log('2. Click "Legacy API Keys" tab');
  console.log('3. Copy the "service_role" JWT token (starts with eyJ)');
  console.log('4. Update SUPABASE_SERVICE_ROLE_KEY in .env.test');
  console.log('\nSee AUTH_TEST_SETUP_COMPLETE_GUIDE.md for more details.');
  process.exit(1);
}

// Test 1: Create service client
console.log('Test 1: Creating service client...');
const serviceClient = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
console.log('✅ Service client created');

// Test 2: Create test user
console.log('\nTest 2: Creating test user...');
const testEmail = `test.${Date.now()}@example.com`;
const testPassword = 'test123456';

try {
  const { data: createData, error: createError } = await serviceClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });
  
  if (createError) {
    console.error('❌ Failed to create user:', createError.message);
    process.exit(1);
  }
  
  if (!createData.user) {
    console.error('❌ User creation succeeded but no user returned');
    process.exit(1);
  }
  
  console.log('✅ Test user created:', createData.user.id);
  const userId = createData.user.id;
  
  // Test 3: Sign in with test user
  console.log('\nTest 3: Signing in test user...');
  const testClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  
  if (signInError) {
    console.error('❌ Failed to sign in:', signInError.message);
    console.log('\nPossible causes:');
    console.log('  1. Email confirmation required (check Supabase auth settings)');
    console.log('  2. Password policy not met');
    console.log('  3. Auth service not enabled');
    
    // Cleanup
    await serviceClient.auth.admin.deleteUser(userId);
    process.exit(1);
  }
  
  if (!signInData.session) {
    console.error('❌ Sign in succeeded but no session returned');
    await serviceClient.auth.admin.deleteUser(userId);
    process.exit(1);
  }
  
  console.log('✅ Sign in successful');
  console.log('  User ID:', signInData.user.id);
  console.log('  Access Token:', signInData.session.access_token.substring(0, 20) + '...');
  
  // Test 4: Cleanup
  console.log('\nTest 4: Cleaning up test user...');
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
  
  if (deleteError) {
    console.error('⚠️  Failed to delete user:', deleteError.message);
  } else {
    console.log('✅ Test user deleted');
  }
  
  console.log('\n✅ All authentication tests passed!');
  console.log('\nYour test environment is properly configured.');
  
} catch (error) {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
}
