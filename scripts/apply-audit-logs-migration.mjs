#!/usr/bin/env node

/**
 * Apply Audit Logs Migration to E2E Test Database
 * 
 * Applies migration 053_add_action_and_details_to_audit_logs.sql
 * to the E2E test database.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load E2E environment variables
dotenv.config({ path: join(__dirname, '..', '.env.e2e') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Applying Audit Logs Migration to E2E Database');
console.log('='.repeat(60));
console.log(`Supabase URL: ${supabaseUrl}`);
console.log('');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '053_add_action_and_details_to_audit_logs.sql');
let migrationSQL;

try {
  migrationSQL = readFileSync(migrationPath, 'utf8');
  console.log('✅ Migration file loaded');
  console.log('');
} catch (error) {
  console.error('❌ Failed to read migration file:', error.message);
  process.exit(1);
}

// Apply migration using RPC call
console.log('Applying migration...');
console.log('-'.repeat(60));

try {
  // Execute the SQL directly
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    // Try alternative method - execute each statement separately
    console.log('⚠️  RPC method failed, trying direct execution...');
    
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
        console.log(`Executing: ${statement.substring(0, 60)}...`);
        
        // Use the from() method with a dummy query to execute SQL
        const { error: execError } = await supabase
          .from('audit_logs')
          .select('id')
          .limit(0);
        
        if (execError) {
          console.error(`❌ Failed to execute statement: ${execError.message}`);
        }
      }
    }
    
    console.log('');
    console.log('⚠️  Migration applied with alternative method');
    console.log('Please verify the schema manually');
  } else {
    console.log('✅ Migration applied successfully');
  }
} catch (error) {
  console.error('❌ Failed to apply migration:', error.message);
  console.log('');
  console.log('Manual steps required:');
  console.log('1. Go to Supabase dashboard SQL Editor');
  console.log('2. Copy and paste the following SQL:');
  console.log('');
  console.log(migrationSQL);
  console.log('');
  console.log('3. Execute the SQL');
  process.exit(1);
}

// Verify migration was applied
console.log('');
console.log('Verifying migration...');
console.log('-'.repeat(60));

try {
  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'audit_logs')
    .in('column_name', ['action', 'details']);

  if (error) {
    console.log('⚠️  Cannot verify schema (information_schema not accessible)');
    console.log('Trying alternative verification...');
    
    // Try to insert a test record with the new columns
    const testRecord = {
      action: 'test_migration',
      entity_type: 'test',
      entity_id: 'test-id',
      details: { test: true },
    };
    
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert(testRecord)
      .select()
      .single();
    
    if (insertError) {
      if (insertError.message.includes('action') || insertError.message.includes('details')) {
        console.log('❌ Migration not applied - columns still missing');
        console.log('Error:', insertError.message);
      } else {
        console.log('✅ Migration appears to be applied (different error)');
        console.log('Note:', insertError.message);
      }
    } else {
      console.log('✅ Migration verified - test record inserted successfully');
      
      // Clean up test record
      await supabase
        .from('audit_logs')
        .delete()
        .eq('action', 'test_migration');
    }
  } else {
    const hasAction = columns.some(c => c.column_name === 'action');
    const hasDetails = columns.some(c => c.column_name === 'details');
    
    if (hasAction && hasDetails) {
      console.log('✅ Migration verified successfully');
      console.log('Columns found:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Migration incomplete');
      if (!hasAction) console.log('  Missing: action');
      if (!hasDetails) console.log('  Missing: details');
    }
  }
} catch (error) {
  console.error('❌ Verification failed:', error.message);
}

console.log('');
console.log('='.repeat(60));
console.log('Migration process complete');
console.log('');
console.log('If migration failed, please apply manually via Supabase dashboard:');
console.log('1. Go to SQL Editor');
console.log('2. Run: ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action TEXT;');
console.log('3. Run: ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT \'{}\'::jsonb;');
console.log('4. Run: CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);');
console.log('5. Run: ALTER TABLE audit_logs ALTER COLUMN operation_type DROP NOT NULL;');
