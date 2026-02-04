#!/usr/bin/env node

/**
 * Script to apply soft delete migration to activities table
 * 
 * This script adds the deleted_at and deleted_by columns to the activities table
 * and updates RLS policies to filter soft-deleted records.
 * 
 * Usage:
 *   node scripts/apply-soft-delete-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumnExists(tableName, columnName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name = '${columnName}';
    `
  });

  if (error) {
    // If RPC doesn't exist, try direct query
    const { data: checkData, error: checkError } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(0);
    
    return !checkError;
  }

  return data && data.length > 0;
}

async function applySoftDeleteMigration() {
  console.log('🔍 Checking if soft delete columns exist...\n');

  // Check if deleted_at column exists
  const deletedAtExists = await checkColumnExists('activities', 'deleted_at');
  const deletedByExists = await checkColumnExists('activities', 'deleted_by');

  if (deletedAtExists && deletedByExists) {
    console.log('✅ Soft delete columns already exist on activities table');
    console.log('   - deleted_at: ✓');
    console.log('   - deleted_by: ✓');
    console.log('\n✨ No migration needed!');
    return;
  }

  console.log('📝 Soft delete columns missing. Applying migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '048_add_soft_delete_columns.sql');
  let migrationSQL;
  
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error('❌ Failed to read migration file:', error.message);
    console.error('\nPlease ensure the migration file exists at:');
    console.error(`   ${migrationPath}`);
    process.exit(1);
  }

  console.log('📄 Migration file loaded successfully');
  console.log('🚀 Applying migration to database...\n');

  // Split migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      // Execute each statement
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Results:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed. This might be expected if:');
    console.log('   - Columns already exist (IF NOT EXISTS)');
    console.log('   - Policies already exist (DROP POLICY IF EXISTS)');
    console.log('\n💡 Verify the migration manually in Supabase dashboard');
  } else {
    console.log('\n✨ Migration applied successfully!');
  }

  // Verify columns exist
  console.log('\n🔍 Verifying migration...');
  const deletedAtNow = await checkColumnExists('activities', 'deleted_at');
  const deletedByNow = await checkColumnExists('activities', 'deleted_by');

  if (deletedAtNow && deletedByNow) {
    console.log('✅ Verification successful!');
    console.log('   - deleted_at: ✓');
    console.log('   - deleted_by: ✓');
  } else {
    console.log('⚠️  Verification incomplete:');
    console.log(`   - deleted_at: ${deletedAtNow ? '✓' : '✗'}`);
    console.log(`   - deleted_by: ${deletedByNow ? '✓' : '✗'}`);
    console.log('\n💡 Please apply the migration manually via Supabase dashboard');
  }
}

// Alternative: Simple SQL approach if RPC doesn't work
async function applySimpleMigration() {
  console.log('🔄 Attempting simple migration approach...\n');

  const sql = `
    -- Add deleted_at column to activities table
    ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

    -- Add deleted_by column
    ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
  `;

  console.log('📝 SQL to execute:');
  console.log(sql);
  console.log('\n⚠️  Please copy the SQL above and run it in your Supabase dashboard:');
  console.log('   1. Go to your Supabase project');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Paste and run the SQL');
  console.log('\n📚 Full migration available at:');
  console.log('   supabase/migrations/048_add_soft_delete_columns.sql');
}

// Run migration
console.log('🚀 Soft Delete Migration Tool\n');
console.log('=' .repeat(50));

try {
  await applySoftDeleteMigration();
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\n📝 Falling back to manual instructions...\n');
  await applySimpleMigration();
}

console.log('\n' + '='.repeat(50));
console.log('✨ Done!\n');
