#!/usr/bin/env node

/**
 * Check Sections RLS Policy in E2E Database
 * 
 * This script checks the current RLS policies on the sections table
 * to understand why we're getting "permission denied for table users" error.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔍 Checking Sections Table RLS Policies\n');

// Check if users table exists
console.log('1️⃣  Checking if users table exists...');
const { data: usersTables, error: usersError } = await client
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_name', 'users');

if (usersError) {
  console.log('   ❌ Error checking users table:', usersError.message);
} else if (!usersTables || usersTables.length === 0) {
  console.log('   ❌ users table does NOT exist');
} else {
  console.log('   ✅ users table exists');
}

// Check sections table RLS policies
console.log('\n2️⃣  Checking sections table RLS policies...');
const { data: policies, error: policiesError } = await client
  .from('pg_policies')
  .select('*')
  .eq('tablename', 'sections');

if (policiesError) {
  console.log('   ❌ Error fetching policies:', policiesError.message);
} else if (!policies || policies.length === 0) {
  console.log('   ⚠️  No RLS policies found on sections table');
} else {
  console.log(`   ✅ Found ${policies.length} RLS policies:\n`);
  
  policies.forEach((policy, index) => {
    console.log(`   Policy ${index + 1}: ${policy.policyname}`);
    console.log(`   - Command: ${policy.cmd}`);
    console.log(`   - Roles: ${policy.roles}`);
    console.log(`   - USING: ${policy.qual || 'N/A'}`);
    console.log(`   - WITH CHECK: ${policy.with_check || 'N/A'}`);
    console.log('');
  });
}

// Check if RLS is enabled on sections
console.log('3️⃣  Checking if RLS is enabled on sections table...');
const { data: rlsStatus, error: rlsError } = await client
  .from('pg_tables')
  .select('tablename, rowsecurity')
  .eq('schemaname', 'public')
  .eq('tablename', 'sections');

if (rlsError) {
  console.log('   ❌ Error checking RLS status:', rlsError.message);
} else if (!rlsStatus || rlsStatus.length === 0) {
  console.log('   ❌ sections table not found');
} else {
  const isEnabled = rlsStatus[0].rowsecurity;
  console.log(`   ${isEnabled ? '✅' : '❌'} RLS is ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
}

// Try to access sections with anon key
console.log('\n4️⃣  Testing anon access to sections...');
const anonClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: sectionsData, error: sectionsError } = await anonClient
  .from('sections')
  .select('*')
  .limit(1);

if (sectionsError) {
  console.log('   ❌ Error:', sectionsError.message);
  console.log('   Details:', sectionsError.details || 'N/A');
  console.log('   Hint:', sectionsError.hint || 'N/A');
} else {
  console.log(`   ✅ Success - returned ${sectionsData?.length || 0} rows`);
}

console.log('\n' + '='.repeat(60));
console.log('Summary:');
console.log('='.repeat(60));
console.log('If you see "permission denied for table users", the RLS policy');
console.log('is trying to reference a users table that either:');
console.log('1. Does not exist');
console.log('2. Has incorrect permissions');
console.log('3. Should use auth.users() instead');
console.log('='.repeat(60));
