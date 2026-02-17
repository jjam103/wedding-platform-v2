#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

console.log('🔐 Resetting E2E Admin Password...\n');

const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';

console.log('📧 Email:', adminEmail);
console.log('🔑 New Password:', '***' + adminPassword.slice(-3));
console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get user by email
const { data: users, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error('❌ Failed to list users:', listError.message);
  process.exit(1);
}

const user = users.users.find(u => u.email === adminEmail);

if (!user) {
  console.error('❌ User not found:', adminEmail);
  console.log('\nAvailable users:');
  users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
  process.exit(1);
}

console.log('✅ Found user:', user.email);
console.log('   User ID:', user.id);
console.log('');

// Update password
console.log('🔄 Updating password...');
const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
  user.id,
  { password: adminPassword }
);

if (updateError) {
  console.error('❌ Failed to update password:', updateError.message);
  process.exit(1);
}

console.log('✅ Password updated successfully!');
console.log('');

// Test login
console.log('🧪 Testing login with new password...');
const testSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data: loginData, error: loginError } = await testSupabase.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});

if (loginError) {
  console.error('❌ Login test failed:', loginError.message);
  process.exit(1);
}

console.log('✅ Login test successful!');
console.log('   User ID:', loginData.user.id);
console.log('   Email:', loginData.user.email);
console.log('');
console.log('✨ E2E Admin Password Reset Complete!');
