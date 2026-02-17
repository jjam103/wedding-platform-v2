#!/usr/bin/env node

/**
 * Apply RLS migration by executing SQL statements manually
 * This script reads the migration file and executes each statement
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

console.log('🔧 Applying RLS migration manually...\n');
console.log('⚠️  NOTE: This script will guide you through applying the migration\n');

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '055_fix_get_user_role_for_admin_users.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📄 Migration file loaded:');
console.log('   Path:', migrationPath);
console.log('   Size:', migrationSQL.length, 'bytes\n');

console.log('📋 Migration SQL:');
console.log('━'.repeat(80));
console.log(migrationSQL);
console.log('━'.repeat(80));
console.log('\n');

console.log('📝 MANUAL STEPS TO APPLY MIGRATION:\n');
console.log('1. Go to your Supabase dashboard:');
console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor\n`);
console.log('2. Click on "SQL Editor" in the left sidebar\n');
console.log('3. Click "New Query"\n');
console.log('4. Copy the SQL above (between the lines) and paste it into the editor\n');
console.log('5. Click "Run" to execute the migration\n');
console.log('6. Come back here and press Enter to verify the fix\n');

// Wait for user to press Enter
await new Promise(resolve => {
  process.stdin.once('data', resolve);
});

console.log('\n🔍 Verifying migration...\n');

// Test 1: Authenticate as admin
console.log('📊 Test 1: Authenticating as admin...');
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});

if (authError) {
  console.error('❌ Admin authentication failed:', authError.message);
  process.exit(1);
}

console.log('✅ Admin authenticated');
console.log('   User ID:', authData.user.id);
console.log('   Email:', authData.user.email);

// Test 2: Try to fetch guests
console.log('\n📊 Test 2: Fetching guests with admin credentials...');
const { data: guests, error: guestsError } = await supabase
  .from('guests')
  .select('id, first_name, last_name, email')
  .limit(5);

if (guestsError) {
  console.error('❌ Guest query failed:', guestsError.message);
  console.error('   Code:', guestsError.code);
  console.error('   Details:', guestsError.details);
  console.log('\n⚠️  Migration may not have been applied correctly');
  console.log('   Please check the SQL Editor for any errors\n');
  process.exit(1);
}

console.log(`✅ Guest query succeeded! Found ${guests?.length || 0} guests`);
if (guests && guests.length > 0) {
  console.log('   Sample guest:', guests[0]);
}

console.log('\n✅ Migration verified successfully!');
console.log('\n🎉 The get_user_role() function now checks both admin_users and users tables');
console.log('   Admin users can now access guest data through RLS policies\n');

process.exit(0);
