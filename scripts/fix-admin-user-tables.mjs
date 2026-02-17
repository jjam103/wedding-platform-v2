#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdminUserTables() {
  console.log('Fixing admin user table mismatch...\n');
  
  const adminEmail = 'admin@example.com';
  
  // Step 1: Check current state
  console.log('Step 1: Checking current state...');
  
  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', adminEmail)
    .single();
  
  const { data: adminUsersData } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('email', adminEmail)
    .single();
  
  if (!usersData) {
    console.log('❌ Admin user not found in users table');
    console.log('   Cannot proceed - admin user must exist in users table');
    process.exit(1);
  }
  
  console.log(`✅ Admin user in users table: role='${usersData.role}'`);
  
  if (adminUsersData) {
    console.log(`⚠️  Admin user also in admin_users table: role='${adminUsersData.role}'`);
  } else {
    console.log('✅ Admin user not in admin_users table (correct)');
    console.log('\nNo fix needed - admin user is already in correct state');
    return;
  }
  
  // Step 2: Delete from admin_users table
  console.log('\nStep 2: Removing admin user from admin_users table...');
  
  const { error: deleteError } = await supabase
    .from('admin_users')
    .delete()
    .eq('email', adminEmail);
  
  if (deleteError) {
    console.log('❌ Failed to delete from admin_users:', deleteError.message);
    process.exit(1);
  }
  
  console.log('✅ Deleted admin user from admin_users table');
  
  // Step 3: Verify fix
  console.log('\nStep 3: Verifying fix...');
  
  const { data: roleData } = await supabase
    .rpc('get_user_role', { user_id: usersData.id });
  
  console.log(`✅ get_user_role() now returns: '${roleData}'`);
  
  if (roleData === 'host' || roleData === 'super_admin') {
    console.log('✅ Role is correct for RLS policies');
  } else {
    console.log(`⚠️  Role '${roleData}' may not work with all RLS policies`);
  }
  
  // Step 4: Summary
  console.log('\n' + '='.repeat(70));
  console.log('FIX COMPLETE');
  console.log('='.repeat(70));
  console.log('Admin user is now in users table only');
  console.log(`Role: ${roleData}`);
  console.log('\nMiddleware will need to be updated to query users table instead of admin_users');
  console.log('Or admin user needs to be recreated in admin_users table with matching role');
}

fixAdminUserTables().catch(console.error);
