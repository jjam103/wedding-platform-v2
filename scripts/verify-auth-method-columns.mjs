#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verifying auth_method columns in E2E database...\n');

// Test 1: Query guests table with auth_method
console.log('1. Testing guests.auth_method column...');
const { data: guests, error: guestsError } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .limit(1);

if (guestsError) {
  console.error('   ❌ Error:', guestsError.message);
  process.exit(1);
} else {
  console.log('   ✅ Column exists and is queryable');
  if (guests && guests.length > 0) {
    console.log('   Sample:', guests[0]);
  }
}

// Test 2: Query system_settings table with default_auth_method
console.log('\n2. Testing system_settings.default_auth_method column...');
const { data: settings, error: settingsError } = await supabase
  .from('system_settings')
  .select('id, default_auth_method')
  .limit(1);

if (settingsError) {
  console.error('   ❌ Error:', settingsError.message);
  process.exit(1);
} else {
  console.log('   ✅ Column exists and is queryable');
  if (settings && settings.length > 0) {
    console.log('   Sample:', settings[0]);
  }
}

// Test 3: Try to insert a guest with auth_method
console.log('\n3. Testing guest creation with auth_method...');

// First create a test group
const { data: group, error: groupError } = await supabase
  .from('groups')
  .insert({
    name: 'Verify Test Group',
    description: 'Temporary group for verification',
  })
  .select()
  .single();

if (groupError) {
  console.error('   ❌ Error creating group:', groupError.message);
  process.exit(1);
}

const { data: newGuest, error: insertError } = await supabase
  .from('guests')
  .insert({
    first_name: 'Verify',
    last_name: 'Test',
    email: null, // Email can be null
    auth_method: 'email_matching',
    age_type: 'adult',
    guest_type: 'wedding_guest',
    group_id: group.id,
  })
  .select()
  .single();

if (insertError) {
  console.error('   ❌ Error:', insertError.message);
  // Clean up group
  await supabase.from('groups').delete().eq('id', group.id);
  process.exit(1);
} else {
  console.log('   ✅ Guest created successfully with auth_method');
  console.log('   Guest auth_method:', newGuest.auth_method);
  
  // Clean up
  await supabase.from('guests').delete().eq('id', newGuest.id);
  await supabase.from('groups').delete().eq('id', group.id);
  console.log('   🧹 Test data cleaned up');
}

console.log('\n✨ Verification complete! All tests passed.');
