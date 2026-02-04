#!/usr/bin/env node

/**
 * Verify migration 051: Check if default_auth_method migration was applied
 * 
 * This script verifies that the migration was successfully applied.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyMigration() {
  console.log('🔍 Verifying migration 051: default_auth_method\n');

  const checks = [];
  let allPassed = true;

  // Check 1: system_settings table exists
  console.log('1️⃣  Checking system_settings table...');
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);

    if (error) {
      console.log('❌ system_settings table not found');
      checks.push({ name: 'system_settings table', passed: false });
      allPassed = false;
    } else {
      console.log('✅ system_settings table exists');
      checks.push({ name: 'system_settings table', passed: true });
    }
  } catch (error) {
    console.log('❌ Error checking table:', error.message);
    checks.push({ name: 'system_settings table', passed: false });
    allPassed = false;
  }

  // Check 2: default_auth_method setting exists
  console.log('\n2️⃣  Checking default_auth_method setting...');
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value, description, category')
      .eq('key', 'default_auth_method')
      .single();

    if (error || !data) {
      console.log('❌ default_auth_method setting not found');
      checks.push({ name: 'default_auth_method setting', passed: false });
      allPassed = false;
    } else {
      console.log('✅ default_auth_method setting exists');
      console.log('   Value:', data.value);
      console.log('   Description:', data.description);
      console.log('   Category:', data.category);
      checks.push({ name: 'default_auth_method setting', passed: true });
    }
  } catch (error) {
    console.log('❌ Error checking setting:', error.message);
    checks.push({ name: 'default_auth_method setting', passed: false });
    allPassed = false;
  }

  // Check 3: Try to query with default_auth_method column
  console.log('\n3️⃣  Checking default_auth_method column...');
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('default_auth_method')
      .limit(1);

    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ default_auth_method column does not exist');
        console.log('   This column needs to be added via SQL migration');
        checks.push({ name: 'default_auth_method column', passed: false });
        allPassed = false;
      } else {
        console.log('⚠️  Error querying column:', error.message);
        checks.push({ name: 'default_auth_method column', passed: false });
        allPassed = false;
      }
    } else {
      console.log('✅ default_auth_method column exists');
      checks.push({ name: 'default_auth_method column', passed: true });
    }
  } catch (error) {
    console.log('❌ Error checking column:', error.message);
    checks.push({ name: 'default_auth_method column', passed: false });
    allPassed = false;
  }

  // Check 4: RSVP indexes (we can't directly check these via Supabase client)
  console.log('\n4️⃣  Checking RSVP table...');
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ rsvps table not found');
      checks.push({ name: 'rsvps table', passed: false });
      allPassed = false;
    } else {
      console.log('✅ rsvps table exists');
      console.log('   Note: Indexes cannot be verified via API');
      checks.push({ name: 'rsvps table', passed: true });
    }
  } catch (error) {
    console.log('❌ Error checking rsvps table:', error.message);
    checks.push({ name: 'rsvps table', passed: false });
    allPassed = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Verification Summary\n');
  
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
  });

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('\n✨ All checks passed! Migration 051 is fully applied.\n');
  } else {
    console.log('\n⚠️  Some checks failed. Manual SQL execution may be required.\n');
    console.log('📝 To complete the migration manually:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Open: supabase/migrations/051_add_default_auth_method.sql');
    console.log('   3. Copy and paste the SQL content');
    console.log('   4. Click "Run" to execute');
    console.log('   5. Run this verification script again\n');
  }

  process.exit(allPassed ? 0 : 1);
}

verifyMigration();
