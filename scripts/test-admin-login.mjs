#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔐 Testing admin login...');
console.log('Email:', process.env.E2E_ADMIN_EMAIL);
console.log('Password:', '***' + process.env.E2E_ADMIN_PASSWORD.slice(-3));

const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.E2E_ADMIN_EMAIL,
  password: process.env.E2E_ADMIN_PASSWORD,
});

if (error) {
  console.error('❌ Login failed:', error.message);
  console.error('Status:', error.status);
  process.exit(1);
}

console.log('✅ Login successful!');
console.log('User ID:', data.user.id);
console.log('Email:', data.user.email);
