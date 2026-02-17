#!/usr/bin/env node

/**
 * Diagnose E2E RLS Issues
 * 
 * This script checks:
 * 1. If service role can read guests table
 * 2. If RLS policies are correctly configured
 * 3. If test database schema is up to date
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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 E2E RLS Diagnosis');
console.log('='.repeat(60));
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);
console.log('');

// Test 1: Service role can read guests table
console.log('Test 1: Service role access to guests table');
console.log('-'.repeat(60));

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

try {
  const { data: guests, error } = await serviceClient
    .from('guests')
    .select('id, email, auth_method')
    .limit(5);

  if (error) {
    console.error('❌ Service role CANNOT read guests table');
    console.error('Error:', error.message);
    console.error('Details:', error);
  } else {
    console.log(`✅ Service role CAN read guests table (${guests.length} guests found)`);
    if (guests.length > 0) {
      console.log('Sample guests:');
      guests.forEach(g => console.log(`  - ${g.email} (${g.auth_method})`));
    }
  }
} catch (err) {
  console.error('❌ Exception reading guests table:', err.message);
}

console.log('');

// Test 2: Check if RLS is enabled on guests table
console.log('Test 2: RLS status on guests table');
console.log('-'.repeat(60));

try {
  const { data: rlsStatus, error } = await serviceClient
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .eq('tablename', 'guests')
    .single();

  if (error) {
    console.error('❌ Cannot check RLS status:', error.message);
  } else {
    console.log(`RLS enabled: ${rlsStatus.rowsecurity}`);
    if (rlsStatus.rowsecurity) {
      console.log('⚠️  RLS is enabled - service role should bypass it');
    } else {
      console.log('✅ RLS is disabled');
    }
  }
} catch (err) {
  console.error('❌ Exception checking RLS status:', err.message);
}

console.log('');

// Test 3: Check audit_logs schema
console.log('Test 3: Audit logs schema');
console.log('-'.repeat(60));

try {
  const { data: columns, error } = await serviceClient
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'audit_logs')
    .in('column_name', ['action', 'details', 'operation_type']);

  if (error) {
    console.error('❌ Cannot check audit_logs schema:', error.message);
  } else {
    console.log('Audit logs columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    const hasAction = columns.some(c => c.column_name === 'action');
    const hasDetails = columns.some(c => c.column_name === 'details');
    
    if (hasAction && hasDetails) {
      console.log('✅ Audit logs schema is up to date');
    } else {
      console.log('❌ Audit logs schema is missing columns');
      if (!hasAction) console.log('  Missing: action');
      if (!hasDetails) console.log('  Missing: details');
    }
  }
} catch (err) {
  console.error('❌ Exception checking audit_logs schema:', err.message);
}

console.log('');

// Test 4: Check activities schema
console.log('Test 4: Activities schema');
console.log('-'.repeat(60));

try {
  const { data: columns, error } = await serviceClient
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'activities')
    .eq('column_name', 'cost_per_guest');

  if (error) {
    console.error('❌ Cannot check activities schema:', error.message);
  } else {
    if (columns.length > 0) {
      console.log(`✅ Activities table has cost_per_guest column (${columns[0].data_type})`);
    } else {
      console.log('❌ Activities table is missing cost_per_guest column');
    }
  }
} catch (err) {
  console.error('❌ Exception checking activities schema:', err.message);
}

console.log('');

// Test 5: Try to create a test guest with service role
console.log('Test 5: Create test guest with service role');
console.log('-'.repeat(60));

try {
  // First create a test group
  const { data: group, error: groupError } = await serviceClient
    .from('groups')
    .insert({ name: 'RLS Test Group' })
    .select()
    .single();

  if (groupError) {
    console.error('❌ Cannot create test group:', groupError.message);
  } else {
    console.log(`✅ Created test group: ${group.id}`);

    // Now try to create a guest
    const testEmail = `rls-test-${Date.now()}@example.com`;
    const { data: guest, error: guestError } = await serviceClient
      .from('guests')
      .insert({
        first_name: 'RLS',
        last_name: 'Test',
        email: testEmail,
        group_id: group.id,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        auth_method: 'email_matching',
      })
      .select()
      .single();

    if (guestError) {
      console.error('❌ Cannot create test guest:', guestError.message);
      console.error('Details:', guestError);
    } else {
      console.log(`✅ Created test guest: ${guest.email}`);

      // Try to read it back
      const { data: readGuest, error: readError } = await serviceClient
        .from('guests')
        .select('id, email, auth_method')
        .eq('email', testEmail)
        .single();

      if (readError) {
        console.error('❌ Cannot read back test guest:', readError.message);
      } else {
        console.log(`✅ Successfully read back test guest: ${readGuest.email}`);
      }

      // Clean up
      await serviceClient.from('guests').delete().eq('id', guest.id);
      await serviceClient.from('groups').delete().eq('id', group.id);
      console.log('✅ Cleaned up test data');
    }
  }
} catch (err) {
  console.error('❌ Exception creating test guest:', err.message);
}

console.log('');
console.log('='.repeat(60));
console.log('Diagnosis complete');
