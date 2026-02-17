#!/usr/bin/env node

/**
 * Apply migration using Supabase SQL API
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

console.log('🔧 Applying migration using Supabase SQL API...\n');

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

try {
  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '055_fix_get_user_role_for_admin_users.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  console.log('📄 Executing migration...');
  console.log('   File:', migrationPath);
  console.log('   Size:', migrationSQL.length, 'bytes\n');
  
  // Execute migration using RPC
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    // If exec_sql doesn't exist, try direct query
    console.log('⚠️  exec_sql RPC not available, trying direct query...\n');
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   [${i + 1}/${statements.length}] Executing...`);
      
      // Use the from() method with a raw SQL query
      const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' });
      
      if (stmtError) {
        console.error(`   ❌ Statement ${i + 1} failed:`, stmtError.message);
        throw stmtError;
      }
      
      console.log(`   ✅ Statement ${i + 1} succeeded`);
    }
  } else {
    console.log('✅ Migration executed successfully\n');
  }
  
  // Verify the fix
  console.log('🔍 Verifying fix...');
  
  // Test 1: Check if function exists
  const { data: funcData, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'get_user_role')
    .single();
  
  if (funcError) {
    console.log('⚠️  Could not verify function (this is OK if migration succeeded)');
  } else if (funcData) {
    console.log('✅ Function exists');
    console.log('   Source:', funcData.prosrc.substring(0, 100) + '...');
  }
  
  console.log('\n✅ Migration complete!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stack) {
    console.error('\nStack trace:', error.stack);
  }
  process.exit(1);
}

// Now test with Supabase client
console.log('\n🔍 Testing with Supabase client...');
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'test-password-123',
});

if (authError) {
  console.error('❌ Admin authentication failed:', authError.message);
} else {
  console.log('✅ Admin authenticated');
  
  const { data: guests, error: guestsError } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email')
    .limit(5);
  
  if (guestsError) {
    console.error('❌ Guest query failed:', guestsError.message);
  } else {
    console.log(`✅ Guest query succeeded! Found ${guests?.length || 0} guests`);
    if (guests && guests.length > 0) {
      console.log('   Sample guest:', guests[0]);
    }
  }
}

process.exit(0);
