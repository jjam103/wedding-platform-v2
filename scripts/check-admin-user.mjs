#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminUser() {
  console.log('Checking admin user in database...\n');
  
  // Check users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', 'admin@example.com');
  
  console.log('Users table:');
  if (usersError) {
    console.log('  ❌ Error:', usersError.message);
  } else if (!usersData || usersData.length === 0) {
    console.log('  ⚠️  No admin user found');
  } else {
    console.log('  ✅ Found:', JSON.stringify(usersData[0], null, 2));
  }
  
  // Check admin_users table
  const { data: adminUsersData, error: adminUsersError } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('email', 'admin@example.com');
  
  console.log('\nAdmin_users table:');
  if (adminUsersError) {
    console.log('  ❌ Error:', adminUsersError.message);
  } else if (!adminUsersData || adminUsersData.length === 0) {
    console.log('  ⚠️  No admin user found');
  } else {
    console.log('  ✅ Found:', JSON.stringify(adminUsersData[0], null, 2));
  }
  
  // Check get_user_role function
  if (usersData && usersData.length > 0) {
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: usersData[0].id });
    
    console.log('\nget_user_role() function:');
    if (roleError) {
      console.log('  ❌ Error:', roleError.message);
    } else {
      console.log('  ✅ Returns:', roleData);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const inUsers = usersData && usersData.length > 0;
  const inAdminUsers = adminUsersData && adminUsersData.length > 0;
  
  if (inUsers && !inAdminUsers) {
    console.log('✅ CORRECT: Admin user is in users table only');
    console.log(`   Role: ${usersData[0].role}`);
    if (usersData[0].role === 'super_admin' || usersData[0].role === 'host') {
      console.log('✅ Role is correct for RLS policies');
    } else {
      console.log(`⚠️  Role '${usersData[0].role}' may not work with RLS policies`);
      console.log('   Expected: super_admin or host');
    }
  } else if (!inUsers && inAdminUsers) {
    console.log('❌ WRONG: Admin user is in admin_users table only');
    console.log('   This will cause RLS policies to fail');
    console.log('   Fix: Run E2E global setup to recreate user in users table');
  } else if (inUsers && inAdminUsers) {
    console.log('⚠️  WARNING: Admin user is in BOTH tables');
    console.log('   This may cause confusion');
    console.log('   Recommendation: Remove from admin_users table');
  } else {
    console.log('❌ ERROR: Admin user not found in any table');
    console.log('   Fix: Run E2E global setup to create user');
  }
}

checkAdminUser().catch(console.error);
