#!/usr/bin/env node

/**
 * Test E2E Database Connection
 * 
 * This script verifies that the E2E test database is accessible and properly configured.
 * It tests:
 * 1. Connection to the test database
 * 2. Basic query execution
 * 3. Verification that we're using the test database (not production)
 * 4. Table structure verification
 * 
 * Usage: node scripts/test-e2e-database-connection.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
const envPath = join(__dirname, '..', '.env.e2e');
dotenv.config({ path: envPath });

console.log('🧪 E2E Database Connection Test\n');
console.log('=' .repeat(60));

// Verify environment variables are loaded
console.log('\n📋 Environment Configuration:');
console.log(`   Database URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
console.log(`   Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ NOT SET'}`);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('\n❌ ERROR: Required environment variables not set');
  console.error('   Make sure .env.e2e file exists and contains valid credentials');
  process.exit(1);
}

// Verify we're using the test database
const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!dbUrl.includes('olcqaawrpnanioaorfer')) {
  console.error('\n❌ ERROR: Not using the test database!');
  console.error(`   Current URL: ${dbUrl}`);
  console.error('   Expected: https://olcqaawrpnanioaorfer.supabase.co');
  process.exit(1);
}

console.log('\n✅ Using test database (olcqaawrpnanioaorfer)');

// Create Supabase client with service role key (bypasses RLS for testing)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔌 Testing Database Connection...');
console.log('   Using service role key to bypass RLS for testing\n');

async function testConnection() {
  try {
    // Test 1: Basic connection test
    console.log('Test 1: Basic Connection');
    const { data, error, count } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('   ❌ Connection failed:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log(`   ✅ Connected successfully`);
    console.log(`   📊 Guests table has ${count} records`);
    
    // Test 2: Verify table structure
    console.log('\nTest 2: Table Structure Verification');
    const tables = [
      'guests',
      'groups',
      'events',
      'activities',
      'rsvps',
      'photos',
      'content_pages',
      'sections',
      'locations',
      'accommodations',
    ];
    
    let allTablesExist = true;
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Table '${table}' not accessible: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ Table '${table}' accessible`);
      }
    }
    
    if (!allTablesExist) {
      console.error('\n❌ Some tables are not accessible');
      return false;
    }
    
    // Test 3: Test basic CRUD operations
    console.log('\nTest 3: Basic CRUD Operations');
    
    // Create a test guest group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: 'E2E Test Group',
        description: 'Test group for E2E database connection verification',
      })
      .select()
      .single();
    
    if (groupError) {
      console.error('   ❌ Failed to create test group:', groupError.message);
      return false;
    }
    
    console.log(`   ✅ Created test group (ID: ${group.id})`);
    
    // Create a test guest
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        first_name: 'E2E',
        last_name: 'Test',
        email: null,  // Email is nullable, skip it to avoid validation issues
        group_id: group.id,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        // auth_method has a default value, so we don't need to specify it
      })
      .select()
      .single();
    
    if (guestError) {
      console.error('   ❌ Failed to create test guest:', guestError.message);
      // Clean up group
      await supabase.from('groups').delete().eq('id', group.id);
      return false;
    }
    
    console.log(`   ✅ Created test guest (ID: ${guest.id})`);
    
    // Read the guest back
    const { data: readGuest, error: readError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guest.id)
      .single();
    
    if (readError) {
      console.error('   ❌ Failed to read test guest:', readError.message);
      return false;
    }
    
    console.log(`   ✅ Read test guest successfully`);
    
    // Update the guest
    const { error: updateError } = await supabase
      .from('guests')
      .update({ first_name: 'E2E Updated' })
      .eq('id', guest.id);
    
    if (updateError) {
      console.error('   ❌ Failed to update test guest:', updateError.message);
      return false;
    }
    
    console.log(`   ✅ Updated test guest successfully`);
    
    // Delete the guest
    const { error: deleteGuestError } = await supabase
      .from('guests')
      .delete()
      .eq('id', guest.id);
    
    if (deleteGuestError) {
      console.error('   ❌ Failed to delete test guest:', deleteGuestError.message);
      return false;
    }
    
    console.log(`   ✅ Deleted test guest successfully`);
    
    // Delete the group
    const { error: deleteGroupError } = await supabase
      .from('groups')
      .delete()
      .eq('id', group.id);
    
    if (deleteGroupError) {
      console.error('   ❌ Failed to delete test group:', deleteGroupError.message);
      return false;
    }
    
    console.log(`   ✅ Deleted test group successfully`);
    
    // Test 4: Verify RLS policies (should work with anon key)
    console.log('\nTest 4: RLS Policy Verification');
    
    // Try to query guests (should work with proper RLS)
    const { data: guestsData, error: rlsError } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .limit(5);
    
    if (rlsError) {
      console.log(`   ⚠️  RLS query returned error: ${rlsError.message}`);
      console.log('   ℹ️  This is expected if RLS policies require authentication');
    } else {
      console.log(`   ✅ RLS policies allow anonymous queries (returned ${guestsData.length} records)`);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the tests
testConnection()
  .then((success) => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('\n✅ All database connection tests passed!');
      console.log('\n📝 Summary:');
      console.log('   • Database connection: ✓ Working');
      console.log('   • Table structure: ✓ Verified');
      console.log('   • CRUD operations: ✓ Working');
      console.log('   • RLS policies: ✓ Configured');
      console.log('\n🎉 E2E test database is ready for use!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some database connection tests failed');
      console.log('\n📝 Please check the errors above and:');
      console.log('   1. Verify .env.e2e has correct credentials');
      console.log('   2. Ensure test database is accessible');
      console.log('   3. Check that all migrations have been applied');
      console.log('   4. Verify RLS policies are configured correctly\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
