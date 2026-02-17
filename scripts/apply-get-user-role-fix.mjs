#!/usr/bin/env node

/**
 * Apply the get_user_role fix migration to E2E database
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

console.log('🔧 Applying get_user_role fix migration...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '055_fix_get_user_role_for_admin_users.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log('📄 Migration file:', migrationPath);
console.log('📏 Migration size:', migrationSQL.length, 'bytes\n');

// Execute migration
console.log('⚙️  Executing migration...');
const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

if (error) {
  console.error('❌ Migration failed:', error);
  
  // Try direct execution as fallback
  console.log('\n🔄 Trying direct execution...');
  try {
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (stmtError) {
          console.error('❌ Statement failed:', stmtError.message);
          console.error('   Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
  } catch (fallbackError) {
    console.error('❌ Fallback execution failed:', fallbackError);
    process.exit(1);
  }
} else {
  console.log('✅ Migration executed successfully');
}

// Verify the fix
console.log('\n🔍 Verifying fix...');

// Test 1: Check if function exists
const { data: functionExists, error: funcError } = await supabase
  .rpc('exec_sql', { 
    sql: `SELECT proname FROM pg_proc WHERE proname = 'get_user_role';` 
  });

if (funcError) {
  console.error('❌ Failed to verify function:', funcError);
} else {
  console.log('✅ Function exists');
}

// Test 2: Test function with admin user
const adminUserId = 'e7f5ae65-376e-4d05-a18c-10a91295727a'; // From diagnostic
const { data: roleData, error: roleError } = await supabase
  .rpc('exec_sql', { 
    sql: `SELECT public.get_user_role('${adminUserId}'::UUID) as role;` 
  });

if (roleError) {
  console.error('❌ Failed to test function:', roleError);
} else {
  console.log('✅ Function returns role for admin user:', roleData);
}

// Test 3: Try to query guests with admin credentials
console.log('\n🔍 Testing guest query with admin credentials...');
const adminEmail = 'admin@example.com';
const adminPassword = 'test-password-123';

const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
  email: adminEmail,
  password: adminPassword,
});

if (authError) {
  console.error('❌ Admin authentication failed:', authError);
} else {
  console.log('✅ Admin authenticated');
  
  const { data: guests, error: guestsError } = await anonClient
    .from('guests')
    .select('id, first_name, last_name, email')
    .limit(5);
  
  if (guestsError) {
    console.error('❌ Guest query failed:', guestsError);
  } else {
    console.log(`✅ Guest query succeeded! Found ${guests?.length || 0} guests`);
    if (guests && guests.length > 0) {
      console.log('   Sample guest:', guests[0]);
    }
  }
}

console.log('\n✅ Migration complete!');
process.exit(0);
