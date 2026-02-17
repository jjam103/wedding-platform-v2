#!/usr/bin/env node

/**
 * Diagnostic script to understand why guests aren't appearing in EmailComposer dropdown
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 Diagnosing Email Composer Guest Loading Issue\n');

  // Step 1: Create test data
  console.log('Step 1: Creating test data...');
  
  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: 'Diagnostic Test Group' })
    .select()
    .single();
  
  if (groupError) {
    console.error('❌ Failed to create group:', groupError);
    return;
  }
  console.log('✅ Created group:', group.id);

  // Create guests
  const testEmail1 = `diag-guest1-${Date.now()}@example.com`;
  const testEmail2 = `diag-guest2-${Date.now()}@example.com`;

  const { data: guest1, error: guest1Error } = await supabase
    .from('guests')
    .insert({
      first_name: 'Diagnostic',
      last_name: 'Guest1',
      email: testEmail1,
      group_id: group.id,
      age_type: 'adult',
      guest_type: 'wedding_guest',
    })
    .select()
    .single();

  if (guest1Error) {
    console.error('❌ Failed to create guest 1:', guest1Error);
    return;
  }
  console.log('✅ Created guest 1:', guest1.id, testEmail1);

  const { data: guest2, error: guest2Error } = await supabase
    .from('guests')
    .insert({
      first_name: 'Diagnostic',
      last_name: 'Guest2',
      email: testEmail2,
      group_id: group.id,
      age_type: 'adult',
      guest_type: 'wedding_guest',
    })
    .select()
    .single();

  if (guest2Error) {
    console.error('❌ Failed to create guest 2:', guest2Error);
    return;
  }
  console.log('✅ Created guest 2:', guest2.id, testEmail2);

  // Step 2: Verify guests exist in database
  console.log('\nStep 2: Verifying guests in database...');
  const { data: verifyGuests, error: verifyError } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email')
    .in('id', [guest1.id, guest2.id]);

  if (verifyError) {
    console.error('❌ Failed to verify guests:', verifyError);
    return;
  }
  console.log('✅ Verified guests in database:', verifyGuests.length);
  verifyGuests.forEach(g => {
    console.log(`   - ${g.id}: ${g.first_name} ${g.last_name} (${g.email})`);
  });

  // Step 3: Query guests like the API does (with format=simple)
  console.log('\nStep 3: Querying guests like API (format=simple)...');
  const { data: apiGuests, error: apiError } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email, group_id')
    .not('email', 'is', null)
    .order('last_name', { ascending: true });

  if (apiError) {
    console.error('❌ API query failed:', apiError);
    return;
  }
  console.log('✅ API query returned:', apiGuests.length, 'guests');
  
  // Check if our test guests are in the results
  const foundGuest1 = apiGuests.find(g => g.id === guest1.id);
  const foundGuest2 = apiGuests.find(g => g.id === guest2.id);
  
  if (foundGuest1) {
    console.log('✅ Guest 1 found in API results:', foundGuest1);
  } else {
    console.log('❌ Guest 1 NOT found in API results');
  }
  
  if (foundGuest2) {
    console.log('✅ Guest 2 found in API results:', foundGuest2);
  } else {
    console.log('❌ Guest 2 NOT found in API results');
  }

  // Step 4: Check RLS policies
  console.log('\nStep 4: Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('pg_policies')
    .eq('tablename', 'guests');

  if (policiesError) {
    console.log('⚠️  Could not check RLS policies (this is okay)');
  } else {
    console.log('RLS policies on guests table:', policies?.length || 0);
  }

  // Step 5: Test with anon key (like the browser would)
  console.log('\nStep 5: Testing with anon key (browser simulation)...');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.log('⚠️  No anon key found, skipping browser simulation');
  } else {
    const anonClient = createClient(supabaseUrl, anonKey);
    
    // Try to query without auth
    const { data: anonGuests, error: anonError } = await anonClient
      .from('guests')
      .select('id, first_name, last_name, email')
      .in('id', [guest1.id, guest2.id]);

    if (anonError) {
      console.log('❌ Anon query failed (expected if RLS is enabled):', anonError.message);
    } else {
      console.log('✅ Anon query returned:', anonGuests?.length || 0, 'guests');
    }
  }

  // Step 6: Summary
  console.log('\n📊 Summary:');
  console.log('- Test guests created:', guest1.id, guest2.id);
  console.log('- Guests verified in database: ✅');
  console.log('- Guests found in API query:', foundGuest1 ? '✅' : '❌', foundGuest2 ? '✅' : '❌');
  console.log('\n💡 Diagnosis:');
  
  if (foundGuest1 && foundGuest2) {
    console.log('✅ Guests ARE appearing in API queries');
    console.log('   The issue is likely:');
    console.log('   1. Component state not updating');
    console.log('   2. Test waiting for wrong IDs');
    console.log('   3. Race condition in test');
  } else {
    console.log('❌ Guests NOT appearing in API queries');
    console.log('   The issue is likely:');
    console.log('   1. RLS policies blocking access');
    console.log('   2. Database transaction not committed');
    console.log('   3. Query filters excluding guests');
  }

  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('guests').delete().eq('group_id', group.id);
  await supabase.from('groups').delete().eq('id', group.id);
  console.log('✅ Cleanup complete');
}

diagnose().catch(console.error);
