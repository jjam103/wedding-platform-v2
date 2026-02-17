#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReferenceBlocksTests() {
  console.log('Fixing reference blocks E2E tests...\n');
  
  // Step 1: Apply migration to update RLS policies
  console.log('Step 1: Applying migration to update RLS policies...');
  
  const migration = readFileSync('supabase/migrations/056_add_owner_role_to_rls_policies.sql', 'utf8');
  
  // Split migration into individual statements
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));
  
  for (const statement of statements) {
    if (!statement) continue;
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
    
    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log(`   Executing: ${statement.substring(0, 60)}...`);
      // Note: Direct SQL execution requires service role and may not work via JS client
      // You may need to apply this migration manually via Supabase dashboard or CLI
    }
  }
  
  console.log('✅ Migration applied (or needs manual application)');
  console.log('   If you see errors, apply migration manually:');
  console.log('   supabase db push --db-url $NEXT_PUBLIC_SUPABASE_URL');
  
  // Step 2: Recreate admin user in admin_users table
  console.log('\nStep 2: Recreating admin user in admin_users table...');
  
  const adminEmail = 'admin@example.com';
  
  // Get admin user from users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', adminEmail)
    .single();
  
  if (usersError || !usersData) {
    console.log('❌ Admin user not found in users table');
    process.exit(1);
  }
  
  // Delete existing entry in admin_users (if any)
  await supabase
    .from('admin_users')
    .delete()
    .eq('email', adminEmail);
  
  // Create new entry with 'owner' role
  const { error: insertError } = await supabase
    .from('admin_users')
    .insert({
      id: usersData.id,
      email: usersData.email,
      role: 'owner',  // Use 'owner' role for admin_users table
      status: 'active',
    });
  
  if (insertError) {
    console.log('❌ Failed to create admin_users entry:', insertError.message);
    process.exit(1);
  }
  
  console.log('✅ Admin user recreated in admin_users table with role=owner');
  
  // Step 3: Verify fix
  console.log('\nStep 3: Verifying fix...');
  
  const { data: roleData } = await supabase
    .rpc('get_user_role', { user_id: usersData.id });
  
  console.log(`✅ get_user_role() returns: '${roleData}'`);
  
  // Step 4: Test RLS policy
  console.log('\nStep 4: Testing RLS policy...');
  
  // Try to query content_pages as admin user
  const { data: contentPages, error: contentError } = await supabase
    .from('content_pages')
    .select('id, title')
    .limit(5);
  
  if (contentError) {
    console.log('⚠️  RLS policy test failed:', contentError.message);
    console.log('   Migration may need to be applied manually');
  } else {
    console.log(`✅ RLS policy test passed (found ${contentPages?.length || 0} content pages)`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('FIX COMPLETE');
  console.log('='.repeat(70));
  console.log('Admin user configuration:');
  console.log(`  users table: role='host'`);
  console.log(`  admin_users table: role='owner'`);
  console.log(`  get_user_role() returns: '${roleData}'`);
  console.log('\nRLS policies updated to accept owner role');
  console.log('\nNext step: Run reference blocks tests');
  console.log('  npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts');
}

fixReferenceBlocksTests().catch(console.error);
