#!/usr/bin/env node

/**
 * Verify E2E Admin User
 * 
 * Checks if the admin user exists in the E2E test database
 * and has the correct configuration.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'admin123456';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔍 Verifying E2E Admin User');
console.log(`   Email: ${adminEmail}`);
console.log(`   Database: ${supabaseUrl}`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  try {
    // Step 1: Check if auth user exists
    console.log('1️⃣  Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('   ❌ Error listing auth users:', authError.message);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === adminEmail);
    
    if (!authUser) {
      console.log(`   ❌ Auth user not found: ${adminEmail}`);
      console.log('   💡 Run: node scripts/create-e2e-admin-user.mjs');
      return;
    }
    
    console.log(`   ✅ Auth user exists: ${authUser.id}`);
    console.log(`      Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`      Created: ${authUser.created_at}`);
    console.log('');
    
    // Step 2: Check if admin_users record exists
    console.log('2️⃣  Checking admin_users table...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (adminError) {
      console.log(`   ❌ Admin user record not found: ${adminError.message}`);
      console.log('   💡 Run: node scripts/create-e2e-admin-user.mjs');
      return;
    }
    
    console.log(`   ✅ Admin user record exists`);
    console.log(`      Role: ${adminUser.role}`);
    console.log(`      Status: ${adminUser.status}`);
    console.log(`      Email: ${adminUser.email}`);
    console.log('');
    
    // Step 3: Verify role and status
    console.log('3️⃣  Verifying configuration...');
    
    const issues = [];
    
    if (adminUser.role !== 'owner' && adminUser.role !== 'admin') {
      issues.push(`Invalid role: ${adminUser.role} (should be 'owner' or 'admin')`);
    }
    
    if (adminUser.status !== 'active') {
      issues.push(`Invalid status: ${adminUser.status} (should be 'active')`);
    }
    
    if (!authUser.email_confirmed_at) {
      issues.push('Email not confirmed');
    }
    
    if (issues.length > 0) {
      console.log('   ❌ Configuration issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('   💡 Run: node scripts/fix-e2e-admin-user.mjs');
      return;
    }
    
    console.log('   ✅ Configuration is correct');
    console.log('');
    
    // Step 4: Test authentication
    console.log('4️⃣  Testing authentication...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (signInError) {
      console.log(`   ❌ Authentication failed: ${signInError.message}`);
      console.log('   💡 Password may be incorrect. Run: node scripts/reset-e2e-admin-password.mjs');
      return;
    }
    
    console.log('   ✅ Authentication successful');
    console.log(`      Session: ${signInData.session?.access_token ? 'Created' : 'Failed'}`);
    console.log('');
    
    // Success!
    console.log('✅ E2E Admin User Verification Complete');
    console.log('');
    console.log('Summary:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   User ID: ${authUser.id}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log(`   Authentication: Working`);
    console.log('');
    console.log('✅ Ready to run E2E tests!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
