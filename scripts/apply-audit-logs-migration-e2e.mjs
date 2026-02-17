#!/usr/bin/env node

/**
 * Apply Audit Logs Migration to E2E Test Database
 * 
 * Applies migration 053_add_action_and_details_to_audit_logs.sql
 * to the E2E test database.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config({ path: '.env.e2e' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('\n🔧 Applying Audit Logs Migration to E2E Test Database\n');
  
  // Verify environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
    process.exit(1);
  }
  
  console.log('📊 Database URL:', url);
  console.log('');
  
  // Create Supabase client with service role
  const supabase = createClient(url, serviceRoleKey);
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '053_add_action_and_details_to_audit_logs.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration file loaded\n');
    
    // Check current schema
    console.log('🔍 Checking current audit_logs schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError.message);
      process.exit(1);
    }
    
    const hasActionColumn = columns && columns.length > 0 && 'action' in columns[0];
    const hasDetailsColumn = columns && columns.length > 0 && 'details' in columns[0];
    
    console.log('   action column:', hasActionColumn ? '✓ exists' : '✗ missing');
    console.log('   details column:', hasDetailsColumn ? '✓ exists' : '✗ missing');
    console.log('');
    
    if (hasActionColumn && hasDetailsColumn) {
      console.log('✅ Migration already applied - columns exist');
      console.log('');
      return;
    }
    
    // Apply migration using RPC
    console.log('🚀 Applying migration...');
    console.log('');
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length === 0) continue;
      
      console.log('   Executing:', statement.substring(0, 80) + '...');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });
      
      if (error) {
        // Try direct execution if RPC fails
        console.log('   RPC failed, trying direct execution...');
        
        // For ALTER TABLE statements, we can use the REST API
        if (statement.includes('ALTER TABLE audit_logs')) {
          console.log('   ⚠️  Cannot execute ALTER TABLE via REST API');
          console.log('   ℹ️  Please run this migration manually in Supabase SQL Editor:');
          console.log('');
          console.log(migrationSQL);
          console.log('');
          process.exit(1);
        }
      } else {
        console.log('   ✅ Statement executed successfully');
      }
    }
    
    console.log('');
    console.log('✅ Migration applied successfully');
    console.log('');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const { data: verifyColumns, error: verifyError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError.message);
      process.exit(1);
    }
    
    const hasActionAfter = verifyColumns && verifyColumns.length > 0 && 'action' in verifyColumns[0];
    const hasDetailsAfter = verifyColumns && verifyColumns.length > 0 && 'details' in verifyColumns[0];
    
    console.log('   action column:', hasActionAfter ? '✓ exists' : '✗ missing');
    console.log('   details column:', hasDetailsAfter ? '✓ exists' : '✗ missing');
    console.log('');
    
    if (hasActionAfter && hasDetailsAfter) {
      console.log('✅ Migration verified successfully');
    } else {
      console.log('⚠️  Migration may not have been applied correctly');
      console.log('   Please check the database manually');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
