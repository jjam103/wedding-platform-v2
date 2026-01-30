#!/usr/bin/env node

/**
 * Script to reset a user's password in Supabase
 * 
 * Usage:
 *   node scripts/reset-user-password.mjs user@example.com NewPassword123
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
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ Usage: node scripts/reset-user-password.mjs <email> <new-password>');
  console.error('   Example: node scripts/reset-user-password.mjs admin@example.com NewPassword123');
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error('❌ Password must be at least 8 characters long');
  process.exit(1);
}

async function resetPassword() {
  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`🔍 Looking up user: ${email}`);
  
  try {
    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('\n💡 Available users:');
      users.users.forEach(u => console.log(`   - ${u.email}`));
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.id}`);
    console.log(`🔐 Resetting password...`);

    // Update user password
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Failed to reset password:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Password reset successfully!');
    console.log('\n🎉 You can now log in at:');
    console.log('   http://localhost:3000/auth/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

resetPassword();
