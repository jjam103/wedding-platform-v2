#!/usr/bin/env node

/**
 * Apply Migration 057: Allow anon access to locations
 * 
 * This script applies the migration to allow anon users to view locations,
 * which fixes the guest view reference blocks test.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🚀 Applying Migration 057: Allow anon access to locations\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '057_allow_anon_access_to_locations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('');

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      console.log('⚠️  exec_sql not available, trying direct execution...');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.length === 0) continue;
        
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (stmtError) {
          console.error(`   ❌ Error: ${stmtError.message}`);
          throw stmtError;
        }
        console.log('   ✓ Success');
      }
    }

    console.log('\n✅ Migration applied successfully!\n');

    // Verify the policy was created
    console.log('🔍 Verifying policy...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'locations')
      .eq('policyname', 'Guests can view locations');

    if (policyError) {
      console.log('⚠️  Could not verify policy (this is OK if pg_policies view is not accessible)');
    } else if (policies && policies.length > 0) {
      console.log('✅ Policy "Guests can view locations" verified');
      console.log('   Table: locations');
      console.log('   Command: SELECT');
      console.log('   Using: deleted_at IS NULL');
    } else {
      console.log('⚠️  Policy not found in pg_policies (may still be applied)');
    }

    console.log('\n📊 Next Steps:');
    console.log('   1. Run the test: npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"');
    console.log('   2. Verify test passes');
    console.log('   3. Apply to production database when ready');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

applyMigration();

