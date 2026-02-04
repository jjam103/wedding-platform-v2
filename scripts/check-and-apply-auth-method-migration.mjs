#!/usr/bin/env node

/**
 * Check and Apply Auth Method Migration
 * 
 * Checks if the auth_method column exists in the guests table.
 * If not, applies the migration.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthMethodColumn() {
  console.log('🔍 Checking if auth_method column exists...');
  
  // Try to query the auth_method column
  const { data, error } = await supabase
    .from('guests')
    .select('auth_method')
    .limit(1);
  
  if (error) {
    if (error.message.includes('column') && error.message.includes('auth_method') && error.message.includes('does not exist')) {
      console.log('❌ auth_method column does not exist');
      return false;
    }
    console.error('❌ Error checking column:', error.message);
    throw error;
  }
  
  console.log('✅ auth_method column exists');
  return true;
}

async function applyMigration() {
  console.log('\n📝 Applying auth_method migration...');
  
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '036_add_auth_method_fields.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  
  console.log('Migration file:', migrationPath);
  console.log('\nNote: This script cannot directly execute SQL migrations.');
  console.log('Please apply the migration using one of these methods:\n');
  console.log('1. Supabase CLI:');
  console.log('   supabase db push\n');
  console.log('2. Supabase Dashboard:');
  console.log('   - Go to SQL Editor');
  console.log('   - Paste the migration SQL');
  console.log('   - Run the query\n');
  console.log('3. Direct SQL execution:');
  console.log('   - Use your database client');
  console.log('   - Execute: supabase/migrations/036_add_auth_method_fields.sql\n');
  
  return false;
}

async function main() {
  console.log('🚀 Auth Method Migration Check');
  console.log('================================\n');
  
  try {
    const columnExists = await checkAuthMethodColumn();
    
    if (!columnExists) {
      await applyMigration();
      console.log('\n⚠️  Migration needs to be applied manually.');
      console.log('After applying the migration, run this script again to verify.');
      process.exit(1);
    }
    
    console.log('\n✅ Migration is already applied. Ready to run fix script.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
