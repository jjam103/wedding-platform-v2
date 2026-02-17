#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recreateAdminUser() {
  console.log('Recreating admin user in admin_users table...\n');
  
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
  
  console.log(`✅ Found admin user in users table: role='${usersData.role}'`);
  
  // Delete from admin_users (if exists)
  console.log('\nDeleting existing admin_users entry...');
  await supabase
    .from('admin_users')
    .delete()
    .eq('email', adminEmail);
  console.log('✅ Deleted (if existed)');
  
  // Recreate with owner role
  console.log('\nCreating new admin_users entry with role=owner...');
  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      id: usersData.id,
      email: usersData.email,
      role: 'owner',  // Use 'owner' for admin_users table
      status: 'active',
    });
  
  if (insertError) {
    console.log('❌ Failed:', insertError.message);
    process.exit(1);
  }
  
  console.log('✅ Admin user recreated in admin_users table');
  
  // Verify
  console.log('\nVerifying configuration...');
  const { data: roleData, error: roleError } = await supabase
    .rpc('get_user_role', { user_id: usersData.id });
  
  if (roleError) {
    console.log('❌ get_user_role() failed:', roleError.message);
    process.exit(1);
  }
  
  console.log(`✅ get_user_role() returns: '${roleData}'`);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('ADMIN USER CONFIGURATION');
  console.log('='.repeat(70));
  console.log(`users table: role='${usersData.role}'`);
  console.log(`admin_users table: role='owner'`);
  console.log(`get_user_role() returns: '${roleData}'`);
  console.log('\n✅ Admin user is ready for E2E tests');
  console.log('\nNext step: Run reference blocks tests');
  console.log('  npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts');
}

recreateAdminUser().catch(console.error);
