#!/usr/bin/env node

/**
 * Check if get_user_role function exists and has correct configuration
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment
dotenv.config({ path: join(__dirname, '../.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking get_user_role function\n');

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

// Check function definition
const { data: functions, error: funcError } = await serviceClient
  .rpc('pg_get_functiondef', { funcid: 'public.get_user_role(uuid)'::regprocedure::oid });

if (funcError) {
  console.log('❌ Error fetching function:', funcError.message);
  
  // Try alternative query
  const { data: altData, error: altError } = await serviceClient
    .from('pg_proc')
    .select('*')
    .eq('proname', 'get_user_role')
    .single();
  
  if (altError) {
    console.log('❌ Function does not exist');
  } else {
    console.log('✅ Function exists but cannot fetch definition');
    console.log('Function OID:', altData.oid);
  }
} else {
  console.log('✅ Function definition:');
  console.log(functions);
}

console.log('\n');

// Test the function directly
console.log('Testing get_user_role function:');
console.log('='.repeat(50));

// Sign in as admin
const { data: authData, error: authError } = await serviceClient.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'test-password-123',
});

if (authError) {
  console.log('❌ Auth failed:', authError.message);
  process.exit(1);
}

console.log('✅ Authenticated as:', authData.user.email);
console.log('User ID:', authData.user.id);

// Try calling the function
const { data: roleData, error: roleError } = await serviceClient
  .rpc('get_user_role', { user_id: authData.user.id });

if (roleError) {
  console.log('❌ Error calling get_user_role:', roleError.message);
} else {
  console.log('✅ get_user_role returned:', roleData);
}

console.log('\n');

// Check RLS policies on guests table
console.log('Checking RLS policies on guests table:');
console.log('='.repeat(50));

const { data: policies, error: policiesError } = await serviceClient
  .rpc('pg_policies')
  .select('*')
  .eq('tablename', 'guests');

if (policiesError) {
  console.log('❌ Error fetching policies:', policiesError.message);
  
  // Try direct query
  const query = `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'guests';
  `;
  
  const { data: directData, error: directError } = await serviceClient.rpc('exec_sql', { sql: query });
  
  if (directError) {
    console.log('❌ Cannot query pg_policies');
  } else {
    console.log('✅ Policies:', directData);
  }
} else {
  console.log('✅ Policies:', policies);
}

process.exit(0);
