#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminTables() {
  console.log('Checking admin user in both tables...\n');
  
  const adminEmail = 'admin@example.com';
  
  // Check users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', adminEmail);
  
  console.log('=== USERS TABLE ===');
  if (usersError) {
    console.log('❌ Error:', usersError.message);
  } else if (!usersData || usersData.length === 0) {
    console.log('⚠️  No admin user found');
  } else {
    console.log('✅ Found:');
    console.log(JSON.stringify(usersData[0], null, 2));
  }
  
  // Check admin_users table
  const { data: adminUsersData, error: adminUsersError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', adminEmail);
  
  console.log('\n=== ADMIN_USERS TABLE ===');
  if (adminUsersError) {
    console.log('❌ Error:', adminUsersError.message);
  } else if (!adminUsersData || adminUsersData.length === 0) {
    console.log('⚠️  No admin user found');
  } else {
    console.log('✅ Found:');
    console.log(JSON.stringify(adminUsersData[0], null, 2));
  }
  
  // Check get_user_role function
  if (usersData && usersData.length > 0) {
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: usersData[0].id });
    
    console.log('\n=== GET_USER_ROLE() FUNCTION ===');
    if (roleError) {
      console.log('❌ Error:', roleError.message);
    } else {
      console.log('✅ Returns:', roleData);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSIS');
  console.log('='.repeat(70));
  
  const inUsers = usersData && usersData.length > 0;
  const inAdminUsers = adminUsersData && adminUsersData.length > 0;
  
  if (inUsers && inAdminUsers) {
    console.log('⚠️  Admin user exists in BOTH tables');
    console.log(`   users table role: ${usersData[0].role}`);
    console.log(`   admin_users table role: ${adminUsersData[0].role}`);
    console.log('\n   This causes a mismatch:');
    console.log(`   - Middleware checks admin_users → sees role '${adminUsersData[0].role}'`);
    console.log(`   - RLS policies check users → sees role '${usersData[0].role}'`);
    console.log(`   - get_user_role() returns: '${roleData}'`);
    console.log('\n   SOLUTION: Remove admin user from admin_users table');
  } else if (inUsers && !inAdminUsers) {
    console.log('✅ Admin user is in users table only (correct)');
    console.log(`   Role: ${usersData[0].role}`);
    console.log('\n   ⚠️  BUT middleware queries admin_users table!');
    console.log('   This will cause middleware to fail authentication');
    console.log('\n   SOLUTION: Update middleware to query users table instead');
  } else if (!inUsers && inAdminUsers) {
    console.log('❌ Admin user is in admin_users table only (wrong)');
    console.log('   RLS policies will fail because they check users table');
    console.log('\n   SOLUTION: Move admin user to users table');
  } else {
    console.log('❌ Admin user not found in any table');
    console.log('\n   SOLUTION: Run E2E global setup to create admin user');
  }
}

checkAdminTables().catch(console.error);
