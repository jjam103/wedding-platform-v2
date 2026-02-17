#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAdminUserTables() {
  console.log('Syncing admin user between tables...\n');
  
  const adminEmail = 'admin@example.com';
  
  // Get admin user from users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', adminEmail)
    .single();
  
  if (usersError || !usersData) {
    console.log('❌ Admin user not found in users table');
    process.exit(1);
  }
  
  console.log(`✅ Admin user in users table: role='${usersData.role}'`);
  
  // Create matching entry in admin_users table
  console.log('\nCreating matching entry in admin_users table...');
  
  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      id: usersData.id,
      email: usersData.email,
      role: usersData.role,  // Use same role as users table
      status: 'active',
    });
  
  if (insertError) {
    console.log('❌ Failed to create admin_users entry:', insertError.message);
    process.exit(1);
  }
  
  console.log(`✅ Created admin_users entry with role='${usersData.role}'`);
  
  // Verify
  console.log('\nVerifying sync...');
  
  const { data: roleData } = await supabase
    .rpc('get_user_role', { user_id: usersData.id });
  
  console.log(`✅ get_user_role() returns: '${roleData}'`);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(70));
  console.log('Admin user now exists in both tables with matching roles:');
  console.log(`  users table: role='${usersData.role}'`);
  console.log(`  admin_users table: role='${usersData.role}'`);
  console.log(`  get_user_role() returns: '${roleData}'`);
  console.log('\nBoth middleware and RLS policies should now work correctly');
}

syncAdminUserTables().catch(console.error);
