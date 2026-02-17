#!/usr/bin/env node

/**
 * Diagnostic script to investigate email composer guest loading issue
 * 
 * This script will:
 * 1. Check if guests exist in the database
 * 2. Test the guest query with admin credentials
 * 3. Check RLS policies on guests table
 * 4. Verify the API endpoint returns data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔍 Email Composer Guest Loading Diagnostic\n');

// Test 1: Check guests with service role (bypasses RLS)
console.log('📊 Test 1: Checking guests with service role...');
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const { data: allGuests, error: serviceError } = await serviceClient
  .from('guests')
  .select('id, first_name, last_name, email, group_id')
  .limit(10);

if (serviceError) {
  console.error('❌ Service role query failed:', serviceError);
} else {
  console.log(`✅ Found ${allGuests?.length || 0} guests with service role`);
  if (allGuests && allGuests.length > 0) {
    console.log('   Sample guest:', allGuests[0]);
  }
}

// Test 2: Check guests with anon key (respects RLS)
console.log('\n📊 Test 2: Checking guests with anon key (no auth)...');
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const { data: anonGuests, error: anonError } = await anonClient
  .from('guests')
  .select('id, first_name, last_name, email, group_id')
  .limit(10);

if (anonError) {
  console.error('❌ Anon query failed:', anonError);
} else {
  console.log(`✅ Found ${anonGuests?.length || 0} guests with anon key (no auth)`);
}

// Test 3: Authenticate as admin and check guests
console.log('\n📊 Test 3: Authenticating as admin...');
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';

const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});

let adminGuests = null;

if (authError) {
  console.error('❌ Admin authentication failed:', authError);
} else {
  console.log('✅ Admin authenticated successfully');
  console.log('   User ID:', authData.user?.id);
  console.log('   Email:', authData.user?.email);
  console.log('   Access Token:', authData.session?.access_token ? 'Present' : 'Missing');
  
  // Test 4: Check guests with authenticated admin
  console.log('\n📊 Test 4: Checking guests with authenticated admin...');
  const { data: guestsData, error: adminGuestsError } = await anonClient
    .from('guests')
    .select('id, first_name, last_name, email, group_id')
    .limit(10);
  
  adminGuests = guestsData;
  
  if (adminGuestsError) {
    console.error('❌ Admin guest query failed:', adminGuestsError);
  } else {
    console.log(`✅ Found ${adminGuests?.length || 0} guests with authenticated admin`);
    if (adminGuests && adminGuests.length > 0) {
      console.log('   Sample guest:', adminGuests[0]);
    }
  }
}

// Test 5: Check RLS policies on guests table
console.log('\n📊 Test 5: Checking RLS policies on guests table...');
const { data: policies, error: policiesError } = await serviceClient
  .from('pg_policies')
  .select('*')
  .eq('tablename', 'guests');

if (policiesError) {
  console.error('❌ Failed to fetch RLS policies:', policiesError);
} else {
  console.log(`✅ Found ${policies?.length || 0} RLS policies on guests table`);
  if (policies && policies.length > 0) {
    policies.forEach(policy => {
      console.log(`\n   Policy: ${policy.policyname}`);
      console.log(`   Command: ${policy.cmd}`);
      console.log(`   Roles: ${policy.roles}`);
      console.log(`   Using: ${policy.qual || 'N/A'}`);
      console.log(`   With Check: ${policy.with_check || 'N/A'}`);
    });
  }
}

// Test 6: Test the API endpoint
console.log('\n📊 Test 6: Testing /api/admin/guests endpoint...');
if (authData?.session?.access_token) {
  try {
    const response = await fetch('http://localhost:3000/api/admin/guests?format=simple', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}`,
      },
    });
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('   Error:', errorText);
    } else {
      const apiData = await response.json();
      console.log(`✅ API returned ${apiData?.data?.length || 0} guests`);
      if (apiData?.data && apiData.data.length > 0) {
        console.log('   Sample guest:', apiData.data[0]);
      } else {
        console.log('   ⚠️  API returned success but no guests');
      }
    }
  } catch (error) {
    console.error('❌ API request failed:', error.message);
  }
} else {
  console.log('⏭️  Skipping API test (no auth token)');
}

// Test 7: Check if admin user has proper role
console.log('\n📊 Test 7: Checking admin user role...');
const { data: adminUser, error: adminUserError } = await serviceClient
  .from('admin_users')
  .select('*')
  .eq('email', adminEmail)
  .single();

if (adminUserError) {
  console.error('❌ Failed to fetch admin user:', adminUserError);
} else {
  console.log('✅ Admin user found:');
  console.log('   ID:', adminUser.id);
  console.log('   Email:', adminUser.email);
  console.log('   Role:', adminUser.role);
  console.log('   Active:', adminUser.is_active);
}

console.log('\n✅ Diagnostic complete!');
console.log('\n📋 Summary:');
console.log('   - Service role can access guests:', allGuests && allGuests.length > 0 ? '✅' : '❌');
console.log('   - Anon key can access guests (no auth):', anonGuests && anonGuests.length > 0 ? '✅' : '❌');
console.log('   - Admin can authenticate:', authData?.user ? '✅' : '❌');
console.log('   - Admin can access guests:', adminGuests && adminGuests.length > 0 ? '✅' : '❌');
console.log('   - RLS policies exist:', policies && policies.length > 0 ? '✅' : '❌');

process.exit(0);
