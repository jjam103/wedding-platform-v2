#!/usr/bin/env node

/**
 * Verify Email RLS Fix
 * 
 * Checks if the email RLS policies were updated correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load E2E environment
dotenv.config({ path: '.env.e2e' });

const supabaseUrl = process.env.SUPABASE_E2E_URL;
const supabaseKey = process.env.SUPABASE_E2E_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing E2E environment variables');
  console.error('Required: SUPABASE_E2E_URL, SUPABASE_E2E_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying Email RLS Fix\n');
console.log('=' .repeat(50));

async function checkPolicies() {
  const tables = ['email_logs', 'email_templates', 'scheduled_emails', 'sms_logs'];
  const expectedPolicies = {
    email_logs: ['admin_users_view_email_logs', 'system_insert_email_logs', 'system_update_email_logs'],
    email_templates: ['admin_users_manage_email_templates'],
    scheduled_emails: ['admin_users_manage_scheduled_emails'],
    sms_logs: ['admin_users_view_sms_logs', 'system_insert_sms_logs', 'system_update_sms_logs'],
  };

  let allCorrect = true;

  for (const table of tables) {
    console.log(`\n📋 Checking ${table}...`);
    
    // Query pg_policies to check RLS policies
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', table);

    if (error) {
      console.error(`❌ Error querying policies: ${error.message}`);
      allCorrect = false;
      continue;
    }

    const policyNames = policies?.map(p => p.policyname) || [];
    const expected = expectedPolicies[table];

    console.log(`   Found policies: ${policyNames.join(', ') || 'none'}`);
    console.log(`   Expected: ${expected.join(', ')}`);

    // Check if all expected policies exist
    const missing = expected.filter(p => !policyNames.includes(p));
    const extra = policyNames.filter(p => !expected.includes(p) && !p.startsWith('hosts_'));

    if (missing.length > 0) {
      console.log(`   ❌ Missing policies: ${missing.join(', ')}`);
      allCorrect = false;
    }

    if (extra.length > 0) {
      console.log(`   ⚠️  Extra policies: ${extra.join(', ')}`);
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log(`   ✅ All policies correct`);
    }
  }

  return allCorrect;
}

async function checkAdminUser() {
  console.log('\n\n👤 Checking Admin User...');
  
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'admin@example.com')
    .single();

  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }

  if (!adminUser) {
    console.error('❌ Admin user not found in admin_users table');
    return false;
  }

  console.log(`✅ Admin user found:`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Role: ${adminUser.role}`);
  console.log(`   Status: ${adminUser.status}`);
  console.log(`   User ID: ${adminUser.user_id}`);

  return true;
}

async function testEmailLogsAccess() {
  console.log('\n\n🔐 Testing Email Logs Access...');
  
  // This will use service role, so it should work
  const { data, error } = await supabase
    .from('email_logs')
    .select('count')
    .limit(1);

  if (error) {
    console.error(`❌ Error accessing email_logs: ${error.message}`);
    return false;
  }

  console.log('✅ Email logs table accessible');
  return true;
}

async function main() {
  try {
    const policiesOk = await checkPolicies();
    const adminUserOk = await checkAdminUser();
    const accessOk = await testEmailLogsAccess();

    console.log('\n\n' + '='.repeat(50));
    console.log('📊 Verification Summary\n');

    if (policiesOk && adminUserOk && accessOk) {
      console.log('✅ All checks passed!');
      console.log('\n🎯 Next step: Run email management tests');
      console.log('   npx playwright test __tests__/e2e/admin/emailManagement.spec.ts');
      process.exit(0);
    } else {
      console.log('❌ Some checks failed');
      console.log('\n📝 Action required:');
      if (!policiesOk) {
        console.log('   1. Apply the migration via Supabase Dashboard');
        console.log('      See: APPLY_EMAIL_RLS_FIX.md');
      }
      if (!adminUserOk) {
        console.log('   2. Verify admin user exists in admin_users table');
      }
      if (!accessOk) {
        console.log('   3. Check database connection and permissions');
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main();
