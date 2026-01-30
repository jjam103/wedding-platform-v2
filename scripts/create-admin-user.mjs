#!/usr/bin/env node

/**
 * Script to create an admin user in Supabase
 * 
 * Usage:
 *   node scripts/create-admin-user.mjs your-email@example.com YourPassword123
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
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Usage: node scripts/create-admin-user.mjs <email> <password>');
  console.error('   Example: node scripts/create-admin-user.mjs admin@example.com MyPassword123');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

// Validate password strength
if (password.length < 8) {
  console.error('❌ Password must be at least 8 characters long');
  process.exit(1);
}

async function createAdminUser() {
  console.log('🔧 Creating Supabase admin client...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`📧 Creating user: ${email}`);
  
  try {
    // Create user with admin API
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.error('❌ User already exists with this email');
        console.log('\n💡 Try logging in instead, or use a different email');
      } else {
        console.error('❌ Failed to create user:', createError.message);
      }
      process.exit(1);
    }

    console.log('✅ User created successfully!');
    console.log(`   User ID: ${user.user.id}`);
    console.log(`   Email: ${user.user.email}`);
    
    console.log('\n🎉 You can now log in at:');
    console.log('   http://localhost:3000/auth/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
