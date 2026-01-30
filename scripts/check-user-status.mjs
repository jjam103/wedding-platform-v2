#!/usr/bin/env node

/**
 * Script to check user status in Supabase
 * 
 * Usage:
 *   node scripts/check-user-status.mjs user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/check-user-status.mjs <email>');
  console.error('   Example: node scripts/check-user-status.mjs admin@example.com');
  process.exit(1);
}

async function checkUserStatus() {
  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`🔍 Looking up user: ${email}\n`);
  
  try {
    // List all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}\n`);
      console.log('💡 Available users:');
      users.users.forEach(u => {
        console.log(`   - ${u.email} (${u.email_confirmed_at ? 'confirmed' : 'NOT confirmed'})`);
      });
      process.exit(1);
    }

    console.log('✅ User found!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? '✅ YES' : '❌ NO'}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);
    console.log(`   Phone: ${user.phone || 'None'}`);
    
    if (!user.email_confirmed_at) {
      console.log('\n⚠️  EMAIL NOT CONFIRMED!');
      console.log('   This is why login is failing.');
      console.log('\n💡 To fix this, run:');
      console.log(`   node scripts/confirm-user-email.mjs ${email}`);
    } else {
      console.log('\n✅ Email is confirmed - user should be able to log in');
      console.log('   If login still fails, the password might be incorrect');
      console.log('\n💡 To reset password, run:');
      console.log(`   node scripts/reset-user-password.mjs ${email} NewPassword123`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

checkUserStatus();
