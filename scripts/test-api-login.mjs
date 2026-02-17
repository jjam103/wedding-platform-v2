#!/usr/bin/env node

/**
 * Test API login directly to verify credentials
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const password = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';

console.log('🔐 Testing API Login');
console.log(`   Email: ${email}`);
console.log(`   Password: ${password.substring(0, 4)}***`);
console.log(`   Supabase URL: ${supabaseUrl}`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('1️⃣  Attempting login...');
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.log('   ❌ Login failed');
  console.log(`   Error: ${error.message}`);
  console.log(`   Status: ${error.status}`);
  console.log('');
  console.log('💡 Try resetting the password:');
  console.log('   node scripts/reset-e2e-admin-password.mjs');
  process.exit(1);
}

console.log('   ✅ Login successful!');
console.log(`   User ID: ${data.user.id}`);
console.log(`   Email: ${data.user.email}`);
console.log(`   Session: ${data.session ? 'Created' : 'None'}`);
console.log('');

// Check admin_users table
console.log('2️⃣  Checking admin_users table...');
const { data: adminUser, error: adminError } = await supabase
  .from('admin_users')
  .select('*')
  .eq('id', data.user.id)
  .single();

if (adminError) {
  console.log('   ❌ Admin user record not found');
  console.log(`   Error: ${adminError.message}`);
  process.exit(1);
}

console.log('   ✅ Admin user record found');
console.log(`   Role: ${adminUser.role}`);
console.log(`   Status: ${adminUser.status}`);
console.log('');

console.log('✅ All checks passed!');
console.log('   The credentials are correct and should work in E2E tests.');
