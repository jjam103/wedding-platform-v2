#!/usr/bin/env node

/**
 * Script to test login credentials
 * 
 * Usage:
 *   node scripts/test-login.mjs user@example.com password123
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Usage: node scripts/test-login.mjs <email> <password>');
  console.error('   Example: node scripts/test-login.mjs admin@example.com MyPassword123');
  process.exit(1);
}

async function testLogin() {
  console.log('🔧 Creating Supabase client (using anon key)...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`\n🔐 Testing login for: ${email}`);
  console.log(`   Password length: ${password.length} characters\n`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed!');
      console.error(`   Error: ${error.message}`);
      console.error(`   Status: ${error.status}`);
      console.error(`   Name: ${error.name}`);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 Possible causes:');
        console.log('   1. Wrong password');
        console.log('   2. Email not confirmed (but check-user-status says it is)');
        console.log('   3. User account disabled');
        console.log('\n💡 To reset password, run:');
        console.log(`   node scripts/reset-user-password.mjs ${email} NewPassword123`);
      }
      
      process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Session expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testLogin();
