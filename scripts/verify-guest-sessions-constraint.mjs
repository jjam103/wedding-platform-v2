#!/usr/bin/env node

/**
 * Verify Guest Sessions Token Unique Constraint
 * 
 * Checks if the unique constraint on guest_sessions.token exists.
 * This constraint is required for Pattern 1 fix to work correctly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyConstraint() {
  console.log('🔍 Checking for guest_sessions_token_unique constraint...\n');

  // Query information_schema to check for constraint
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        constraint_name,
        constraint_type,
        table_name
      FROM information_schema.table_constraints
      WHERE table_name = 'guest_sessions'
        AND constraint_name = 'guest_sessions_token_unique';
    `
  });

  if (error) {
    // Try alternative method using pg_catalog
    console.log('⚠️  RPC method failed, trying direct query...\n');
    
    const { data: altData, error: altError } = await supabase
      .from('pg_constraint')
      .select('conname, contype')
      .eq('conname', 'guest_sessions_token_unique')
      .single();

    if (altError) {
      console.error('❌ Failed to query constraints:', altError.message);
      console.log('\n📝 Manual verification required:');
      console.log('   Run this SQL query in Supabase SQL Editor:');
      console.log('   ```sql');
      console.log('   SELECT constraint_name, constraint_type');
      console.log('   FROM information_schema.table_constraints');
      console.log('   WHERE table_name = \'guest_sessions\'');
      console.log('     AND constraint_name = \'guest_sessions_token_unique\';');
      console.log('   ```');
      process.exit(1);
    }

    if (altData) {
      console.log('✅ Constraint exists!');
      console.log(`   Name: ${altData.conname}`);
      console.log(`   Type: ${altData.contype === 'u' ? 'UNIQUE' : altData.contype}`);
      console.log('\n✅ Pattern 1 fix database requirement satisfied');
      process.exit(0);
    }
  }

  if (!data || data.length === 0) {
    console.log('❌ Constraint NOT found');
    console.log('\n📝 To fix this, run:');
    console.log('   npx supabase db push --db-url "$SUPABASE_E2E_DB_URL"');
    console.log('\n   Or apply migration manually:');
    console.log('   supabase/migrations/054_add_guest_sessions_token_unique_constraint.sql');
    process.exit(1);
  }

  console.log('✅ Constraint exists!');
  console.log(`   Name: ${data[0].constraint_name}`);
  console.log(`   Type: ${data[0].constraint_type}`);
  console.log(`   Table: ${data[0].table_name}`);
  console.log('\n✅ Pattern 1 fix database requirement satisfied');
  process.exit(0);
}

verifyConstraint().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
