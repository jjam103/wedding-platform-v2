#!/usr/bin/env node

/**
 * Script to test API authentication
 * 
 * Usage:
 *   node scripts/test-api-auth.mjs email@example.com password
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const email = process.argv[2] || 'jrnabelsohn@gmail.com';
const password = process.argv[3] || 'WeddingAdmin2026!';

async function testApiAuth() {
  console.log('🔧 Creating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`\n🔐 Logging in as: ${email}`);
  
  try {
    // Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message);
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log(`   Session token: ${authData.session.access_token.substring(0, 20)}...`);

    // Test API call with session
    console.log('\n📡 Testing API call to /api/admin/content-pages...');
    
    const response = await fetch('http://localhost:3000/api/admin/content-pages', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('   Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ API call successful!');
      console.log(`   Found ${result.data?.length || 0} content pages`);
    } else {
      console.log('\n❌ API call failed!');
      console.log(`   Error: ${result.error?.message}`);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testApiAuth();
