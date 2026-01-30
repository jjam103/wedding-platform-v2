#!/usr/bin/env node

/**
 * Script to manually confirm a user's email in Supabase
 * 
 * Usage:
 *   node scripts/confirm-user-email.mjs user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node scripts/confirm-user-email.mjs <email>');
  console.error('   Example: node scripts/confirm-user-email.mjs admin@example.com');
  process.exit(1);
}

async function confirmUserEmail() {
  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`🔍 Looking up user: ${email}\n`);
  
  try {
    // Find the user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current status: ${user.email_confirmed_at ? 'Confirmed' : 'NOT confirmed'}\n`);

    if (user.email_confirmed_at) {
      console.log('ℹ️  Email is already confirmed!');
      console.log('   If login still fails, try resetting the password:');
      console.log(`   node scripts/reset-user-password.mjs ${email} NewPassword123`);
      process.exit(0);
    }

    // Confirm the email by updating the user
    console.log('📧 Confirming email...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('❌ Failed to confirm email:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Email confirmed successfully!');
    console.log('\n🎉 You can now log in at:');
    console.log('   http://localhost:3000/auth/login');
    console.log(`   Email: ${email}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

confirmUserEmail();
